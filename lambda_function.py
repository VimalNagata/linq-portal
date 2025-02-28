import json
import boto3
import string
import random
import time
import hashlib
import os
import base64
import hmac
import jwt
import uuid
from datetime import datetime, timedelta
from urllib.parse import urlparse, quote
from botocore.exceptions import ClientError
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Constants
#USAGE_PLAN_ID = 'uxvvve'
S3_BUCKET_NAME = 'linq-red-react-app-deployments'
REACT_APP_INDEX_KEY = 'index.html'
TABLE_NAME = 'linqs'
ACCOUNTS_TABLE_NAME = 'linqs_accounts'
URL_CLICKS_TABLE_NAME = 'linqs_url_clicks'  # Table for detailed click analytics
API_USAGE_TABLE_NAME = 'linqs_api_usage'  # Table for API usage tracking
REACT_APP_URL = "https://linq-red-react-app-deployments.s3.us-east-1.amazonaws.com/index.html"
JWT_SECRET = os.environ.get('JWT_SECRET', 'development_secret_key')  # Use environment variable in production
JWT_EXPIRY = 24  # Token expiry in hours
SERVICE_EMAIL = os.environ.get('SERVICE_EMAIL', 'no-reply@linq.red')  # Email sender address
DEFAULT_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization'
}

# Initialize clients
apigateway = boto3.client('apigateway')
cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
ses = boto3.client('ses', region_name='us-east-1')

def get_react_app_version():
    try:
        # Retrieve the latest version ID for the index.html file
        response = s3.head_object(Bucket=S3_BUCKET_NAME, Key=REACT_APP_INDEX_KEY)
        version_id = response.get('VersionId', 'N/A')  # Fallback to 'N/A' if no version ID
        return version_id
    except ClientError as e:
        print(f"Error fetching React app version from S3: {e}")
        return 'Error'

def get_react_app_last_modified():
    try:
        # Retrieve the last modified timestamp for the index.html file
        response = s3.head_object(Bucket=S3_BUCKET_NAME, Key=REACT_APP_INDEX_KEY)
        last_modified = response.get('LastModified')  # Get the LastModified timestamp
        if last_modified:
            # Format the timestamp to a human-readable format, if needed
            return last_modified.strftime('%Y-%m-%d %H:%M:%S')
        else:
            return 'Unknown'
    except ClientError as e:
        print(f"Error fetching React app last modified timestamp from S3: {e}")
        return 'Error'

def log_metric(name, value, unit='Count'):
    try:
        cloudwatch.put_metric_data(
            Namespace='linq.red/Metrics',
            MetricData=[{
                'MetricName': name,
                'Unit': unit,
                'Value': value
            }]
        )
    except ClientError as e:
        print(f"CloudWatch metric error: {e}")

def build_response(status_code, body=None, extra_headers=None):
    headers = DEFAULT_HEADERS.copy()
    if extra_headers:
        headers.update(extra_headers)
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body) if body else ""
    }

def register_user(event):
    """
    Register a new user with email and password, and create an API key.

    Args:
        event (dict): Lambda event object

    Returns:
        dict: Response with status code and body
    """
    body = json.loads(event.get('body', '{}'))
    email = body.get('email')
    password = body.get('password')
    usage_plan_id = body.get('usage_plan', '0byjpr')  # Default to Free plan ID if none specified

    if not email or not password:
        return build_response(400, {'error': 'Email and password are required'})

    if len(password) < 8:
        return build_response(400, {'error': 'Password must be at least 8 characters long'})

    start_time = time.time()
    try:
        # Get the accounts table
        accounts_table = get_accounts_table()

        # Check if user already exists
        response = accounts_table.get_item(Key={'email': email})
        if 'Item' in response:
            return build_response(409, {'error': 'User already exists'})

        # Hash the password
        password_hash, salt = hash_password(password)

        # Create a new API key
        api_key_response = apigateway.create_api_key(name=email, enabled=True, generateDistinctId=True)
        api_key_id = api_key_response['id']
        api_key_value = api_key_response['value']

        # Associate the new API key with the selected usage plan
        apigateway.create_usage_plan_key(
            usagePlanId=usage_plan_id,
            keyId=api_key_id,
            keyType='API_KEY'
        )

        # Create user in DynamoDB
        accounts_table.put_item(
            Item={
                'email': email,
                'password_hash': base64.b64encode(password_hash).decode('utf-8'),
                'salt': base64.b64encode(salt).decode('utf-8'),
                'api_key_id': api_key_id,
                'api_key': api_key_value,
                'created_at': datetime.utcnow().isoformat(),
                'last_login': None
            }
        )

        # Generate JWT token
        token = generate_jwt_token(email)

        # Log metrics
        latency = time.time() - start_time
        log_metric('RegisterUserLatency', latency, 'Seconds')
        log_metric('RegisterUserSuccess', 1)

        # Return API key and token
        return build_response(201, {
            'message': 'User registered successfully',
            'api_key': api_key_value,
            'token': token
        })

    except ClientError as e:
        log_metric('RegisterUserError', 1)
        print(f"Error registering user: {str(e)}")
        return build_response(500, {'error': 'Failed to register user'})

def login_user(event):
    """
    Login a user with email and password.

    Args:
        event (dict): Lambda event object

    Returns:
        dict: Response with status code and body
    """
    body = json.loads(event.get('body', '{}'))
    email = body.get('email')
    password = body.get('password')

    if not email or not password:
        return build_response(400, {'error': 'Email and password are required'})

    start_time = time.time()
    try:
        # Get the accounts table
        accounts_table = get_accounts_table()

        # Get user from DynamoDB
        response = accounts_table.get_item(Key={'email': email})
        if 'Item' not in response:
            return build_response(401, {'error': 'Invalid email or password'})

        user = response['Item']

        # Verify password
        stored_password = base64.b64decode(user['password_hash'])
        stored_salt = base64.b64decode(user['salt'])

        if not verify_password(stored_password, stored_salt, password):
            return build_response(401, {'error': 'Invalid email or password'})

        # Update last login time
        accounts_table.update_item(
            Key={'email': email},
            UpdateExpression='SET last_login = :time',
            ExpressionAttributeValues={
                ':time': datetime.utcnow().isoformat()
            }
        )

        # Generate JWT token
        token = generate_jwt_token(email)

        # Log metrics
        latency = time.time() - start_time
        log_metric('LoginUserLatency', latency, 'Seconds')
        log_metric('LoginUserSuccess', 1)

        # Return API key and token
        return build_response(200, {
            'message': 'Login successful',
            'api_key': user['api_key'],
            'token': token
        })

    except ClientError as e:
        log_metric('LoginUserError', 1)
        print(f"Error logging in user: {str(e)}")
        return build_response(500, {'error': 'Failed to login'})

def forgot_password(event):
    """
    Handle forgotten password requests by sending the password to the user's email.

    Args:
        event (dict): Lambda event object

    Returns:
        dict: Response with status code and body
    """
    body = json.loads(event.get('body', '{}'))
    email = body.get('email')

    if not email:
        return build_response(400, {'error': 'Email is required'})

    start_time = time.time()
    try:
        # Get user data
        user = get_user_by_email(email)
        if not user:
            # Return 200 even if user doesn't exist for security reasons
            # This prevents email enumeration attacks
            return build_response(200, {'message': 'If your email exists in our system, you will receive your password shortly.'})

        # Generate a new password
        new_password = generate_secure_password()

        # Hash the new password
        password_hash, salt = hash_password(new_password)

        # Save the new password in the database
        accounts_table = get_accounts_table()
        accounts_table.update_item(
            Key={'email': email},
            UpdateExpression='SET password_hash = :hash, salt = :salt',
            ExpressionAttributeValues={
                ':hash': base64.b64encode(password_hash).decode('utf-8'),
                ':salt': base64.b64encode(salt).decode('utf-8')
            }
        )

        # Send the password to the user's email
        send_success = send_password_email(email, new_password)

        # Log metrics
        latency = time.time() - start_time
        log_metric('ForgotPasswordLatency', latency, 'Seconds')

        if send_success:
            log_metric('ForgotPasswordSuccess', 1)
            return build_response(200, {'message': 'If your email exists in our system, you will receive your password shortly.'})
        else:
            log_metric('ForgotPasswordEmailError', 1)
            return build_response(500, {'error': 'Failed to send password email'})

    except ClientError as e:
        log_metric('ForgotPasswordError', 1)
        print(f"Error processing forgot password: {str(e)}")
        return build_response(500, {'error': 'An error occurred processing your request'})

def get_user_urls(event):
    """
    Get all URLs created by the authenticated user with basic analytics.

    Args:
        event (dict): Lambda event object

    Returns:
        dict: Response with status code and body containing URLs and stats
    """
    # Authenticate request
    is_authenticated, user_email = authenticate_request(event)

    if not is_authenticated:
        return build_response(401, {'error': 'Authentication required'})

    # Parse query parameters
    query_params = event.get('queryStringParameters') or {}
    limit = int(query_params.get('limit', '50'))  # Default: 50 items per page
    next_token = query_params.get('next_token')   # For pagination

    try:
        # Get the URLs table
        urls_table = get_urls_table()

        # Prepare scan parameters to find URLs by owner_email
        scan_params = {
            'FilterExpression': 'owner_email = :email',
            'ExpressionAttributeValues': {':email': user_email},
            'Limit': limit
        }

        # Add pagination token if provided
        if next_token:
            scan_params['ExclusiveStartKey'] = json.loads(base64.b64decode(next_token).decode('utf-8'))

        # Execute the scan
        response = urls_table.scan(**scan_params)

        # Process results
        items = response.get('Items', [])

        # Format URLs with basic stats
        urls = []
        for item in items:
            # Get additional click analytics if available
            url_stats = {
                'short_code': item.get('short_code'),
                'short_url': f"https://linq.red/{item.get('short_code')}",
                'long_url': item.get('long_url'),
                'created_at': item.get('creation_date'),
                'status': item.get('status'),
                'total_clicks': item.get('usage_count', 0)
            }
            urls.append(url_stats)

        # Prepare pagination token for next page
        pagination = {}
        if 'LastEvaluatedKey' in response:
            pagination['next_token'] = base64.b64encode(
                json.dumps(response['LastEvaluatedKey'], default=str).encode('utf-8')
            ).decode('utf-8')

        return build_response(200, {
            'urls': urls,
            'count': len(urls),
            'pagination': pagination
        })

    except Exception as e:
        print(f"Error getting user URLs: {str(e)}")
        return build_response(500, {'error': 'Failed to retrieve URLs'})

def get_url_analytics(event):
    """
    Get detailed analytics for a specific shortened URL.

    Args:
        event (dict): Lambda event object

    Returns:
        dict: Response with detailed analytics data
    """
    # Authenticate request
    is_authenticated, user_email = authenticate_request(event)

    if not is_authenticated:
        return build_response(401, {'error': 'Authentication required'})

    # Parse parameters
    query_params = event.get('queryStringParameters') or {}
    short_code = query_params.get('short_code')

    if not short_code:
        return build_response(400, {'error': 'Short code is required'})

    # Verify URL ownership
    try:
        urls_table = get_urls_table()
        url_response = urls_table.get_item(Key={'short_code': short_code})

        if 'Item' not in url_response:
            return build_response(404, {'error': 'URL not found'})

        url_item = url_response['Item']

        # Check ownership
        if url_item.get('owner_email') != user_email:
            return build_response(403, {'error': 'You do not have permission to view this URL'})

        # Get click analytics
        clicks_table = get_analytics_table(URL_CLICKS_TABLE_NAME, 'short_code', 'timestamp')

        # Query for click data (last 30 days by default)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()

        clicks_response = clicks_table.query(
            KeyConditionExpression='short_code = :sc AND #ts >= :start_date',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':sc': short_code,
                ':start_date': thirty_days_ago
            }
        )

        click_data = clicks_response.get('Items', [])

        # Prepare analytics summaries
        referrer_stats = {}
        country_stats = {}
        device_stats = {}
        daily_clicks = {}

        for click in click_data:
            # Referrer summary
            referrer = click.get('referrer', 'Direct')
            referrer_stats[referrer] = referrer_stats.get(referrer, 0) + 1

            # Country summary
            country = click.get('country', 'Unknown')
            country_stats[country] = country_stats.get(country, 0) + 1

            # Device summary
            device = click.get('device_type', 'unknown')
            device_stats[device] = device_stats.get(device, 0) + 1

            # Daily clicks
            date_only = click.get('timestamp', '').split('T')[0]
            daily_clicks[date_only] = daily_clicks.get(date_only, 0) + 1

        # URL basic info
        url_info = {
            'short_code': short_code,
            'short_url': f"https://linq.red/{short_code}",
            'long_url': url_item.get('long_url'),
            'created_at': url_item.get('creation_date'),
            'total_clicks': url_item.get('usage_count', 0),
            'status': url_item.get('status')
        }

        # Return comprehensive analytics
        return build_response(200, {
            'url': url_info,
            'analytics': {
                'total_clicks_analyzed': len(click_data),
                'referrers': [{'source': k, 'count': v} for k, v in referrer_stats.items()],
                'countries': [{'country': k, 'count': v} for k, v in country_stats.items()],
                'devices': [{'type': k, 'count': v} for k, v in device_stats.items()],
                'daily_clicks': [{'date': k, 'count': v} for k, v in daily_clicks.items()]
            }
        })

    except Exception as e:
        print(f"Error retrieving URL analytics: {str(e)}")
        return build_response(500, {'error': 'Failed to retrieve analytics'})

def get_user_profile(event):
    """
    Get a user's profile information.

    Args:
        event (dict): Lambda event object

    Returns:
        dict: Response with status code and body
    """
    # Extract authorization header
    headers = event.get('headers', {})
    auth_header = headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return build_response(401, {'error': 'Authorization token is required'})

    token = auth_header.split(' ')[1]
    payload = verify_jwt_token(token)

    if not payload:
        return build_response(401, {'error': 'Invalid or expired token'})

    email = payload['email']

    try:
        # Get user from DynamoDB
        accounts_table = get_accounts_table()
        response = accounts_table.get_item(Key={'email': email})

        if 'Item' not in response:
            return build_response(404, {'error': 'User not found'})

        user = response['Item']

        # Remove sensitive information
        user.pop('password_hash', None)
        user.pop('salt', None)

        # Add URL count
        try:
            urls_table = get_urls_table()
            url_count_response = urls_table.scan(
                FilterExpression='owner_email = :email',
                ExpressionAttributeValues={':email': email},
                Select='COUNT'
            )
            user['url_count'] = url_count_response.get('Count', 0)

            # Get clicks data
            total_clicks = 0
            if user['url_count'] > 0:
                # Scan for all user's URLs to get total clicks
                urls_response = urls_table.scan(
                    FilterExpression='owner_email = :email',
                    ExpressionAttributeValues={':email': email},
                    ProjectionExpression='usage_count'
                )
                for url_item in urls_response.get('Items', []):
                    total_clicks += url_item.get('usage_count', 0)

            user['total_clicks'] = total_clicks
        except Exception as e:
            print(f"Error getting URL stats: {str(e)}")
            user['url_count'] = 0
            user['total_clicks'] = 0

        # Try to get API usage information
        try:
            # Get API usage from API Gateway if available
            # In production, you'd use API Gateway API to get actual usage data
            # This is simplified for demo purposes
            user['api_usage'] = {
                'current_usage': user.get('url_count', 0) * 2,  # Rough estimate: 2 API calls per URL
                'limit': 1000,  # Example limit based on usage plan
                'reset_date': (datetime.utcnow() + timedelta(days=30)).isoformat()
            }
        except Exception as e:
            print(f"Error getting API usage: {str(e)}")
            user['api_usage'] = {'current_usage': 0, 'limit': 1000}

        return build_response(200, {'user': user})

    except ClientError as e:
        print(f"Error getting user profile: {str(e)}")
        return build_response(500, {'error': 'Failed to get user profile'})


def get_or_create_table(table_name, key_schema, attribute_definitions):
    """
    Get or create a DynamoDB table with the given specifications.

    Args:
        table_name (str): Name of the table
        key_schema (list): Key schema for the table
        attribute_definitions (list): Attribute definitions for the table

    Returns:
        Table: The DynamoDB table resource
    """
    try:
        table = dynamodb.Table(table_name)
        table.load()
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            table = dynamodb.create_table(
                TableName=table_name,
                KeySchema=key_schema,
                AttributeDefinitions=attribute_definitions,
                ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            )
            table.wait_until_exists()
        else:
            raise
    return table

def get_urls_table():
    """Get or create the URLs table"""
    key_schema = [{'AttributeName': 'short_code', 'KeyType': 'HASH'}]
    attribute_definitions = [{'AttributeName': 'short_code', 'AttributeType': 'S'}]
    return get_or_create_table(TABLE_NAME, key_schema, attribute_definitions)

def get_accounts_table():
    """Get or create the accounts table"""
    key_schema = [{'AttributeName': 'email', 'KeyType': 'HASH'}]
    attribute_definitions = [{'AttributeName': 'email', 'AttributeType': 'S'}]
    return get_or_create_table(ACCOUNTS_TABLE_NAME, key_schema, attribute_definitions)

def get_analytics_table(table_name, hash_key, range_key=None):
    """
    Get or create an analytics table with the specified name and key structure.

    Args:
        table_name (str): The name of the table
        hash_key (str): The partition key attribute name
        range_key (str, optional): The sort key attribute name

    Returns:
        Table: The DynamoDB table resource
    """
    if range_key:
        # Composite key (hash + range)
        key_schema = [
            {'AttributeName': hash_key, 'KeyType': 'HASH'},
            {'AttributeName': range_key, 'KeyType': 'RANGE'}
        ]
        attribute_definitions = [
            {'AttributeName': hash_key, 'AttributeType': 'S'},
            {'AttributeName': range_key, 'AttributeType': 'S'}
        ]
    else:
        # Simple key (hash only)
        key_schema = [{'AttributeName': hash_key, 'KeyType': 'HASH'}]
        attribute_definitions = [{'AttributeName': hash_key, 'AttributeType': 'S'}]

    return get_or_create_table(table_name, key_schema, attribute_definitions)

def hash_password(password, salt=None):
    """
    Hash a password using PBKDF2 with SHA-256.

    Args:
        password (str): The password to hash
        salt (bytes, optional): Salt for hashing. If None, a new random salt is generated.

    Returns:
        tuple: (hashed_password, salt)
    """
    if salt is None:
        salt = os.urandom(32)  # 32 bytes of random salt

    # Use PBKDF2 with 100,000 iterations of SHA-256
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )

    return key, salt

def verify_password(stored_password, stored_salt, provided_password):
    """
    Verify a password against its hash.

    Args:
        stored_password (bytes): The stored password hash
        stored_salt (bytes): The salt used to hash the stored password
        provided_password (str): The password to verify

    Returns:
        bool: True if the password matches, False otherwise
    """
    key, _ = hash_password(provided_password, stored_salt)
    return hmac.compare_digest(key, stored_password)

def generate_jwt_token(email):
    """
    Generate a JWT token for the given email.

    Args:
        email (str): User's email

    Returns:
        str: JWT token
    """
    payload = {
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    return token

def verify_jwt_token(token):
    """
    Verify a JWT token.

    Args:
        token (str): JWT token to verify

    Returns:
        dict or None: Payload if token is valid, None otherwise
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.PyJWTError as e:
        print(f"JWT verification error: {e}")
        return None

def lambda_handler(event, context):
    """
    Main Lambda handler function.

    Args:
        event (dict): Lambda event object
        context (LambdaContext): Lambda context object

    Returns:
        dict: Response with status code and body
    """
    # Log the entire incoming event for debugging
    print("Received event:", json.dumps(event, indent=2))

    http_method = event.get('httpMethod')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action')
    path = event.get('path', '')

    print(f"Processing request: method={http_method}, path={path}, action={action}")

    # Handle CORS preflight requests
    if http_method == 'OPTIONS':
        return build_response(200)

    # Handle base path - serve HTML with React app iframe
    if http_method == "GET" and path == "/":
        react_app_version = get_react_app_version()
        react_app_last_modified = get_react_app_last_modified()
        lambda_version = context.function_version

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "text/html", **DEFAULT_HEADERS},
            "body": f"""
                <html>
                <head>
                    <title>linq.red</title>
                    <style>
                        body, html {{
                            margin: 0;
                            padding: 0;
                            height: 100%;
                            font-family: Arial, sans-serif;
                        }}
                        iframe {{
                            border: none;
                            width: 100vw;
                            height: calc(100vh - 40px);
                        }}
                        footer {{
                            height: 40px;
                            background-color: #333;
                            color: #f1f1f1;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 0 20px;
                            font-size: 0.8em;
                        }}
                    </style>
                </head>
                <body>
                    <iframe src="https://{S3_BUCKET_NAME}.s3.amazonaws.com/{REACT_APP_INDEX_KEY}"></iframe>
                    <footer>
                        <span>React App Version: {react_app_last_modified}</span>
                        <span>Lambda Version: {lambda_version}</span>
                    </footer>
                </body>
                </html>
            """
        }

    # User authentication and management endpoints
    elif http_method == 'POST' and path == '/auth/register':
        return register_user(event)
    elif http_method == 'POST' and path == '/auth/login':
        return login_user(event)
    elif http_method == 'POST' and path == '/auth/forgot-password':
        return forgot_password(event)
    elif http_method == 'GET' and path == '/auth/profile':
        return get_user_profile(event)

    # URL shortening endpoints
    elif http_method == 'POST' and path == '/urls':
        return shorten_url(event)
    elif http_method == 'GET' and path == '/urls':
        # Get user's URLs with basic stats
        return get_user_urls(event)
    elif http_method == 'GET' and path == '/urls/analytics':
        # Get detailed analytics for a specific URL
        return get_url_analytics(event)

    # API endpoints that are not for redirection should be checked first
    elif http_method == 'POST' and action == 'register':
        return build_response(301, {'message': 'Please use /auth/register endpoint'}, {'Location': '/auth/register'})

    # Check if this is a short URL redirect request
    # This should be the last check before returning method not allowed
    elif http_method == 'GET':
        # First, check if this is a known API path that should NOT be treated as a short code
        known_api_paths = ['/auth/', '/urls', '/api/']
        is_api_path = path == '/' or any(path.startswith(prefix) for prefix in known_api_paths)

        # Special case: direct path access (likely a short URL)
        if not is_api_path:
            print(f"Handling potential URL redirection for path: {path}")

            # Just pass the event directly to retrieve_url
            # The function will extract the short code in multiple ways
            return retrieve_url(event)

    # Fallback for unsupported methods/paths
    print(f"No matching handler for method={http_method}, path={path}")
    return build_response(405, {'error': 'Method not allowed'})


# Function to generate a random short code
def generate_short_code(length=6):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

# Function to generate a secure random password
def generate_secure_password(length=12):
    """
    Generate a secure random password with at least one uppercase letter,
    one lowercase letter, one digit, and one special character.

    Args:
        length (int): The length of the password (minimum 8)

    Returns:
        str: A secure random password
    """
    if length < 8:
        length = 8  # Minimum secure length

    # Character sets
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special = '!@#$%^&*()-_=+[]{}|;:,.<>?'

    # Ensure at least one of each character type
    password = [
        random.choice(uppercase),
        random.choice(lowercase),
        random.choice(digits),
        random.choice(special)
    ]

    # Fill the rest with random characters from all sets
    all_chars = uppercase + lowercase + digits + special
    password.extend(random.choice(all_chars) for _ in range(length - 4))

    # Shuffle the password characters
    random.shuffle(password)

    return ''.join(password)

def authenticate_request(event):
    """
    Authenticate a request using JWT token or API key.

    Args:
        event (dict): Lambda event object

    Returns:
        tuple: (is_authenticated, user_email)
    """
    headers = event.get('headers', {})

    # Method 1: Try JWT token authentication
    auth_header = headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        if payload:
            return True, payload['email']

    # Method 2: Try API key authentication
    api_key = headers.get('x-api-key')
    if api_key:
        # Find the user associated with this API key
        accounts_table = get_accounts_table()
        try:
            # Scan for users with this API key (inefficient but works for small tables)
            response = accounts_table.scan(
                FilterExpression='api_key = :api_key',
                ExpressionAttributeValues={':api_key': api_key}
            )
            items = response.get('Items', [])
            if items:
                # Found a user with this API key
                return True, items[0]['email']
        except Exception as e:
            print(f"Error checking API key: {str(e)}")

    # No valid authentication found
    return False, None

def get_user_by_email(email):
    """
    Get a user by email.

    Args:
        email (str): User email

    Returns:
        dict or None: User data if found, None otherwise
    """
    accounts_table = get_accounts_table()
    response = accounts_table.get_item(Key={'email': email})
    return response.get('Item')

def send_password_email(email, password):
    """
    Send an email with the user's password.

    Args:
        email (str): Recipient's email address
        password (str): User's password

    Returns:
        bool: True if the email was sent successfully, False otherwise
    """
    try:
        # Create the email message
        msg = MIMEMultipart()
        msg['Subject'] = 'Your Password for Linq.red'
        msg['From'] = SERVICE_EMAIL
        msg['To'] = email

        # Create the HTML body
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background-color: #f44336; color: white; padding: 10px; text-align: center; }}
                .content {{ padding: 20px; }}
                .footer {{ font-size: 12px; color: #999; text-align: center; margin-top: 20px; }}
                .password {{ background: #f5f5f5; padding: 10px; font-family: monospace; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Your Linq.red Password</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>You requested your password for your Linq.red account. Here it is:</p>
                    <div class="password">{password}</div>
                    <p>For security reasons, we recommend changing your password after logging in.</p>
                    <p>If you did not request this password, please ignore this email.</p>
                    <p>Thank you,<br>The Linq.red Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Attach the HTML content
        msg.attach(MIMEText(html_body, 'html'))

        # Create a simple text version as fallback
        text_body = f"""
        Your Linq.red Password

        Hello,

        You requested your password for your Linq.red account. Here it is:

        {password}

        For security reasons, we recommend changing your password after logging in.

        If you did not request this password, please ignore this email.

        Thank you,
        The Linq.red Team

        This is an automated message, please do not reply to this email.
        """
        msg.attach(MIMEText(text_body, 'plain'))

        # Send the email
        response = ses.send_raw_email(
            Source=SERVICE_EMAIL,
            Destinations=[email],
            RawMessage={'Data': msg.as_string()}
        )

        print(f"Email sent to {email}, message ID: {response.get('MessageId')}")
        return True

    except ClientError as e:
        print(f"Error sending email: {str(e)}")
        return False

def shorten_url(event):
    """
    Create a shortened URL. Requires authentication.

    Args:
        event (dict): Lambda event object

    Returns:
        dict: Response with status code and body
    """
    # Authenticate the request
    is_authenticated, user_email = authenticate_request(event)

    if not is_authenticated:
        return build_response(401, {'error': 'Authentication required'})

    # Get user data
    user = get_user_by_email(user_email)
    if not user:
        return build_response(401, {'error': 'User not found'})

    # Parse request body
    body = json.loads(event.get('body', '{}'))
    long_url = body.get('long_url')

    if not long_url:
        return build_response(400, {'error': 'Long URL is required'})

    # Validate URL format
    try:
        parsed_url = urlparse(long_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            return build_response(400, {'error': 'Invalid URL format'})
    except Exception:
        return build_response(400, {'error': 'Invalid URL format'})

    # Get the API key from the user's profile
    api_key = user.get('api_key')

    # If we somehow don't have the API key in the user profile, try getting it from headers
    if not api_key:
        api_key = event.get('headers', {}).get('x-api-key')

    if not api_key:
        return build_response(403, {'error': 'API Key is required'})

    # Generate a unique short code
    short_code = body.get('custom_code') or generate_short_code(6)
    urls_table = get_urls_table()
    start_time = time.time()

    try:
        # Check if custom short code exists
        if body.get('custom_code'):
            response = urls_table.get_item(Key={'short_code': short_code})
            if 'Item' in response:
                return build_response(409, {'error': 'Custom short code already exists'})

        # Add short code, long URL, creation date, usage count, status, API key, and owner email to the DynamoDB table
        urls_table.put_item(
            Item={
                'short_code': short_code,
                'long_url': long_url,
                'creation_date': datetime.utcnow().isoformat(),
                'usage_count': 0,
                'status': 'active',
                'api_key': api_key,  # Store the API key used to create the shortened URL
                'owner_email': user_email  # Store the owner's email
            },
            ConditionExpression='attribute_not_exists(short_code)'  # Ensure no duplicate short codes
        )

        # Log metrics and return response
        latency = time.time() - start_time
        log_metric('ShortenURLLatency', latency, 'Seconds')
        log_metric('ShortenURLSuccess', 1)

        return build_response(200, {
            'short_url': f'https://linq.red/{short_code}',
            'short_code': short_code,
            'long_url': long_url,
            'creation_date': datetime.utcnow().isoformat()
        })
    except ClientError as e:
        # Log error metrics and return error response
        log_metric('ShortenURLError', 1)
        print(f"Error shortening URL: {str(e)}")
        return build_response(500, {'error': 'Failed to create shortened URL'})

def retrieve_url(event):
    """
    Retrieve and redirect to the original URL for a given short code.

    Args:
        event (dict): Lambda event object

    Returns:
        dict: HTTP redirect response or error response
    """
    # Debug log the entire event
    print(f"Retrieve URL event: {json.dumps(event, indent=2)}")

    # Try multiple ways to extract the short code
    short_code = None

    # Method 1: Try from pathParameters
    path_params = event.get('pathParameters', {}) or {}
    if path_params and 'short_code' in path_params:
        short_code = path_params.get('short_code')
        print(f"Extracted short code from pathParameters: {short_code}")

    # Method 2: Try from the path
    if not short_code and 'path' in event:
        path = event.get('path', '')
        # Skip leading slash
        path_short_code = path[1:] if path.startswith('/') else path
        if path_short_code and path_short_code != '/':
            short_code = path_short_code
            print(f"Extracted short code from path: {short_code}")

    # Method 3: Try from the resource path
    if not short_code and 'resource' in event:
        resource = event.get('resource', '')
        if resource and resource != '/' and resource != '/{proxy+}':
            resource_short_code = resource[1:] if resource.startswith('/') else resource
            short_code = resource_short_code
            print(f"Extracted short code from resource: {short_code}")

    # Method 4: Try from the URL itself
    if not short_code and 'requestContext' in event and 'http' in event['requestContext']:
        http_context = event['requestContext']['http']
        if 'path' in http_context:
            http_path = http_context['path']
            http_short_code = http_path[1:] if http_path.startswith('/') else http_path
            if http_short_code and http_short_code != '/':
                short_code = http_short_code
                print(f"Extracted short code from HTTP context: {short_code}")

    print(f"Final extracted short code: {short_code}")

    if not short_code:
        return build_response(400, {'error': 'Short code is required'})

    # Use the correct table getter
    urls_table = get_urls_table()
    start_time = time.time()

    try:
        print(f"Looking up short code: {short_code}")
        response = urls_table.get_item(Key={'short_code': short_code})
        item = response.get('Item')
        print(f"DynamoDB response: {json.dumps(response, default=str)}")

        if item and item['status'] == 'active':
            # Update the usage count atomically
            print(f"Found active URL: {item.get('long_url')}")
            urls_table.update_item(
                Key={'short_code': short_code},
                UpdateExpression='SET usage_count = if_not_exists(usage_count, :zero) + :inc',
                ExpressionAttributeValues={
                    ':zero': 0,
                    ':inc': 1
                }
            )

            # Track detailed analytics about this click
            try:
                # Extract useful information from the request
                headers = event.get('headers', {}) or {}
                request_context = event.get('requestContext', {}) or {}

                # Get referrer information
                referrer = headers.get('Referer') or headers.get('referer', 'Direct')

                # Get user agent
                user_agent = headers.get('User-Agent') or headers.get('user-agent', 'Unknown')

                # Get IP address and location info if available
                ip_address = None
                if 'identity' in request_context:
                    ip_address = request_context.get('identity', {}).get('sourceIp', 'Unknown')
                elif 'http' in request_context:
                    ip_address = request_context.get('http', {}).get('sourceIp', 'Unknown')

                # Try to get country/region information
                country = headers.get('CloudFront-Viewer-Country', 'Unknown')

                # Store detailed click information
                clicks_table = get_analytics_table(URL_CLICKS_TABLE_NAME, 'short_code', 'timestamp')
                clicks_table.put_item(
                    Item={
                        'short_code': short_code,
                        'timestamp': datetime.utcnow().isoformat(),
                        'referrer': referrer,
                        'user_agent': user_agent,
                        'ip_address': ip_address or 'Unknown',
                        'country': country,
                        'owner_email': item.get('owner_email', 'Unknown'),
                        'device_type': 'desktop' if 'desktop' in user_agent.lower() else
                                     ('mobile' if any(mobile in user_agent.lower() for mobile in ['mobile', 'android', 'iphone', 'ipad']) else 'unknown')
                    }
                )
                print(f"Recorded click analytics for {short_code}")
            except Exception as e:
                # Don't fail the redirect if analytics tracking fails
                print(f"Error recording click analytics: {str(e)}")

            latency = time.time() - start_time
            log_metric('RetrieveURLLatency', latency, 'Seconds')
            log_metric('RetrieveURLSuccess', 1)

            # Ensure long_url has a proper scheme
            long_url = item['long_url']
            if not (long_url.startswith('http://') or long_url.startswith('https://')):
                long_url = 'https://' + long_url

            # Return a 301 Moved Permanently redirect
            return build_response(301, {}, {'Location': long_url})
        elif item:
            print(f"URL found but inactive: {short_code}")
            return build_response(403, {'error': 'This link is inactive'})

        print(f"Short code not found: {short_code}")
        return build_response(404, {'error': 'Short code not found'})
    except ClientError as e:
        error_msg = str(e)
        print(f"DynamoDB error: {error_msg}")
        log_metric('RetrieveURLError', 1)
        return build_response(500, {'error': error_msg})
    except Exception as e:
        error_msg = str(e)
        print(f"Unexpected error: {error_msg}")
        log_metric('RetrieveURLError', 1)
        return build_response(500, {'error': 'An unexpected error occurred'})
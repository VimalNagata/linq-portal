import json
import boto3
import string
import random
import time
from datetime import datetime
from urllib.parse import urlparse
from botocore.exceptions import ClientError

# Constants
#USAGE_PLAN_ID = 'uxvvve'
S3_BUCKET_NAME = 'linq-red-react-app-deployments'
REACT_APP_INDEX_KEY = 'index.html'
TABLE_NAME = 'linqs'
REACT_APP_URL = "https://linq-red-react-app-deployments.s3.us-east-1.amazonaws.com/index.html"
DEFAULT_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
}

# Initialize clients
apigateway = boto3.client('apigateway')
cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

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

# Lambda function update
def register_api_key(event):
    body = json.loads(event.get('body', '{}'))
    email = body.get('email')

    usage_plan_id = body.get('usage_plan', '0byjpr')  # Default to Free plan ID if none specified


    if not email:
        return build_response(400, {'error': 'Email is required'})

    start_time = time.time()
    try:
        # Check if an API key with the same email already exists
        existing_keys = apigateway.get_api_keys(nameQuery=email, includeValues=True)
        if existing_keys['items']:
            api_key_value = existing_keys['items'][0]['value']
            print(f"API key for {email} already exists. Returning existing key.")
            return build_response(200, {'api_key': api_key_value})

        # Create a new API key if none exists
        api_key_response = apigateway.create_api_key(name=email, enabled=True, generateDistinctId=True)
        api_key_id = api_key_response['id']

        # Associate the new API key with the selected usage plan
        apigateway.create_usage_plan_key(
            usagePlanId=usage_plan_id,
            keyId=api_key_id,
            keyType='API_KEY'
        )

        # Log latency and success
        latency = time.time() - start_time
        log_metric('RegisterAPIKeyLatency', latency, 'Seconds')
        log_metric('RegisterAPIKeySuccess', 1)

        # Return the new API key
        return build_response(200, {'api_key': api_key_response['value']})

    except ClientError as e:
        log_metric('RegisterAPIKeyError', 1)
        return build_response(500, {'error': str(e)})


def get_or_create_table():
    try:
        table = dynamodb.Table(TABLE_NAME)
        table.load()
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            table = dynamodb.create_table(
                TableName=TABLE_NAME,
                KeySchema=[{'AttributeName': 'short_code', 'KeyType': 'HASH'}],
                AttributeDefinitions=[{'AttributeName': 'short_code', 'AttributeType': 'S'}],
                ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            )
            table.wait_until_exists()
        else:
            raise
    return table

def lambda_handler(event, context):
    # Log the entire incoming event for debugging
    print("Received event:", json.dumps(event, indent=2))

    http_method = event.get('httpMethod')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action')
    path = event.get('path')
    
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
    elif http_method == 'POST' and action == 'register':
        return register_api_key(event)
    elif http_method == 'POST':
        return shorten_url(event)
    elif http_method == 'GET':
        return retrieve_url(event)
    return build_response(405, {'error': 'Method not allowed'})


# Function to generate a random short code
def generate_short_code(length=6):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def shorten_url(event):
    # Parse request body
    body = json.loads(event.get('body', '{}'))
    long_url = body.get('long_url')
    if not long_url:
        return build_response(400, {'error': 'Long URL is required'})

    # Extract the API key from the request headers
    api_key = event['headers'].get('x-api-key')
    if not api_key:
        return build_response(403, {'error': 'API Key is required'})

    # Generate a unique short code
    short_code = generate_short_code(6)
    table = get_or_create_table()
    start_time = time.time()

    try:
        # Add short code, long URL, creation date, usage count, status, and API key to the DynamoDB table
        table.put_item(
            Item={
                'short_code': short_code,
                'long_url': long_url,
                'creation_date': datetime.utcnow().isoformat(),
                'usage_count': 0,
                'status': 'active',
                'api_key': api_key  # Store the API key used to create the shortened URL
            },
            ConditionExpression='attribute_not_exists(short_code)'  # Ensure no duplicate short codes
        )

        # Generate QR code for the shortened URL
        #qr_code_base64 = generate_qr_code(short_code)

        # Log metrics and return response
        latency = time.time() - start_time
        log_metric('ShortenURLLatency', latency, 'Seconds')
        log_metric('ShortenURLSuccess', 1)
        
        return build_response(200, {
            'short_url': f'https://linq.red/{short_code}'
            })
    except ClientError as e:
        # Log error metrics and return error response
        log_metric('ShortenURLError', 1)
        return build_response(500, {'error': str(e)})

def retrieve_url(event):
    short_code = event['pathParameters'].get('short_code')
    if not short_code:
        return build_response(400, {'error': 'Short code is required'})

    table = get_or_create_table()
    start_time = time.time()
    try:
        response = table.get_item(Key={'short_code': short_code})
        item = response.get('Item')
        
        if item and item['status'] == 'active':
            # Update the usage count atomically
            table.update_item(
                Key={'short_code': short_code},
                UpdateExpression='SET usage_count = if_not_exists(usage_count, :zero) + :inc',
                ExpressionAttributeValues={
                    ':zero': 0,
                    ':inc': 1
                }
            )
            
            latency = time.time() - start_time
            log_metric('RetrieveURLLatency', latency, 'Seconds')
            log_metric('RetrieveURLSuccess', 1)
            return build_response(301, {}, {'Location': item['long_url']})
        elif item:
            return build_response(403, {'error': 'This link is inactive'})
        return build_response(404, {'error': 'Short code not found'})
    except ClientError as e:
        log_metric('RetrieveURLError', 1)
        return build_response(500, {'error': str(e)})
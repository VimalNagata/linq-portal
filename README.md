# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

URL Shortening Service: Detailed Design Document

Version: 1.0
Owner: Vimal
Repositories:

	•	Backend GitHub Repo: urlshortener
	•	Frontend GitHub Repo: linq-portal

Overview

This document provides a comprehensive breakdown of the URL shortening service, built for scalability, security, and ease of use. The service supports URL shortening and redirection, secured API key management, and usage monitoring, with the user interface designed in React. The backend infrastructure relies on AWS Lambda, DynamoDB, and API Gateway for a serverless, managed experience, while front-end and back-end deployments are automated via AWS CodePipeline.

Architectural Components and Design Details

1. DynamoDB Table: linqs

	•	Purpose: Persistent storage for shortened URLs, ensuring unique short codes and fast retrieval.
	•	Table Structure:
	•	Partition Key: short_code (String) – unique code for each short URL.
	•	Attributes:
	•	api_key: API key that generated the shortened URL.
	•	creation_date: Timestamp in ISO 8601 format when the URL was created.
	•	long_url: Original destination URL.
	•	status: Status of the URL (e.g., “active” or “inactive”).
	•	Provisioned Capacity:
	•	Read Capacity Units: 5 (Auto-scaling: Off)
	•	Write Capacity Units: 5 (Auto-scaling: Off)
	•	Design Rationale:
	•	Since the anticipated access pattern is predictable with limited requests, DynamoDB auto-scaling is off to maintain controlled operational costs.
	•	Conditional write operations ensure the uniqueness of short_code.

2. AWS Lambda Backend

	•	GitHub Repository: Backend Source
	•	Handler: lambda_handler(event, context)
	•	Libraries: boto3 for AWS service access, json, random, datetime, urlparse for URL processing.
	•	Environment Variables:
	•	TABLE_NAME for DynamoDB table.
	•	S3_BUCKET_NAME and REACT_APP_INDEX_KEY for S3-hosted React app.
	•	Main Functions:
	•	generate_short_code: Produces a unique, 6-character alphanumeric code.
	•	shorten_url: Creates a new short URL and saves the relevant data in DynamoDB.
	•	retrieve_url: Fetches the original URL for redirection based on short_code.
	•	register_api_key: Registers new users for API key access.
	•	Metrics & Logging:
	•	Latency and Error Metrics: Sent to CloudWatch for monitoring under linq.red/Metrics.
	•	Metric Logging Helper: log_metric function standardizes CloudWatch metric pushes.
	•	Response Management:
	•	CORS Headers: Managed by build_response to include Access-Control-Allow-* settings.
	•	Response Codes:
	•	200: Success (e.g., URL successfully shortened).
	•	301: Redirect (for successful URL retrieval).
	•	400: Bad Request (e.g., missing parameters).
	•	403: Forbidden (e.g., missing or invalid API key).
	•	500: Server Error (for unexpected issues).
	•	CloudWatch Integration: Tracks metrics such as latency, success, and error counts.

3. API Gateway Configuration

	•	API: URLShortnerRest – serves as the entry point for HTTP requests.
	•	Resources:
	•	Root (/):
	•	GET: Renders the frontend React app from the S3 bucket.
	•	POST: Used for two main actions:
	•	Register API Key (action=register)
	•	URL Shortening (shorten_url)
	•	Short Code Path (/{short_code}):
	•	GET: Retrieves and redirects to the long_url associated with short_code.
	•	Stage: RestProd – Publicly accessible endpoint, e.g., https://20zfo33oh0.execute-api.us-east-1.amazonaws.com/RestProd
	•	Usage Plans:
	•	InternalUsagePlan: For unlimited internal use, mainly for API key registration.
	•	FreeUsagePlan-8: Up to 8 requests per day.
	•	StarterUsagePlan-32: Up to 32 requests per day.
	•	AdvancedUsagePlan-256: Up to 256 requests per day.
	•	EnterpriseUsagePlan-65536: Up to 65,536 requests per day.

4. Route 53 and Custom Domain

	•	Domain: linq.red
	•	TLS Configuration: Enforced via TLS 1.2 using an AWS ACM certificate.
	•	API Gateway Domain Name: d-xfo5bw0zsi.execute-api.us-east-1.amazonaws.com
	•	Certificate ARN: arn:aws:acm:us-east-1:390844768511:certificate/49f70c21-f743-485a-be9e-aaa20c98b5f3
	•	Design Consideration: Custom domain and secure HTTPS configuration enhance user trust and security.

5. React Frontend Portal

	•	GitHub Repository: Frontend Source
	•	Primary Components:
	•	ShortenURL: Main interface for URL input and API interaction for URL shortening.
	•	Features:
	•	QR code generation for each shortened URL.
	•	QR code download as SVG.
	•	Retry mechanism with a fallback API key for enhanced user experience.
	•	RegisterAPIKey: Form for users to register and obtain an API key.
	•	Features:
	•	Input validation.
	•	Dropdown selection for usage plans.
	•	API key copy functionality.
	•	Error Handling and Retry Logic:
	•	Fallback API key and retry loop enhance reliability for API key retrieval and URL shortening.
	•	Main Application: App.js organizes the layout, routes, and navigation.
	•	Libraries: react-icons, qrcode.react for iconography and QR code rendering.

6. Deployment with AWS CodePipeline

	•	Backend Pipeline: DeployURLShortener
	•	Type: V2
	•	Execution Mode: QUEUED
	•	Linked Repository: GitHub - urlshortener
	•	Trigger: Commits to the master branch automatically trigger deployments.
	•	Frontend Pipeline: linq-portal-deployment
	•	Type: V2
	•	Execution Mode: QUEUED
	•	Linked Repository: GitHub - linq-portal
	•	Trigger: Commits to the master branch automatically trigger deployments.
	•	CodePipeline Design Rationale: Automated deployment pipelines ensure that changes are consistently and reliably deployed to production without manual intervention.

Monitoring and Operational Excellence

CloudWatch Metrics

	•	Metrics:
	•	RegisterAPIKeyLatency, ShortenURLLatency, RetrieveURLLatency
	•	RegisterAPIKeySuccess, ShortenURLSuccess, RetrieveURLSuccess
	•	RegisterAPIKeyError, ShortenURLError, RetrieveURLError
	•	Logging:
	•	CloudWatch Logs: Lambda functions output incoming events, responses, and errors for debugging and auditing.
	•	Metric Logging: log_metric function standardizes the metric data structure, supporting consistent metrics across the service.
	•	Dashboard: Custom CloudWatch dashboard visualizing real-time performance, error rates, and latency for each function.

Summary

The URL shortening service design prioritizes efficiency, security, and scalability, leveraging AWS’s managed services to support a reliable serverless environment. Key elements include automated deployments, robust usage monitoring, retry logic, and a user-friendly interface, making the service accessible and resilient for both free-tier and enterprise users.
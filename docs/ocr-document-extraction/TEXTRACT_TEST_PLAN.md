# End-to-End Test Plan for Textract Integration

This document outlines the test plan to verify the complete end-to-end workflow of the AWS Textract integration for document processing.

## 1. Test Objective

To ensure that a document uploaded from the frontend is successfully processed by AWS Textract, and the extracted data is correctly returned to the frontend.

## 2. Test Environment

-   **Frontend**: Expo Go app running on a physical device or emulator.
-   **Backend**: Django server running locally.
-   **AWS Services**: S3, SQS, Lambda, and Textract configured as per the `TEXTRACT_QUICKSTART.md` guide.

## 3. Test Steps

1.  **Start Backend Server**: Ensure the Django backend server is running.
2.  **Start Frontend App**: Launch the Expo Go app.
3.  **Navigate to Document Upload**: Go to the Motor 2 flow and proceed to the "Documents" step.
4.  **Upload Document**: Select a test document (e.g., a sample ID or logbook image).
5.  **Monitor Frontend**: Observe the upload progress and wait for the success or error message.
6.  **Monitor Backend Logs**: Check the Django server logs for any errors during the process.
7.  **Monitor AWS Services**:
    *   **S3**: Verify that the document is uploaded to the `uploads` folder and that a corresponding result file is created in the `textract-results` folder.
    *   **SQS**: Check the queue for any messages that are not being processed.
    *   **CloudWatch**: Review the Lambda function logs for any errors during execution.

## 4. Expected Results

-   The document is successfully uploaded to S3.
-   A message is sent to the SQS queue.
-   The Lambda function is triggered and processes the document with Textract.
-   The Textract results are saved to the `textract-results` folder in S3.
-   The frontend receives the extracted data and displays it to the user.

## 5. Test Execution

I will now execute this test plan.

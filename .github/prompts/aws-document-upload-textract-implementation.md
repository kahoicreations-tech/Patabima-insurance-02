# AWS Document Upload & Textract Implementation Guide

## Overview

Implement AWS S3 storage and Textract OCR functionality for the Motor 2 DocumentsUpload component to handle document storage and automatic data extraction from uploaded insurance documents.

## Current Architecture Analysis

### Existing AWS Infrastructure

- **AWS Amplify**: Configured with backend services
- **S3 Storage**: `patabimastorage` bucket with auth-based access
- **Cognito Auth**: User authentication with custom agent attributes
- **AppSync API**: GraphQL API for data management
- **Pinpoint Analytics**: User behavior tracking

### Current Storage Configuration

```json
{
  "resourceName": "patabimastorage",
  "bucketName": "patabima-storage-bucket",
  "storageAccess": "auth",
  "authAccess": ["CREATE_AND_UPDATE", "READ", "DELETE"]
}
```

### Existing AWS Services

- **AWSAuthService**: Complete authentication service
- **AWSDataService**: Data synchronization and caching
- **AWSContext**: Global state management for AWS services

## Implementation Requirements

### 1. Document Upload to S3

- **Target**: Replace local file picker with S3 upload
- **Folder Structure**: Organize by agent/policy/document type
- **File Naming**: Consistent naming convention with timestamps
- **Security**: Agent-specific access controls

### 2. Textract Integration

- **Auto-Processing**: Extract data from uploaded documents
- **Document Types**: Logbook, ID, KRA PIN, Business Permit
- **Data Mapping**: Map extracted text to form fields
- **Validation**: Verify extracted data accuracy

### 3. Enhanced UI/UX

- **Upload Progress**: Real-time upload progress indicators
- **Preview**: Document preview with extracted data overlay
- **Error Handling**: Comprehensive error states and retry mechanisms
- **Offline Support**: Queue uploads for when connection is restored

## Implementation Tasks

### Phase 1: S3 Document Upload Service

#### Create AWS Document Service

```javascript
// File: frontend/services/aws/AWSDocumentService.js
import { Storage } from "aws-amplify";
import { AWSAuthService } from "./AWSAuthService";

export const AWSDocumentService = {
  // Upload document to S3
  uploadDocument: async (file, metadata) => {
    const { agentId, policyId, documentType } = metadata;
    const fileName = `agents/${agentId}/policies/${policyId}/${documentType}/${Date.now()}_${
      file.name
    }`;

    return await Storage.put(fileName, file, {
      level: "private",
      contentType: file.type,
      metadata: {
        agentId,
        policyId,
        documentType,
        originalName: file.name,
      },
      progressCallback: (progress) => {
        const percentage = (progress.loaded / progress.total) * 100;
        // Update upload progress
      },
    });
  },

  // Get document URL
  getDocumentUrl: async (key) => {
    return await Storage.get(key, { level: "private" });
  },

  // Delete document
  deleteDocument: async (key) => {
    return await Storage.remove(key, { level: "private" });
  },
};
```

#### Update DocumentsUpload Component

- Replace `DocumentPicker` with AWS upload functionality
- Add upload progress indicators
- Implement retry mechanism for failed uploads
- Add document preview capabilities

### Phase 2: Textract Integration

#### Create Textract Service

```javascript
// File: frontend/services/aws/AWSTextractService.js
import { API } from "aws-amplify";

export const AWSTextractService = {
  // Process document with Textract
  processDocument: async (s3Key, documentType) => {
    return await API.post("PataBimaAPI", "/textract/analyze", {
      body: {
        s3Key,
        documentType,
        features: ["FORMS", "TABLES"], // Extract forms and tables
      },
    });
  },

  // Extract specific data based on document type
  extractDocumentData: (textractResponse, documentType) => {
    switch (documentType) {
      case "logbook":
        return extractLogbookData(textractResponse);
      case "id_copy":
        return extractIdData(textractResponse);
      case "kra_pin":
        return extractKRAData(textractResponse);
      default:
        return extractGenericData(textractResponse);
    }
  },
};

// Document-specific extraction functions
const extractLogbookData = (response) => {
  // Extract vehicle registration, make, model, year, etc.
  // Return structured data object
};

const extractIdData = (response) => {
  // Extract name, ID number, date of birth, etc.
  // Return structured data object
};
```

#### Backend Lambda Function

```python
# File: amplify/backend/function/textractProcessor/src/index.py
import boto3
import json

def lambda_handler(event, context):
    textract = boto3.client('textract')
    s3_bucket = event['s3Bucket']
    s3_key = event['s3Key']
    document_type = event['documentType']

    # Start document analysis
    response = textract.analyze_document(
        Document={
            'S3Object': {
                'Bucket': s3_bucket,
                'Name': s3_key
            }
        },
        FeatureTypes=['FORMS', 'TABLES']
    )

    # Process and structure the response
    extracted_data = process_textract_response(response, document_type)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'extractedData': extracted_data,
            'confidence': calculate_confidence(response),
            'documentType': document_type
        })
    }
```

### Phase 3: Enhanced DocumentsUpload Component

#### Updated Component Structure

```javascript
// Enhanced DocumentsUpload with AWS integration
import { AWSDocumentService } from "../../../services/aws/AWSDocumentService";
import { AWSTextractService } from "../../../services/aws/AWSTextractService";

export default function DocumentsUpload({
  onDocumentsChange,
  onDataExtracted, // New prop for extracted data
  agentId,
  policyId,
  // ... other props
}) {
  const [uploadProgress, setUploadProgress] = useState({});
  const [extractedData, setExtractedData] = useState({});
  const [processing, setProcessing] = useState({});

  const handleDocumentUpload = async (file, documentType) => {
    try {
      // Upload to S3
      const uploadResult = await AWSDocumentService.uploadDocument(file, {
        agentId,
        policyId,
        documentType,
      });

      // Process with Textract
      setProcessing((prev) => ({ ...prev, [documentType]: true }));
      const textractResult = await AWSTextractService.processDocument(
        uploadResult.key,
        documentType
      );

      // Extract structured data
      const extractedData = AWSTextractService.extractDocumentData(
        textractResult,
        documentType
      );

      // Update state and notify parent
      setExtractedData((prev) => ({ ...prev, [documentType]: extractedData }));
      onDataExtracted?.(documentType, extractedData);
    } catch (error) {
      // Handle error
    } finally {
      setProcessing((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  // ... rest of component
}
```

### Phase 4: Data Integration & Auto-Fill

#### Form Auto-Population

- Map extracted Textract data to vehicle form fields
- Implement confidence-based validation
- Allow manual override of extracted data
- Show confidence scores for extracted fields

#### Data Validation Service

```javascript
// File: frontend/services/DocumentValidationService.js
export const DocumentValidationService = {
  validateExtractedData: (extractedData, documentType) => {
    // Validate extracted data against expected patterns
    // Return validation results with confidence scores
  },

  mapToFormFields: (extractedData, documentType) => {
    // Map extracted data to specific form fields
    // Handle data transformation and formatting
  },

  generateValidationReport: (extractedData, validationResults) => {
    // Generate human-readable validation report
    // Highlight areas requiring manual verification
  },
};
```

## Security Implementation

### IAM Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["textract:AnalyzeDocument", "textract:DetectDocumentText"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::patabima-storage-bucket/agents/*"
    }
  ]
}
```

### Agent-Specific Access

- Documents stored in agent-specific folders
- Cognito user pools for authentication
- Custom attributes for agent identification
- Row-level security for document access

## Testing Strategy

### Unit Tests

- S3 upload/download functionality
- Textract data extraction accuracy
- Form auto-population logic
- Error handling scenarios

### Integration Tests

- End-to-end document upload flow
- Textract processing pipeline
- Data validation and mapping
- Offline/online sync scenarios

### Performance Tests

- Upload speed with large documents
- Textract processing time
- Memory usage during processing
- Concurrent upload handling

## Monitoring & Analytics

### CloudWatch Metrics

- Document upload success/failure rates
- Textract processing times
- S3 storage usage by agent
- API Gateway response times

### User Analytics

- Document type upload frequencies
- Extraction accuracy rates
- User interaction patterns
- Error occurrence tracking

## Error Handling

### Common Scenarios

- Network connectivity issues
- S3 upload failures
- Textract processing errors
- Invalid document formats
- Insufficient permissions

### Retry Mechanisms

- Exponential backoff for uploads
- Queue failed uploads for retry
- Graceful degradation without Textract
- User notification system

## Migration Plan

### Phase 1: Setup (Week 1)

- Configure AWS services
- Implement basic S3 upload
- Create backend Lambda functions

### Phase 2: Integration (Week 2)

- Integrate Textract processing
- Update DocumentsUpload component
- Implement data extraction logic

### Phase 3: Enhancement (Week 3)

- Add auto-fill functionality
- Implement validation services
- Enhance error handling

### Phase 4: Testing & Deployment (Week 4)

- Comprehensive testing
- Performance optimization
- Production deployment

## Environment Variables

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=patabima-storage-bucket
AWS_TEXTRACT_ROLE_ARN=arn:aws:iam::account:role/TextractRole

# Feature Flags
ENABLE_TEXTRACT_AUTO_EXTRACT=true
ENABLE_DOCUMENT_PREVIEW=true
ENABLE_OFFLINE_UPLOAD_QUEUE=true
TEXTRACT_CONFIDENCE_THRESHOLD=0.85
```

## Success Metrics

### Technical KPIs

- 99.9% S3 upload success rate
- < 30 seconds average Textract processing time
- 95% data extraction accuracy for logbooks
- < 5% false positive rate in validations

### User Experience KPIs

- 50% reduction in manual data entry
- 80% user satisfaction with auto-fill
- 90% successful document uploads on first attempt
- < 3 clicks to complete document upload

## Implementation Notes

### Existing Infrastructure Leveraging

1. **Use existing AWSAuthService** for user authentication
2. **Extend AWSDataService** for document metadata storage
3. **Integrate with AWSContext** for global state management
4. **Leverage existing S3 bucket** configuration

### Code Organization

- Keep AWS services modular and reusable
- Follow existing service patterns in the codebase
- Maintain backward compatibility during migration
- Use TypeScript interfaces for data contracts

### Performance Considerations

- Implement lazy loading for large documents
- Use image compression before upload
- Cache Textract results to avoid reprocessing
- Implement progressive image loading

This implementation will significantly enhance the Motor 2 document upload experience while maintaining security and performance standards.

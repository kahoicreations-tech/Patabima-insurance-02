# Backend Documentation

This folder contains documentation related to the Django backend implementation.

## 📄 Documents

- **BACKEND_CLEANUP_COMPLETE.md** - Backend code cleanup and organization summary

## 📁 Subdirectories

### `/textract`
AWS Textract integration for document OCR:
- TEXTRACT_QUICKSTART.md - Quick setup guide
- TEXTRACT_SETUP.md - Detailed configuration guide

### `/database`
Database configuration and management:
- README_POSTGRESQL.md - PostgreSQL setup and configuration

## 🎯 Backend Overview

The PataBima backend includes:
- Django 4.2.16 REST API
- PostgreSQL database
- JWT authentication
- AWS integration (S3, Textract, Lambda)
- Motor insurance pricing engine
- Policy management system
- Commission calculations
- Claims processing

## 🔗 Related Documentation

- [AWS Deployment](../aws-deployment/)
- [Backend Services Guide](../BACKEND_SERVICES_GUIDE.md)
- [API Endpoints Analysis](../INSURANCE_APP_ENDPOINTS_ANALYSIS.md)
- [Main Documentation](../README.md)

## 📊 Technology Stack

- **Framework**: Django 4.2.16 with Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Storage**: AWS S3
- **OCR**: AWS Textract
- **Serverless**: AWS Lambda

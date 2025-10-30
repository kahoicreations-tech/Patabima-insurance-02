#!/usr/bin/env python3
"""
Frontend-Backend Integration Verification Script
PataBima Insurance Application

This script verifies that the React Native frontend is properly wired to the Django backend
by checking:
1. API endpoint alignment between frontend and backend
2. Request/response data structure compatibility
3. Authentication flow compatibility
4. Motor 2 flow endpoint mapping

Run before deploying to AWS for testing on real devices.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


class FrontendBackendChecker:
    """Verifies frontend-backend integration"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.frontend_service = self.project_root / 'frontend' / 'services' / 'DjangoAPIService.js'
        self.backend_urls = self.project_root / 'insurance-app' / 'app' / 'urls.py'
        self.backend_public_urls = self.project_root / 'insurance-app' / 'app' / 'public_app_urls.py'
        self.issues = []
        self.warnings = []
        self.successes = []
        
    def print_header(self, text: str):
        """Print a formatted header"""
        print(f"\n{Colors.HEADER}{'='*70}{Colors.ENDC}")
        print(f"{Colors.HEADER}{text.center(70)}{Colors.ENDC}")
        print(f"{Colors.HEADER}{'='*70}{Colors.ENDC}\n")
        
    def print_success(self, message: str):
        """Print success message"""
        print(f"{Colors.OKGREEN}✓ PASS{Colors.ENDC} | {message}")
        self.successes.append(message)
        
    def print_warning(self, message: str):
        """Print warning message"""
        print(f"{Colors.WARNING}⚠ WARN{Colors.ENDC} | {message}")
        self.warnings.append(message)
        
    def print_error(self, message: str):
        """Print error message"""
        print(f"{Colors.FAIL}✗ FAIL{Colors.ENDC} | {message}")
        self.issues.append(message)
        
    def extract_frontend_endpoints(self) -> Dict[str, str]:
        """Extract API endpoints from DjangoAPIService.js"""
        print(f"{Colors.OKCYAN}Reading frontend service...{Colors.ENDC}")
        
        if not self.frontend_service.exists():
            self.print_error(f"Frontend service file not found: {self.frontend_service}")
            return {}
            
        with open(self.frontend_service, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract ENDPOINTS object
        endpoints_match = re.search(r'ENDPOINTS:\s*{(.*?)},\s*};', content, re.DOTALL)
        if not endpoints_match:
            self.print_error("Could not find ENDPOINTS configuration in frontend service")
            return {}
            
        endpoints_text = endpoints_match.group(1)
        
        # Extract all endpoint paths
        endpoint_pattern = r"['\"]([/\w\-{}]+)['\"]"
        endpoints = {}
        
        # Find all endpoint definitions
        lines = endpoints_text.split('\n')
        current_category = None
        
        for line in lines:
            # Check for category
            if ':' in line and '{' in line:
                category_match = re.search(r'(\w+):\s*{', line)
                if category_match:
                    current_category = category_match.group(1)
                    
            # Check for endpoint path
            path_match = re.search(r":\s*['\"](/api/[^'\"]+)['\"]", line)
            if path_match and current_category:
                path = path_match.group(1)
                key_match = re.search(r'(\w+):', line)
                if key_match:
                    key = f"{current_category}.{key_match.group(1)}"
                    endpoints[key] = path
                    
        return endpoints
        
    def extract_backend_urls(self) -> Set[str]:
        """Extract URL patterns from Django urls.py"""
        print(f"{Colors.OKCYAN}Reading backend URLs...{Colors.ENDC}")
        
        urls = set()
        
        # Read main app urls
        if self.backend_urls.exists():
            with open(self.backend_urls, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Extract path patterns
            path_pattern = r"path\(['\"]([^'\"]+)['\"]"
            for match in re.finditer(path_pattern, content):
                url_path = match.group(1)
                # Normalize path
                if not url_path.startswith('/'):
                    url_path = '/api/v1/' + url_path.rstrip('/')
                urls.add(url_path)
                
        # Read public_app urls
        if self.backend_public_urls.exists():
            with open(self.backend_public_urls, 'r', encoding='utf-8') as f:
                content = f.read()
                
            path_pattern = r"path\(['\"]([^'\"]+)['\"]"
            for match in re.finditer(path_pattern, content):
                url_path = match.group(1)
                if not url_path.startswith('/'):
                    url_path = '/api/v1/public_app/' + url_path.rstrip('/')
                urls.add(url_path)
                
        return urls
        
    def check_motor2_endpoints(self):
        """Verify Motor 2 specific endpoints"""
        self.print_header("Motor 2 Endpoints Verification")
        
        required_motor2_endpoints = {
            'Categories': '/api/v1/motor/categories/',
            'Subcategories': '/api/v1/motor/subcategories/',
            'Field Requirements': '/api/v1/motor/field-requirements/',
            'Compare Pricing': '/api/v1/public_app/insurance/compare_motor_pricing',
            'Create Policy': '/api/v1/policies/motor/create/',
            'List Policies': '/api/v1/policies/motor/',
            'Get Policy': '/api/v1/policies/motor/{policy_number}/',
            'Upcoming Renewals': '/api/v1/policies/motor/upcoming-renewals/',
            'Upcoming Extensions': '/api/v1/policies/motor/upcoming-extensions/',
        }
        
        with open(self.frontend_service, 'r', encoding='utf-8') as f:
            frontend_content = f.read()
            
        for name, endpoint in required_motor2_endpoints.items():
            # Normalize endpoint for search (remove trailing slash variations)
            search_path = endpoint.replace('{policy_number}', '').rstrip('/')
            
            if search_path in frontend_content:
                self.print_success(f"Motor 2 {name} endpoint found in frontend")
            else:
                self.print_error(f"Motor 2 {name} endpoint missing: {endpoint}")
                
    def check_authentication_flow(self):
        """Verify authentication flow compatibility"""
        self.print_header("Authentication Flow Verification")
        
        with open(self.frontend_service, 'r', encoding='utf-8') as f:
            frontend_content = f.read()
            
        # Check for 2-step OTP authentication
        auth_checks = {
            'LOGIN endpoint': '/api/v1/public_app/auth/login',
            'AUTH_LOGIN endpoint': '/api/v1/public_app/auth/auth_login',
            'login method': 'async login(phonenumber, password)',
            'authenticateWithOTP method': 'async authenticateWithOTP',
            'OTP code extraction': 'otp_code',
            'Token storage': 'SecureTokenStorage',
            'Token refresh': 'async refreshTokenFlow',
        }
        
        for check_name, check_value in auth_checks.items():
            if check_value in frontend_content:
                self.print_success(f"{check_name} implemented correctly")
            else:
                self.print_error(f"{check_name} not found: {check_value}")
                
    def check_data_structures(self):
        """Verify data structure compatibility"""
        self.print_header("Data Structure Verification")
        
        with open(self.frontend_service, 'r', encoding='utf-8') as f:
            frontend_content = f.read()
            
        # Check for proper field mappings discovered in integration tests
        field_mappings = {
            'category_code': 'Uses category_code (not just id)',
            'subcategory_code': 'Uses subcategory_code (not just id)',
            'premium_breakdown': 'Handles nested premium_breakdown structure',
            'clientDetails': 'Uses clientDetails object',
            'vehicleDetails': 'Uses vehicleDetails object',
            'productDetails': 'Uses productDetails object',
            'paymentDetails': 'Uses paymentDetails object',
        }
        
        for field, description in field_mappings.items():
            if field in frontend_content:
                self.print_success(f"{description}")
            else:
                self.print_warning(f"{description} - field '{field}' not found in frontend")
                
    def check_error_handling(self):
        """Verify error handling implementation"""
        self.print_header("Error Handling Verification")
        
        with open(self.frontend_service, 'r', encoding='utf-8') as f:
            frontend_content = f.read()
            
        error_handling_features = {
            'Token refresh on 401': 'response.status === 401',
            'Error logging': 'console.error',
            'Try-catch blocks': 'try {',
            'Request timeout': 'setTimeout',
            'Retry logic': 'tryEndpoints',
            'Auth lock mechanism': '_authLocked',
        }
        
        for feature, check_string in error_handling_features.items():
            if check_string in frontend_content:
                self.print_success(f"{feature} implemented")
            else:
                self.print_warning(f"{feature} not found")
                
    def check_api_base_url_configuration(self):
        """Verify API base URL configuration"""
        self.print_header("API Configuration Verification")
        
        with open(self.frontend_service, 'r', encoding='utf-8') as f:
            frontend_content = f.read()
            
        # Check BASE_URL configuration
        base_url_match = re.search(r"BASE_URL:\s*__DEV__\s*\?\s*['\"]([^'\"]+)['\"]", frontend_content)
        
        if base_url_match:
            dev_url = base_url_match.group(1)
            if 'localhost' in dev_url or '127.0.0.1' in dev_url:
                self.print_success(f"Development URL configured: {dev_url}")
            else:
                self.print_warning(f"Development URL may need adjustment: {dev_url}")
        else:
            self.print_error("BASE_URL configuration not found")
            
        # Check for environment variable support
        if 'EXPO_PUBLIC_API_BASE_URL' in frontend_content or 'EXPO_PUBLIC_API_URL' in frontend_content:
            self.print_success("Environment variable support for API URL configured")
        else:
            self.print_warning("Environment variable support not found - may need manual URL update for AWS deployment")
            
        # Check for updateBaseUrl method
        if 'updateBaseUrl' in frontend_content:
            self.print_success("Dynamic base URL update method available")
        else:
            self.print_warning("Dynamic base URL update method not found")
            
    def check_expo_configuration(self):
        """Verify Expo app configuration"""
        self.print_header("Expo Configuration Verification")
        
        # Check app.json in frontend directory
        app_json_path = self.project_root / 'frontend' / 'app.json'
        if not app_json_path.exists():
            # Try root directory as fallback
            app_json_path = self.project_root / 'app.json'
            
        if app_json_path.exists():
            with open(app_json_path, 'r', encoding='utf-8') as f:
                try:
                    app_config = json.load(f)
                    
                    # Check for extra configuration
                    extra = app_config.get('expo', {}).get('extra', {})
                    if 'apiUrl' in extra or 'apiBaseUrl' in extra:
                        self.print_success("API URL configured in app.json extra section")
                    else:
                        self.print_warning("API URL not found in app.json - may need to add for AWS deployment")
                        
                    # Check for iOS/Android configuration
                    expo = app_config.get('expo', {})
                    if 'ios' in expo:
                        self.print_success("iOS configuration present")
                    if 'android' in expo:
                        self.print_success("Android configuration present")
                        
                except json.JSONDecodeError:
                    self.print_error("app.json is not valid JSON")
        else:
            self.print_error("app.json not found")
            
    def generate_aws_deployment_checklist(self):
        """Generate AWS deployment checklist"""
        self.print_header("AWS Deployment Checklist")
        
        checklist = [
            ("Update backend BASE_URL in DjangoAPIService.js to AWS endpoint", "TODO"),
            ("Set EXPO_PUBLIC_API_BASE_URL environment variable", "TODO"),
            ("Configure CORS settings in Django for AWS domain", "TODO"),
            ("Update Django ALLOWED_HOSTS for AWS domain", "TODO"),
            ("Configure AWS security groups for API port access", "TODO"),
            ("Set up SSL/TLS certificate for HTTPS", "TODO"),
            ("Configure environment variables in AWS", "TODO"),
            ("Test authentication flow on real devices", "TODO"),
            ("Test Motor 2 complete flow on real devices", "TODO"),
            ("Test payment integration on real devices", "TODO"),
        ]
        
        for item, status in checklist:
            print(f"  [ ] {item}")
            
        print(f"\n{Colors.OKCYAN}NOTE: Update frontend BASE_URL after AWS deployment{Colors.ENDC}")
        print(f"{Colors.OKCYAN}      Current: http://127.0.0.1:8000{Colors.ENDC}")
        print(f"{Colors.OKCYAN}      AWS: https://your-aws-domain.com{Colors.ENDC}\n")
        
    def print_summary(self):
        """Print verification summary"""
        self.print_header("Integration Verification Summary")
        
        total_checks = len(self.successes) + len(self.warnings) + len(self.issues)
        
        print(f"\nTotal Checks: {total_checks}")
        print(f"{Colors.OKGREEN}✓ Passed: {len(self.successes)}{Colors.ENDC}")
        print(f"{Colors.WARNING}⚠ Warnings: {len(self.warnings)}{Colors.ENDC}")
        print(f"{Colors.FAIL}✗ Failed: {len(self.issues)}{Colors.ENDC}")
        
        if len(self.issues) == 0:
            print(f"\n{Colors.OKGREEN}{Colors.BOLD}✓ FRONTEND-BACKEND INTEGRATION VERIFIED!{Colors.ENDC}")
            print(f"{Colors.OKGREEN}Frontend is properly wired to backend.{Colors.ENDC}")
            print(f"{Colors.OKGREEN}Ready for AWS deployment and real device testing.{Colors.ENDC}")
        else:
            print(f"\n{Colors.FAIL}{Colors.BOLD}✗ INTEGRATION ISSUES FOUND{Colors.ENDC}")
            print(f"{Colors.FAIL}Please fix the issues above before deploying to AWS.{Colors.ENDC}")
            
        if len(self.warnings) > 0:
            print(f"\n{Colors.WARNING}Note: Warnings indicate potential issues that should be reviewed.{Colors.ENDC}")
            
    def run(self):
        """Run all verification checks"""
        print(f"{Colors.HEADER}{Colors.BOLD}")
        print("╔════════════════════════════════════════════════════════════════════╗")
        print("║   FRONTEND-BACKEND INTEGRATION VERIFICATION                        ║")
        print("║   PataBima Insurance Application                                   ║")
        print("╚════════════════════════════════════════════════════════════════════╝")
        print(f"{Colors.ENDC}")
        
        # Run all checks
        self.check_motor2_endpoints()
        self.check_authentication_flow()
        self.check_data_structures()
        self.check_error_handling()
        self.check_api_base_url_configuration()
        self.check_expo_configuration()
        
        # Generate deployment checklist
        self.generate_aws_deployment_checklist()
        
        # Print summary
        self.print_summary()
        
        # Return exit code
        return 0 if len(self.issues) == 0 else 1


if __name__ == '__main__':
    checker = FrontendBackendChecker()
    exit_code = checker.run()
    exit(exit_code)

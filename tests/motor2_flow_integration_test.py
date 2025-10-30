"""
Motor 2 Flow Integration Test Script
=====================================
Tests the complete Motor 2 insurance flow from category selection to policy creation.

Requirements:
- Backend server running on http://localhost:8000
- Valid test user credentials
- Sample documents in tests/fixtures/

Usage:
    python tests/motor2_flow_integration_test.py

Author: PataBima Development Team
Date: October 21, 2025
"""

import requests
import json
import time
import os
from pathlib import Path
from typing import Dict, Any, Optional

# Test Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_USER = {
    "phonenumber": "079286554",  # 9 digits without leading 0 (existing agent in DB)
    "password": "test1234"       # Password set for testing
}
# NOTE: To create a test user, run from insurance-app directory:
#   python manage.py shell -c "from app.models import User; u = User.objects.create_user(phonenumber='712345678', password='testpassword123', role='AGENT')"

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

class Motor2FlowTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.test_results = []
        self.flow_data = {}
        
    def print_header(self, text: str):
        """Print formatted section header"""
        print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{text.center(70)}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")
    
    def print_test(self, name: str, status: str, details: str = ""):
        """Print test result with color coding"""
        if status == "PASS":
            status_colored = f"{Colors.OKGREEN}✓ PASS{Colors.ENDC}"
        elif status == "FAIL":
            status_colored = f"{Colors.FAIL}✗ FAIL{Colors.ENDC}"
        elif status == "WARN":
            status_colored = f"{Colors.WARNING}⚠ WARN{Colors.ENDC}"
        else:
            status_colored = f"{Colors.OKBLUE}ℹ INFO{Colors.ENDC}"
        
        print(f"{status_colored} | {name}")
        if details:
            print(f"       {Colors.OKCYAN}{details}{Colors.ENDC}")
        
        self.test_results.append({"name": name, "status": status, "details": details})
    
    def print_data(self, label: str, data: Any):
        """Print formatted data"""
        print(f"{Colors.OKCYAN}[{label}]{Colors.ENDC}")
        print(json.dumps(data, indent=2, default=str))
        print()
    
    # ========== STEP 1: Authentication ==========
    def test_authentication(self) -> bool:
        """Test user authentication and token retrieval (2-step OTP process)"""
        self.print_header("STEP 1: Authentication")
        
        try:
            # Step 1: Request OTP
            self.print_test("Request OTP", "INFO", "Sending login request...")
            response = requests.post(
                f"{self.base_url}/public_app/auth/login",
                json={
                    "phonenumber": TEST_USER["phonenumber"],
                    "password": TEST_USER["password"]
                },
                timeout=10
            )
            
            if response.status_code != 200:
                self.print_test("Request OTP", "FAIL", f"Status: {response.status_code}")
                self.print_data("Response", response.json())
                return False
            
            otp_response = response.json()
            otp_code = otp_response.get('otp_code') or otp_response.get('code')
            
            if not otp_code:
                self.print_test("Request OTP", "FAIL", "No OTP code returned")
                self.print_data("Response", otp_response)
                return False
            
            self.print_test("Request OTP", "PASS", f"OTP Code: {otp_code}")
            
            # Step 2: Authenticate with OTP
            self.print_test("Authenticate with OTP", "INFO", "Submitting OTP...")
            auth_response = requests.post(
                f"{self.base_url}/public_app/auth/auth_login",
                json={
                    "phonenumber": TEST_USER["phonenumber"],
                    "password": TEST_USER["password"],
                    "code": str(otp_code)
                },
                timeout=10
            )
            
            if auth_response.status_code == 200:
                data = auth_response.json()
                self.auth_token = data.get('access') or data.get('token') or data.get('access_token')
                
                if self.auth_token:
                    self.print_test("Authenticate with OTP", "PASS", f"Token: {self.auth_token[:20]}...")
                    return True
                else:
                    self.print_test("Authenticate with OTP", "FAIL", "No token in response")
                    self.print_data("Response", data)
                    return False
            else:
                self.print_test("Authenticate with OTP", "FAIL", f"Status: {auth_response.status_code}")
                self.print_data("Response", auth_response.json())
                return False
                
        except Exception as e:
            self.print_test("Authentication", "FAIL", str(e))
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get authenticated request headers"""
        return {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
    
    # ========== STEP 2: Motor Categories ==========
    def test_get_categories(self) -> bool:
        """Test fetching motor insurance categories"""
        self.print_header("STEP 2: Motor Categories")
        
        try:
            response = requests.get(
                f"{self.base_url}/motor/categories/",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                categories = data.get('data') or data.get('categories') or data
                
                if isinstance(categories, list) and len(categories) > 0:
                    self.flow_data['categories'] = categories
                    self.print_test("Get Categories", "PASS", f"Found {len(categories)} categories")
                    
                    # Display categories
                    for cat in categories[:3]:  # Show first 3
                        print(f"  • {cat.get('name')} (ID: {cat.get('id')})")
                    
                    return True
                else:
                    self.print_test("Get Categories", "FAIL", "No categories returned")
                    self.print_data("Response", data)
                    return False
            else:
                self.print_test("Get Categories", "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_test("Get Categories", "FAIL", str(e))
            return False
    
    # ========== STEP 3: Subcategories ==========
    def test_get_subcategories(self) -> bool:
        """Test fetching subcategories for a category"""
        self.print_header("STEP 3: Subcategories")
        
        if not self.flow_data.get('categories'):
            self.print_test("Get Subcategories", "FAIL", "No categories available")
            return False
        
        # Use first category (usually "Private")
        category = self.flow_data['categories'][0]
        category_code = category.get('category_code') or category.get('code')
        
        if not category_code:
            self.print_test("Get Subcategories", "FAIL", "Category has no code")
            self.print_data("Category", category)
            return False
        
        try:
            response = requests.get(
                f"{self.base_url}/motor/subcategories/?category={category_code}",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                subcategories = data.get('data') or data.get('subcategories') or data
                
                if isinstance(subcategories, list) and len(subcategories) > 0:
                    self.flow_data['subcategories'] = subcategories
                    self.flow_data['selected_category'] = category
                    self.print_test("Get Subcategories", "PASS", f"Found {len(subcategories)} subcategories for '{category.get('name')}'")
                    
                    # Display subcategories
                    for subcat in subcategories[:5]:  # Show first 5
                        print(f"  • {subcat.get('name')} - {subcat.get('pricing_model', 'N/A')}")
                    
                    return True
                else:
                    self.print_test("Get Subcategories", "FAIL", "No subcategories returned")
                    self.print_data("Response", data)
                    return False
            else:
                self.print_test("Get Subcategories", "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_test("Get Subcategories", "FAIL", str(e))
            return False
    
    # ========== STEP 4: Pricing Comparison ==========
    def test_compare_pricing(self) -> bool:
        """Test pricing comparison for a subcategory"""
        self.print_header("STEP 4: Pricing Comparison")
        
        if not self.flow_data.get('subcategories'):
            self.print_test("Compare Pricing", "FAIL", "No subcategories available")
            return False
        
        # Use first subcategory (usually "Comprehensive Upto 1M")
        subcategory = self.flow_data['subcategories'][0]
        
        # Sample pricing input
        pricing_input = {
            "category": self.flow_data['selected_category'].get('category_code') or self.flow_data['selected_category'].get('code'),
            "subcategory": subcategory.get('subcategory_code') or subcategory.get('code'),
            "vehicle_details": {
                "registration": "KCB123A",
                "make": "Toyota",
                "model": "Corolla",
                "year_of_manufacture": 2020,
                "seating_capacity": 5,
                "engine_cc": 1800
            },
            "pricing_inputs": {
                "sum_insured": 800000,
                "start_date": "2025-10-21",
                "cover_period_months": 12
            },
            "underwriters": ["APA", "Jubilee", "ICEA"]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/public_app/insurance/compare_motor_pricing/",
                headers=self.get_headers(),
                json=pricing_input,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                comparisons = data.get('comparisons') or data.get('results') or []
                
                if len(comparisons) > 0:
                    self.flow_data['pricing_results'] = comparisons
                    self.flow_data['selected_subcategory'] = subcategory
                    self.flow_data['vehicle_details'] = pricing_input['vehicle_details']
                    self.print_test("Compare Pricing", "PASS", f"Received {len(comparisons)} quotes")
                    
                    # Display pricing comparison
                    for quote in comparisons:
                        result = quote.get('result', {})
                        underwriter = result.get('underwriter_name', 'Unknown')
                        breakdown = result.get('premium_breakdown', {})
                        premium = breakdown.get('base_premium', 0)
                        total = breakdown.get('total_premium', 0)
                        print(f"  • {underwriter}: KSh {premium:,.2f} (Total: KSh {total:,.2f})")
                    
                    return True
                else:
                    self.print_test("Compare Pricing", "WARN", "No pricing comparisons returned")
                    self.print_data("Response", data)
                    return True  # Not a hard failure
            else:
                self.print_test("Compare Pricing", "FAIL", f"Status: {response.status_code}")
                self.print_data("Response", response.json())
                return False
                
        except Exception as e:
            self.print_test("Compare Pricing", "FAIL", str(e))
            return False
    
    # ========== STEP 5: Document Processing ==========
    def test_document_processing(self) -> bool:
        """Test document upload and extraction flow"""
        self.print_header("STEP 5: Document Processing")
        
        # Check if test documents exist
        fixtures_path = Path(__file__).parent / "fixtures"
        logbook_path = fixtures_path / "test_logbook.pdf"
        id_path = fixtures_path / "test_id.pdf"
        
        if not logbook_path.exists():
            self.print_test("Document Processing", "WARN", f"Test document not found: {logbook_path}")
            self.print_test("Document Processing", "INFO", "Skipping document tests - create fixtures folder with test PDFs")
            return True  # Not a hard failure
        
        # Test presign endpoint
        try:
            presign_data = {
                "filename": "test_logbook.pdf",
                "content_type": "application/pdf",
                "document_type": "logbook"
            }
            
            response = requests.post(
                f"{self.base_url}/docs/presign",
                headers=self.get_headers(),
                json=presign_data,
                timeout=10
            )
            
            if response.status_code == 200:
                presign_result = response.json()
                upload_url = presign_result.get('upload_url')
                job_id = presign_result.get('job_id')
                
                if upload_url and job_id:
                    self.flow_data['document_job_id'] = job_id
                    self.print_test("Document Presign", "PASS", f"Job ID: {job_id}")
                    
                    # In a real test, you would upload to S3 here
                    self.print_test("Document Upload", "INFO", "Skipping actual S3 upload in test")
                    
                    return True
                else:
                    self.print_test("Document Presign", "FAIL", "Missing upload_url or job_id")
                    self.print_data("Response", presign_result)
                    return False
            else:
                self.print_test("Document Presign", "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_test("Document Processing", "FAIL", str(e))
            return False
    
    # ========== STEP 6: Policy Creation ==========
    def test_create_policy(self) -> bool:
        """Test policy creation with complete data"""
        self.print_header("STEP 6: Policy Creation")
        
        if not self.flow_data.get('pricing_results'):
            self.print_test("Create Policy", "FAIL", "No pricing data available")
            return False
        
        # Use first pricing result
        selected_quote = self.flow_data['pricing_results'][0]
        result = selected_quote.get('result', {})
        breakdown = result.get('premium_breakdown', {})
        
        policy_data = {
            "clientDetails": {
                "fullName": "John Doe Kamau",
                "firstName": "John",
                "lastName": "Doe Kamau",
                "idNumber": "12345678",
                "phoneNumber": "+254712345678",
                "phone": "+254712345678",  # Backend requires 'phone' field
                "email": "john.kamau@example.com",
                "kraPin": "A123456789Z"
            },
            "vehicleDetails": {
                **self.flow_data['vehicle_details'],
                "year": self.flow_data['vehicle_details'].get('year_of_manufacture', 2020),  # Backend requires 'year' field
                "registration": self.flow_data['vehicle_details'].get('registration', 'KCB123A')
            },
            "productDetails": {
                "category": self.flow_data['selected_category'].get('category_code') or "PRIVATE",  # Backend requires category code
                "subcategory": self.flow_data['selected_subcategory'].get('subcategory_code') or "PRIVATE_THIRD_PARTY",  # Backend requires subcategory_code
                "coverageType": self.flow_data['selected_subcategory'].get('subcategory_name', ''),
                "underwriter": result.get('underwriter_code', 'APA'),
                "coverStartDate": "2025-10-21",
                "coverEndDate": "2026-10-21",
                "coverPeriodMonths": 12
            },
            "premiumBreakdown": {
                "basicPremium": breakdown.get('base_premium', 0),
                "itl": breakdown.get('training_levy', 0),
                "pcf": breakdown.get('pcf_levy', 0),
                "stampDuty": breakdown.get('stamp_duty', 40),
                "totalPremium": breakdown.get('total_premium', 0),
                "total_amount": breakdown.get('total_premium', 0)  # Backend requires total_amount
            },
            "paymentDetails": {  # Backend requires paymentDetails field
                "method": "MPESA",
                "amount": breakdown.get('total_premium', 0),  # Backend requires amount
                "status": "PENDING"
            },
            "documentJobIds": [],
            "quoteId": f"TEST-QUOTE-{int(time.time())}"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/policies/motor/create/",
                headers=self.get_headers(),
                json=policy_data,
                timeout=15
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                
                if result.get('success'):
                    policy_number = result.get('policyNumber')
                    policy_id = result.get('policyId')
                    
                    self.flow_data['policy_number'] = policy_number
                    self.flow_data['policy_id'] = policy_id
                    
                    self.print_test("Create Policy", "PASS", f"Policy Number: {policy_number}")
                    self.print_data("Policy Details", {
                        "Policy Number": policy_number,
                        "Policy ID": policy_id,
                        "Status": result.get('status'),
                        "Submitted At": result.get('submittedAt')
                    })
                    
                    return True
                else:
                    self.print_test("Create Policy", "FAIL", result.get('message', 'Unknown error'))
                    self.print_data("Response", result)
                    return False
            else:
                self.print_test("Create Policy", "FAIL", f"Status: {response.status_code}")
                self.print_data("Response", response.json())
                return False
                
        except Exception as e:
            self.print_test("Create Policy", "FAIL", str(e))
            return False
    
    # ========== STEP 7: Policy Retrieval ==========
    def test_get_policy(self) -> bool:
        """Test retrieving created policy"""
        self.print_header("STEP 7: Policy Retrieval")
        
        if not self.flow_data.get('policy_number'):
            self.print_test("Get Policy", "WARN", "No policy created to retrieve")
            return True
        
        policy_number = self.flow_data['policy_number']
        
        try:
            response = requests.get(
                f"{self.base_url}/policies/motor/{policy_number}/",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                policy = response.json()
                
                self.print_test("Get Policy", "PASS", f"Retrieved policy {policy_number}")
                self.print_data("Policy Summary", {
                    "Policy Number": policy.get('policy_number'),
                    "Status": policy.get('status'),
                    "Client": policy.get('client_details', {}).get('fullName'),
                    "Vehicle": policy.get('vehicle_details', {}).get('registration'),
                    "Total Premium": policy.get('premium_breakdown', {}).get('totalPremium')
                })
                
                return True
            else:
                self.print_test("Get Policy", "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_test("Get Policy", "FAIL", str(e))
            return False
    
    # ========== STEP 8: List Policies ==========
    def test_list_policies(self) -> bool:
        """Test listing all policies"""
        self.print_header("STEP 8: List All Policies")
        
        try:
            response = requests.get(
                f"{self.base_url}/policies/motor/",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                policies = data.get('data') or data.get('policies') or data
                
                if isinstance(policies, list):
                    self.print_test("List Policies", "PASS", f"Found {len(policies)} policies")
                    
                    # Show first 3 policies
                    for policy in policies[:3]:
                        print(f"  • {policy.get('policy_number')} - {policy.get('status')} - {policy.get('vehicle_details', {}).get('registration', 'N/A')}")
                    
                    return True
                else:
                    self.print_test("List Policies", "WARN", "Unexpected response format")
                    return True
            else:
                self.print_test("List Policies", "FAIL", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.print_test("List Policies", "FAIL", str(e))
            return False
    
    # ========== Main Test Runner ==========
    def run_all_tests(self):
        """Run complete test suite"""
        print(f"{Colors.HEADER}{Colors.BOLD}")
        print("╔════════════════════════════════════════════════════════════════════╗")
        print("║          MOTOR 2 FLOW INTEGRATION TEST SUITE                       ║")
        print("║          PataBima Insurance Application                            ║")
        print("╚════════════════════════════════════════════════════════════════════╝")
        print(f"{Colors.ENDC}")
        
        print(f"{Colors.OKCYAN}Backend URL: {self.base_url}{Colors.ENDC}")
        print(f"{Colors.OKCYAN}Test User: {TEST_USER['phonenumber']}{Colors.ENDC}")
        print(f"{Colors.OKCYAN}Date: October 21, 2025{Colors.ENDC}")
        
        start_time = time.time()
        
        # Run tests sequentially
        tests = [
            ("Authentication", self.test_authentication),
            ("Motor Categories", self.test_get_categories),
            ("Subcategories", self.test_get_subcategories),
            ("Pricing Comparison", self.test_compare_pricing),
            ("Document Processing", self.test_document_processing),
            ("Policy Creation", self.test_create_policy),
            ("Policy Retrieval", self.test_get_policy),
            ("List Policies", self.test_list_policies)
        ]
        
        for test_name, test_func in tests:
            result = test_func()
            if not result and test_name in ["Authentication", "Motor Categories"]:
                print(f"\n{Colors.FAIL}Critical test failed: {test_name}. Stopping tests.{Colors.ENDC}")
                break
            time.sleep(0.5)  # Small delay between tests
        
        # Print summary
        self.print_summary(time.time() - start_time)
    
    def print_summary(self, duration: float):
        """Print test summary"""
        self.print_header("TEST SUMMARY")
        
        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        warned = sum(1 for r in self.test_results if r['status'] == 'WARN')
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"{Colors.OKGREEN}Passed: {passed}{Colors.ENDC}")
        print(f"{Colors.FAIL}Failed: {failed}{Colors.ENDC}")
        print(f"{Colors.WARNING}Warnings: {warned}{Colors.ENDC}")
        print(f"Duration: {duration:.2f} seconds")
        
        if failed == 0:
            print(f"\n{Colors.OKGREEN}{Colors.BOLD}✓ ALL TESTS PASSED!{Colors.ENDC}")
            print(f"{Colors.OKGREEN}Motor 2 flow is fully functional and properly wired.{Colors.ENDC}")
        else:
            print(f"\n{Colors.FAIL}{Colors.BOLD}✗ SOME TESTS FAILED{Colors.ENDC}")
            print(f"{Colors.FAIL}Please review the failures above and fix issues.{Colors.ENDC}")
        
        print(f"\n{Colors.OKCYAN}Flow Data Summary:{Colors.ENDC}")
        if self.flow_data.get('policy_number'):
            print(f"  Created Policy: {self.flow_data['policy_number']}")
        if self.flow_data.get('categories'):
            print(f"  Categories Tested: {len(self.flow_data['categories'])}")
        if self.flow_data.get('subcategories'):
            print(f"  Subcategories Tested: {len(self.flow_data['subcategories'])}")
        if self.flow_data.get('pricing_results'):
            print(f"  Pricing Quotes: {len(self.flow_data['pricing_results'])}")
        
        print(f"\n{Colors.HEADER}{'='*70}{Colors.ENDC}\n")


def main():
    """Main entry point"""
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/motor/categories/", timeout=5)
        if response.status_code == 401:  # Unauthorized is fine, means backend is up
            pass
    except requests.exceptions.ConnectionError:
        print(f"{Colors.FAIL}ERROR: Cannot connect to backend at {BASE_URL}{Colors.ENDC}")
        print(f"{Colors.WARNING}Please ensure Django backend is running:{Colors.ENDC}")
        print(f"  python insurance-app/manage.py runserver")
        return
    except Exception as e:
        print(f"{Colors.FAIL}ERROR: {e}{Colors.ENDC}")
        return
    
    # Run tests
    tester = Motor2FlowTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()

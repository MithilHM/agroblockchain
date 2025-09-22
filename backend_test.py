#!/usr/bin/env python3
"""
AgriChain Backend API Testing Suite
Tests all new backend features including wallet management, geolocation, 
distributor selection system, and enhanced notifications.
"""

import requests
import json
import time
import uuid
from typing import Dict, Any, Optional

class AgriChainAPITester:
    def __init__(self, base_url: str = "http://localhost:8001/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_tokens = {}
        self.test_data = {}
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    headers: Dict = None, user_type: str = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        
        # Add authentication header if user_type specified
        if user_type and user_type in self.auth_tokens:
            if headers is None:
                headers = {}
            headers['Authorization'] = f"Bearer {self.auth_tokens[user_type]}"
            
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers, params=data)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {e}", "ERROR")
            raise
            
    def test_health_check(self) -> bool:
        """Test basic health check endpoint"""
        self.log("Testing health check endpoint...")
        try:
            response = self.make_request('GET', '/../health')
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log("✅ Health check passed")
                    return True
            self.log(f"❌ Health check failed: {response.status_code}", "ERROR")
            return False
        except Exception as e:
            self.log(f"❌ Health check error: {e}", "ERROR")
            return False
            
    def setup_test_users(self) -> bool:
        """Create test users for different roles"""
        self.log("Setting up test users...")
        
        users = [
            {
                "role": "farmer",
                "email": "farmer.test@agrichain.com",
                "password": "SecurePass123!",
                "name": "Test Farmer",
                "farm_name": "Green Valley Farm"
            },
            {
                "role": "distributor", 
                "email": "distributor.test@agrichain.com",
                "password": "SecurePass123!",
                "name": "Test Distributor",
                "company_name": "Fresh Distribution Co"
            },
            {
                "role": "retailer",
                "email": "retailer.test@agrichain.com", 
                "password": "SecurePass123!",
                "name": "Test Retailer",
                "store_name": "Organic Market"
            }
        ]
        
        for user in users:
            try:
                # Try to register user
                response = self.make_request('POST', '/user/register', user)
                if response.status_code in [200, 201]:
                    self.log(f"✅ {user['role']} user registered successfully")
                elif response.status_code == 400:
                    # User might already exist, try to login
                    self.log(f"User {user['role']} might already exist, trying login...")
                else:
                    self.log(f"❌ Failed to register {user['role']}: {response.status_code}", "ERROR")
                    
                # Login to get token
                login_data = {
                    "email": user["email"],
                    "password": user["password"]
                }
                response = self.make_request('POST', '/user/login', login_data)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and 'token' in data.get('data', {}):
                        self.auth_tokens[user['role']] = data['data']['token']
                        self.test_data[f"{user['role']}_user"] = data['data']['user']
                        self.log(f"✅ {user['role']} login successful")
                    else:
                        self.log(f"❌ {user['role']} login failed: Invalid response format", "ERROR")
                        return False
                else:
                    self.log(f"❌ {user['role']} login failed: {response.status_code}", "ERROR")
                    return False
                    
            except Exception as e:
                self.log(f"❌ Error setting up {user['role']} user: {e}", "ERROR")
                return False
                
        return len(self.auth_tokens) == 3
        
    def create_test_batch(self) -> Optional[str]:
        """Create a test batch for testing"""
        self.log("Creating test batch...")
        
        batch_data = {
            "product_name": "Organic Tomatoes",
            "origin_farm": "Green Valley Farm",
            "quantity": "100",
            "unit": "kg",
            "price_per_unit": "5.50",
            "harvest_date": "2024-09-20",
            "expiry_date": "2024-10-05",
            "quality_grade": "A",
            "organic_certified": True,
            "description": "Fresh organic tomatoes from Green Valley Farm"
        }
        
        try:
            response = self.make_request('POST', '/batch/register', batch_data, user_type='farmer')
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get('success') and 'batch_id' in data.get('data', {}):
                    batch_id = data['data']['batch_id']
                    self.test_data['test_batch_id'] = batch_id
                    self.log(f"✅ Test batch created: {batch_id}")
                    return batch_id
                    
            self.log(f"❌ Failed to create test batch: {response.status_code}", "ERROR")
            if response.text:
                self.log(f"Response: {response.text}", "ERROR")
            return None
            
        except Exception as e:
            self.log(f"❌ Error creating test batch: {e}", "ERROR")
            return None
            
    def test_wallet_management(self) -> Dict[str, bool]:
        """Test wallet management endpoints"""
        self.log("Testing wallet management features...")
        results = {}
        
        # Test 1: Get wallet details
        try:
            response = self.make_request('GET', '/wallet/details', user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'wallet' in data.get('data', {}):
                    self.log("✅ Wallet details retrieved successfully")
                    results['wallet_details'] = True
                else:
                    self.log("❌ Wallet details response format invalid", "ERROR")
                    results['wallet_details'] = False
            else:
                self.log(f"❌ Wallet details failed: {response.status_code}", "ERROR")
                results['wallet_details'] = False
        except Exception as e:
            self.log(f"❌ Wallet details error: {e}", "ERROR")
            results['wallet_details'] = False
            
        # Test 2: Update wallet address
        try:
            wallet_address = "0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF"
            response = self.make_request('PUT', '/wallet/address', 
                                       {"wallet_address": wallet_address}, user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log("✅ Wallet address updated successfully")
                    results['wallet_address_update'] = True
                else:
                    self.log("❌ Wallet address update failed", "ERROR")
                    results['wallet_address_update'] = False
            else:
                self.log(f"❌ Wallet address update failed: {response.status_code}", "ERROR")
                results['wallet_address_update'] = False
        except Exception as e:
            self.log(f"❌ Wallet address update error: {e}", "ERROR")
            results['wallet_address_update'] = False
            
        # Test 3: Get transaction history
        try:
            response = self.make_request('GET', '/wallet/transactions', 
                                       {"page": 1, "limit": 10}, user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'transactions' in data.get('data', {}):
                    self.log("✅ Transaction history retrieved successfully")
                    results['transaction_history'] = True
                else:
                    self.log("❌ Transaction history response format invalid", "ERROR")
                    results['transaction_history'] = False
            else:
                self.log(f"❌ Transaction history failed: {response.status_code}", "ERROR")
                results['transaction_history'] = False
        except Exception as e:
            self.log(f"❌ Transaction history error: {e}", "ERROR")
            results['transaction_history'] = False
            
        # Test 4: Get earnings summary
        try:
            response = self.make_request('GET', '/wallet/earnings', 
                                       {"period": "30"}, user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'total_earnings' in data.get('data', {}):
                    self.log("✅ Earnings summary retrieved successfully")
                    results['earnings_summary'] = True
                else:
                    self.log("❌ Earnings summary response format invalid", "ERROR")
                    results['earnings_summary'] = False
            else:
                self.log(f"❌ Earnings summary failed: {response.status_code}", "ERROR")
                results['earnings_summary'] = False
        except Exception as e:
            self.log(f"❌ Earnings summary error: {e}", "ERROR")
            results['earnings_summary'] = False
            
        return results
        
    def test_geolocation_features(self) -> Dict[str, bool]:
        """Test geolocation and time-tagging features"""
        self.log("Testing geolocation features...")
        results = {}
        
        batch_id = self.test_data.get('test_batch_id')
        if not batch_id:
            self.log("❌ No test batch available for geolocation testing", "ERROR")
            return {'geolocation_tests': False}
            
        # Test 1: Add geolocation to batch
        try:
            geo_data = {
                "latitude": 40.7128,
                "longitude": -74.0060,
                "address": "New York, NY, USA",
                "accuracy": 10
            }
            response = self.make_request('POST', f'/geo/batch/{batch_id}/location', 
                                       geo_data, user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log("✅ Geolocation added to batch successfully")
                    results['add_geolocation'] = True
                else:
                    self.log("❌ Add geolocation failed", "ERROR")
                    results['add_geolocation'] = False
            else:
                self.log(f"❌ Add geolocation failed: {response.status_code}", "ERROR")
                results['add_geolocation'] = False
        except Exception as e:
            self.log(f"❌ Add geolocation error: {e}", "ERROR")
            results['add_geolocation'] = False
            
        # Test 2: Get batch location history
        try:
            response = self.make_request('GET', f'/geo/batch/{batch_id}/history', user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'location_history' in data.get('data', {}):
                    self.log("✅ Batch location history retrieved successfully")
                    results['location_history'] = True
                else:
                    self.log("❌ Location history response format invalid", "ERROR")
                    results['location_history'] = False
            else:
                self.log(f"❌ Location history failed: {response.status_code}", "ERROR")
                results['location_history'] = False
        except Exception as e:
            self.log(f"❌ Location history error: {e}", "ERROR")
            results['location_history'] = False
            
        # Test 3: Find nearby batches
        try:
            params = {
                "latitude": 40.7128,
                "longitude": -74.0060,
                "radius": 50
            }
            response = self.make_request('GET', '/geo/batches/nearby', params, user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'batches' in data.get('data', {}):
                    self.log("✅ Nearby batches retrieved successfully")
                    results['nearby_batches'] = True
                else:
                    self.log("❌ Nearby batches response format invalid", "ERROR")
                    results['nearby_batches'] = False
            else:
                self.log(f"❌ Nearby batches failed: {response.status_code}", "ERROR")
                results['nearby_batches'] = False
        except Exception as e:
            self.log(f"❌ Nearby batches error: {e}", "ERROR")
            results['nearby_batches'] = False
            
        # Test 4: Get user location analytics
        try:
            response = self.make_request('GET', '/geo/analytics', user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'total_geotagged_batches' in data.get('data', {}):
                    self.log("✅ Location analytics retrieved successfully")
                    results['location_analytics'] = True
                else:
                    self.log("❌ Location analytics response format invalid", "ERROR")
                    results['location_analytics'] = False
            else:
                self.log(f"❌ Location analytics failed: {response.status_code}", "ERROR")
                results['location_analytics'] = False
        except Exception as e:
            self.log(f"❌ Location analytics error: {e}", "ERROR")
            results['location_analytics'] = False
            
        return results
        
    def test_distributor_selection_system(self) -> Dict[str, bool]:
        """Test multiple distributor selection system"""
        self.log("Testing distributor selection system...")
        results = {}
        
        # Test 1: Get available distributors
        try:
            response = self.make_request('GET', '/distributor/available', user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'distributors' in data.get('data', {}):
                    self.log("✅ Available distributors retrieved successfully")
                    results['available_distributors'] = True
                else:
                    self.log("❌ Available distributors response format invalid", "ERROR")
                    results['available_distributors'] = False
            else:
                self.log(f"❌ Available distributors failed: {response.status_code}", "ERROR")
                results['available_distributors'] = False
        except Exception as e:
            self.log(f"❌ Available distributors error: {e}", "ERROR")
            results['available_distributors'] = False
            
        # Test 2: Create batch offer to distributors
        batch_id = self.test_data.get('test_batch_id')
        distributor_id = self.test_data.get('distributor_user', {}).get('id')
        
        if batch_id and distributor_id:
            try:
                offer_data = {
                    "batch_id": batch_id,
                    "distributor_ids": [distributor_id],
                    "offer_price": "5.25",
                    "expiry_hours": 48,
                    "notes": "High quality organic tomatoes, fresh harvest"
                }
                response = self.make_request('POST', '/distributor/offer', offer_data, user_type='farmer')
                if response.status_code in [200, 201]:
                    data = response.json()
                    if data.get('success'):
                        self.log("✅ Batch offer created successfully")
                        results['create_offer'] = True
                        self.test_data['offer_created'] = True
                    else:
                        self.log("❌ Create batch offer failed", "ERROR")
                        results['create_offer'] = False
                else:
                    self.log(f"❌ Create batch offer failed: {response.status_code}", "ERROR")
                    results['create_offer'] = False
            except Exception as e:
                self.log(f"❌ Create batch offer error: {e}", "ERROR")
                results['create_offer'] = False
        else:
            self.log("❌ Missing batch_id or distributor_id for offer test", "ERROR")
            results['create_offer'] = False
            
        # Test 3: Get distributor offers
        try:
            response = self.make_request('GET', '/distributor/offers', user_type='distributor')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'offers' in data.get('data', {}):
                    self.log("✅ Distributor offers retrieved successfully")
                    results['get_offers'] = True
                    # Store offer ID for response test
                    offers = data['data']['offers']
                    if offers:
                        self.test_data['offer_id'] = offers[0].get('offer_id')
                else:
                    self.log("❌ Distributor offers response format invalid", "ERROR")
                    results['get_offers'] = False
            else:
                self.log(f"❌ Distributor offers failed: {response.status_code}", "ERROR")
                results['get_offers'] = False
        except Exception as e:
            self.log(f"❌ Distributor offers error: {e}", "ERROR")
            results['get_offers'] = False
            
        # Test 4: Respond to offer (if we have an offer)
        offer_id = self.test_data.get('offer_id')
        if offer_id:
            try:
                response_data = {
                    "action": "accept",
                    "response_notes": "Accepting this offer for quality produce"
                }
                response = self.make_request('PUT', f'/distributor/offer/{offer_id}/respond', 
                                           response_data, user_type='distributor')
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        self.log("✅ Offer response submitted successfully")
                        results['respond_to_offer'] = True
                    else:
                        self.log("❌ Offer response failed", "ERROR")
                        results['respond_to_offer'] = False
                else:
                    self.log(f"❌ Offer response failed: {response.status_code}", "ERROR")
                    results['respond_to_offer'] = False
            except Exception as e:
                self.log(f"❌ Offer response error: {e}", "ERROR")
                results['respond_to_offer'] = False
        else:
            self.log("❌ No offer ID available for response test", "ERROR")
            results['respond_to_offer'] = False
            
        # Test 5: Get inventory analytics
        try:
            response = self.make_request('GET', '/distributor/analytics', user_type='distributor')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'inventory_summary' in data.get('data', {}):
                    self.log("✅ Inventory analytics retrieved successfully")
                    results['inventory_analytics'] = True
                else:
                    self.log("❌ Inventory analytics response format invalid", "ERROR")
                    results['inventory_analytics'] = False
            else:
                self.log(f"❌ Inventory analytics failed: {response.status_code}", "ERROR")
                results['inventory_analytics'] = False
        except Exception as e:
            self.log(f"❌ Inventory analytics error: {e}", "ERROR")
            results['inventory_analytics'] = False
            
        return results
        
    def test_enhanced_notifications(self) -> Dict[str, bool]:
        """Test enhanced notification system"""
        self.log("Testing enhanced notification system...")
        results = {}
        
        # Test 1: Get user notifications
        try:
            params = {"page": 1, "limit": 10, "unread_only": "false"}
            response = self.make_request('GET', '/notifications', params, user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'notifications' in data.get('data', {}):
                    self.log("✅ User notifications retrieved successfully")
                    results['get_notifications'] = True
                    # Store notification ID for testing
                    notifications = data['data']['notifications']
                    if notifications:
                        self.test_data['notification_id'] = notifications[0].get('id')
                else:
                    self.log("❌ User notifications response format invalid", "ERROR")
                    results['get_notifications'] = False
            else:
                self.log(f"❌ User notifications failed: {response.status_code}", "ERROR")
                results['get_notifications'] = False
        except Exception as e:
            self.log(f"❌ User notifications error: {e}", "ERROR")
            results['get_notifications'] = False
            
        # Test 2: Get notification preferences
        try:
            response = self.make_request('GET', '/notifications/preferences', user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'preferences' in data.get('data', {}):
                    self.log("✅ Notification preferences retrieved successfully")
                    results['get_preferences'] = True
                else:
                    self.log("❌ Notification preferences response format invalid", "ERROR")
                    results['get_preferences'] = False
            else:
                self.log(f"❌ Notification preferences failed: {response.status_code}", "ERROR")
                results['get_preferences'] = False
        except Exception as e:
            self.log(f"❌ Notification preferences error: {e}", "ERROR")
            results['get_preferences'] = False
            
        # Test 3: Update notification preferences
        try:
            preferences = {
                "batch_transfers": True,
                "quality_updates": True,
                "expiry_warnings": False,
                "price_alerts": True,
                "system_updates": True,
                "email_notifications": True
            }
            response = self.make_request('PUT', '/notifications/preferences', 
                                       {"preferences": preferences}, user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log("✅ Notification preferences updated successfully")
                    results['update_preferences'] = True
                else:
                    self.log("❌ Update notification preferences failed", "ERROR")
                    results['update_preferences'] = False
            else:
                self.log(f"❌ Update notification preferences failed: {response.status_code}", "ERROR")
                results['update_preferences'] = False
        except Exception as e:
            self.log(f"❌ Update notification preferences error: {e}", "ERROR")
            results['update_preferences'] = False
            
        # Test 4: Mark all notifications as read
        try:
            response = self.make_request('PUT', '/notifications/read-all', user_type='farmer')
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log("✅ All notifications marked as read successfully")
                    results['mark_all_read'] = True
                else:
                    self.log("❌ Mark all notifications as read failed", "ERROR")
                    results['mark_all_read'] = False
            else:
                self.log(f"❌ Mark all notifications as read failed: {response.status_code}", "ERROR")
                results['mark_all_read'] = False
        except Exception as e:
            self.log(f"❌ Mark all notifications as read error: {e}", "ERROR")
            results['mark_all_read'] = False
            
        # Test 5: Mark single notification as read (if we have one)
        notification_id = self.test_data.get('notification_id')
        if notification_id:
            try:
                response = self.make_request('PUT', f'/notifications/{notification_id}/read', 
                                           user_type='farmer')
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        self.log("✅ Single notification marked as read successfully")
                        results['mark_single_read'] = True
                    else:
                        self.log("❌ Mark single notification as read failed", "ERROR")
                        results['mark_single_read'] = False
                else:
                    self.log(f"❌ Mark single notification as read failed: {response.status_code}", "ERROR")
                    results['mark_single_read'] = False
            except Exception as e:
                self.log(f"❌ Mark single notification as read error: {e}", "ERROR")
                results['mark_single_read'] = False
        else:
            self.log("❌ No notification ID available for single read test", "ERROR")
            results['mark_single_read'] = False
            
        return results
        
    def test_existing_features(self) -> Dict[str, bool]:
        """Test existing features to ensure they still work"""
        self.log("Testing existing features...")
        results = {}
        
        # Test user authentication (already done in setup)
        results['user_authentication'] = len(self.auth_tokens) == 3
        
        # Test batch registration (already done in setup)
        results['batch_registration'] = self.test_data.get('test_batch_id') is not None
        
        # Test QR code generation
        batch_id = self.test_data.get('test_batch_id')
        if batch_id:
            try:
                response = self.make_request('GET', f'/batch/{batch_id}/qr', user_type='farmer')
                if response.status_code == 200:
                    # Check if response contains QR code data
                    if response.headers.get('content-type', '').startswith('image/'):
                        self.log("✅ QR code generation working")
                        results['qr_code_generation'] = True
                    else:
                        # Might be JSON response with QR data
                        try:
                            data = response.json()
                            if 'qr_code' in data or 'qr_data' in data:
                                self.log("✅ QR code generation working")
                                results['qr_code_generation'] = True
                            else:
                                self.log("❌ QR code response format invalid", "ERROR")
                                results['qr_code_generation'] = False
                        except:
                            self.log("❌ QR code response not valid", "ERROR")
                            results['qr_code_generation'] = False
                else:
                    self.log(f"❌ QR code generation failed: {response.status_code}", "ERROR")
                    results['qr_code_generation'] = False
            except Exception as e:
                self.log(f"❌ QR code generation error: {e}", "ERROR")
                results['qr_code_generation'] = False
        else:
            results['qr_code_generation'] = False
            
        return results
        
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run all tests and return comprehensive results"""
        self.log("Starting comprehensive AgriChain backend testing...")
        
        all_results = {}
        
        # Test 1: Health check
        all_results['health_check'] = self.test_health_check()
        
        # Test 2: Setup test users
        all_results['user_setup'] = self.setup_test_users()
        if not all_results['user_setup']:
            self.log("❌ Cannot proceed without test users", "ERROR")
            return all_results
            
        # Test 3: Create test batch
        batch_created = self.create_test_batch() is not None
        all_results['batch_creation'] = batch_created
        
        # Test 4: Wallet management
        all_results['wallet_management'] = self.test_wallet_management()
        
        # Test 5: Geolocation features
        all_results['geolocation_features'] = self.test_geolocation_features()
        
        # Test 6: Distributor selection system
        all_results['distributor_system'] = self.test_distributor_selection_system()
        
        # Test 7: Enhanced notifications
        all_results['notification_system'] = self.test_enhanced_notifications()
        
        # Test 8: Existing features
        all_results['existing_features'] = self.test_existing_features()
        
        return all_results
        
    def print_test_summary(self, results: Dict[str, Any]):
        """Print comprehensive test summary"""
        self.log("=" * 60)
        self.log("AGRICHAIN BACKEND TEST SUMMARY")
        self.log("=" * 60)
        
        total_tests = 0
        passed_tests = 0
        
        for category, result in results.items():
            if isinstance(result, dict):
                category_passed = sum(1 for v in result.values() if v)
                category_total = len(result)
                total_tests += category_total
                passed_tests += category_passed
                
                self.log(f"\n{category.upper().replace('_', ' ')}:")
                for test_name, test_result in result.items():
                    status = "✅ PASS" if test_result else "❌ FAIL"
                    self.log(f"  {test_name.replace('_', ' ').title()}: {status}")
                    
                self.log(f"  Category Score: {category_passed}/{category_total}")
                
            elif isinstance(result, bool):
                total_tests += 1
                if result:
                    passed_tests += 1
                status = "✅ PASS" if result else "❌ FAIL"
                self.log(f"\n{category.upper().replace('_', ' ')}: {status}")
                
        self.log("=" * 60)
        self.log(f"OVERALL SCORE: {passed_tests}/{total_tests} ({(passed_tests/total_tests*100):.1f}%)")
        
        if passed_tests == total_tests:
            self.log("🎉 ALL TESTS PASSED! Backend is fully functional.")
        elif passed_tests >= total_tests * 0.8:
            self.log("⚠️  Most tests passed. Minor issues detected.")
        else:
            self.log("❌ Multiple test failures detected. Backend needs attention.")
            
        self.log("=" * 60)

def main():
    """Main test execution"""
    tester = AgriChainAPITester()
    
    try:
        results = tester.run_comprehensive_test()
        tester.print_test_summary(results)
        
        # Return exit code based on results
        total_tests = 0
        passed_tests = 0
        
        for category, result in results.items():
            if isinstance(result, dict):
                total_tests += len(result)
                passed_tests += sum(1 for v in result.values() if v)
            elif isinstance(result, bool):
                total_tests += 1
                if result:
                    passed_tests += 1
                    
        # Exit with error code if less than 80% tests pass
        if passed_tests < total_tests * 0.8:
            exit(1)
        else:
            exit(0)
            
    except KeyboardInterrupt:
        tester.log("Test execution interrupted by user", "ERROR")
        exit(1)
    except Exception as e:
        tester.log(f"Test execution failed: {e}", "ERROR")
        exit(1)

if __name__ == "__main__":
    main()
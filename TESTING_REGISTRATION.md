# Testing Registration After Database Fix

## Quick Test Commands

After creating the database tables in Supabase, use these commands to test:

### 1. Test User Registration

```bash
curl -X POST http://localhost:8001/api/user/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"farmer@test.com\",\"password\":\"password123\",\"name\":\"John Farmer\",\"role\":\"farmer\"}"
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "farmer@test.com",
      "name": "John Farmer",
      "role": "farmer"
    },
    "token": "jwt-token-here"
  }
}
```

### 2. Test User Login

```bash
curl -X POST http://localhost:8001/api/user/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"farmer@test.com\",\"password\":\"password123\"}"
```

### 3. Test Different Roles

**Register Distributor:**
```bash
curl -X POST http://localhost:8001/api/user/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"distributor@test.com\",\"password\":\"password123\",\"name\":\"ABC Distribution\",\"role\":\"distributor\"}"
```

**Register Retailer:**
```bash
curl -X POST http://localhost:8001/api/user/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"retailer@test.com\",\"password\":\"password123\",\"name\":\"Fresh Market\",\"role\":\"retailer\"}"
```

### 4. Test Error Cases

**Duplicate Email:**
```bash
curl -X POST http://localhost:8001/api/user/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"farmer@test.com\",\"password\":\"password123\",\"name\":\"Another Farmer\",\"role\":\"farmer\"}"
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Invalid Role:**
```bash
curl -X POST http://localhost:8001/api/user/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid@test.com\",\"password\":\"password123\",\"name\":\"Invalid User\",\"role\":\"admin\"}"
```

**Expected Error Response:**
```json
{
  "success": false,
  "message": "Invalid role specified"
}
```

## Frontend Testing

### 1. Start Frontend Server

```bash
cd "c:\Users\Kartik\Desktop\RVCE\CS\SIH\agroblockchain\frontend"
npm run dev
```

### 2. Test Frontend Registration

1. Open http://localhost:5173
2. Click on Login/Register
3. Switch to "Sign Up" mode
4. Fill in the form:
   - Email: test@example.com
   - Password: password123
   - Name: Test User
   - Role: farmer/distributor/retailer
5. Click "Sign Up"

**Expected Result:**
- Success message appears
- User is logged in automatically
- Dashboard loads based on user role

## Troubleshooting

### If Backend Shows Database Errors:
1. Verify tables were created in Supabase dashboard
2. Check Supabase project URL matches .env file
3. Restart backend server

### If Registration Still Fails:
1. Check backend logs for specific error messages
2. Verify Supabase service role key has proper permissions
3. Test database connection directly in Supabase dashboard

### Health Check:
```bash
curl http://localhost:8001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-22T17:45:00.000Z",
  "service": "AgriChain Backend"
}
```

## Success Indicators

✅ **Backend starts without database errors**
✅ **Registration returns JWT token**
✅ **Login works with registered users**
✅ **Different roles can be created**
✅ **Duplicate emails are rejected**
✅ **Frontend registration flow works**

Once all tests pass, your registration system is fully functional!
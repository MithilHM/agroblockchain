"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
const supabaseAdmin = (0, supabase_js_1.createClient)(env_1.config.supabase.url, env_1.config.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
async function verifyDatabase() {
    console.log('🔍 Verifying database tables...');
    console.log('-----------------------------------');
    try {
        // Test 1: Check users table
        console.log('📋 Testing users table...');
        const { data: usersData, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id')
            .limit(1);
        if (usersError) {
            console.log('❌ Users table error:', usersError.message);
            return false;
        }
        else {
            console.log('✅ Users table is accessible');
        }
        // Test 2: Check produce_batches table
        console.log('📦 Testing produce_batches table...');
        const { data: batchData, error: batchError } = await supabaseAdmin
            .from('produce_batches')
            .select('id')
            .limit(1);
        if (batchError) {
            console.log('❌ Produce_batches table error:', batchError.message);
            return false;
        }
        else {
            console.log('✅ Produce_batches table is accessible');
        }
        // Test 3: Check audit_logs table
        console.log('📝 Testing audit_logs table...');
        const { data: auditData, error: auditError } = await supabaseAdmin
            .from('audit_logs')
            .select('id')
            .limit(1);
        if (auditError) {
            console.log('❌ Audit_logs table error:', auditError.message);
            return false;
        }
        else {
            console.log('✅ Audit_logs table is accessible');
        }
        // Test 4: Check batch_transfers table
        console.log('🔄 Testing batch_transfers table...');
        const { data: transferData, error: transferError } = await supabaseAdmin
            .from('batch_transfers')
            .select('id')
            .limit(1);
        if (transferError) {
            console.log('❌ Batch_transfers table error:', transferError.message);
            return false;
        }
        else {
            console.log('✅ Batch_transfers table is accessible');
        }
        console.log('-----------------------------------');
        console.log('🎉 All database tables are working correctly!');
        console.log('✅ Registration should now work properly');
        return true;
    }
    catch (error) {
        console.error('❌ Database verification failed:', error);
        return false;
    }
}
async function testRegistration() {
    console.log('\n🧪 Testing registration functionality...');
    console.log('-----------------------------------');
    try {
        // Create a test user
        const testUser = {
            email: 'test-verification@example.com',
            password_hash: '$2a$10$test.hash.for.verification',
            name: 'Test Verification User',
            role: 'farmer'
        };
        const { data, error } = await supabaseAdmin
            .from('users')
            .insert([testUser])
            .select('id, email, name, role')
            .single();
        if (error) {
            console.log('❌ Test registration failed:', error.message);
            return false;
        }
        else {
            console.log('✅ Test user created successfully');
            console.log('📋 User data:', data);
            // Clean up test user
            await supabaseAdmin
                .from('users')
                .delete()
                .eq('email', testUser.email);
            console.log('🧹 Test user cleaned up');
            return true;
        }
    }
    catch (error) {
        console.error('❌ Registration test failed:', error);
        return false;
    }
}
// Execute verification
async function runVerification() {
    console.log('🚀 Starting AgriChain Database Verification\n');
    const dbVerified = await verifyDatabase();
    if (dbVerified) {
        const regTest = await testRegistration();
        if (regTest) {
            console.log('\n🎯 VERIFICATION COMPLETE');
            console.log('✅ Database is fully functional');
            console.log('✅ Registration will work');
            console.log('🚀 You can now start your backend server!');
            process.exit(0);
        }
    }
    console.log('\n⚠️  VERIFICATION FAILED');
    console.log('❌ Database tables may not be created properly');
    console.log('📋 Please follow the REGISTRATION_FIX_GUIDE.md');
    process.exit(1);
}
runVerification();
//# sourceMappingURL=verifyDatabase.js.map
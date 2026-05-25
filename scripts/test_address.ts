
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
// WARNING: This key is visible in client side code, so it is safe to use here for public data.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testAddressSave = async () => {
    try {
        // 1. Get a real user ID first (we'll use a hardcoded valid one from previous logs or fetch one)
        // For testing, I'll try to fetch a user first or use a known one.
        // Since I don't have a login session here, I might need to act as a specific user or use the anon key if RLS allows.
        // RLS for 'addresses' usually requires auth.uid() = user_id.
        // So I'll try to sign in first with a test account if possible, OR
        // I'll trust the error message if it says "RLS violation".

        // Let's try to just insert with a random UUID for user_id and see if it fails with RLS error.
        const testUserId = '00000000-0000-0000-0000-000000000000';

        console.log("Attempting to insert address...");
        const { data, error } = await supabase.from('addresses').insert({
            user_id: testUserId,
            name: 'Test Wrapper',
            mobile: '1234567890',
            pincode: '110001',
            line1: 'Test Line 1',
            city: 'Test City',
            state: 'Test State',
            type: 'Home',
            is_default: false
        });

        if (error) {
            console.error("Insert Error:", JSON.stringify(error, null, 2));
        } else {
            console.log("Insert Success:", data);
        }

    } catch (e) {
        console.error("Script error:", e);
    }
};

testAddressSave();

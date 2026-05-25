import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUser(phone) {
    console.log(`Checking user with phone: ${phone}`);

    // Clean phone
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const searchPhone = `+91${cleanPhone}`;

    // 1. Check auth table (admin api needed usually, but we can do a dummy OTP to check if rate limited, etc)
    // Skip auth check for now, let's just check the pre_approved_partners table

    // 2. Check pre_approved_partners table
    const { data, error } = await supabase
        .from('pre_approved_partners')
        .select('*')
        .eq('mobile_number', searchPhone);

    if (error) {
        console.error("Error fetching from pre_approved_partners:", error);
        return;
    }

    console.log("Found in pre_approved_partners:");
    console.log(data);

    // Check variations without +91
    const { data: data2 } = await supabase
        .from('pre_approved_partners')
        .select('*')
        .eq('mobile_number', cleanPhone);

    if (data2 && data2.length > 0) {
        console.log("Found in pre_approved_partners WITHOUT +91 prefix:");
        console.log(data2);
    }
}

// Check common test numbers or just the latest entries
async function getLatest() {
    const { data, error } = await supabase
        .from('pre_approved_partners')
        .select('id, ownerName, storeName, mobile_number, status, onboardingStep')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log("Latest 5 partners:");
    console.log(data);
}

getLatest();

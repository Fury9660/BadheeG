import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://esykxyhbawwdifubbdng.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getLatest() {
    const { data, error } = await supabase
        .from('pre_approved_partners')
        .select('id, ownerName, storeName, mobile_number, status, onboardingStep')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("DB Error:", error);
    } else {
        console.log("Latest 5 partners:");
        console.log(data);
    }
}

getLatest();

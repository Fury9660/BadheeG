const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    try {
        console.log("Fetching last 5 orders with tracking...");
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, order_id, tracking_id, lrn_number, waybill, label_url, delhivery_status')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        console.log("Orders:", JSON.stringify(orders, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();

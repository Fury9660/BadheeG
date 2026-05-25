
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
// WARNING: This key is visible in client side code, so it is safe to use here for public data.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const checkProducts = async () => {
    try {
        console.log("Fetching products...");
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .limit(10);

        if (error) {
            console.error("Error fetching products:", error);
        } else {
            console.log("Products found:", data?.length);
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Script error:", e);
    }
};

checkProducts();

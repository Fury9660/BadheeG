
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const checkColumns = async () => {
    try {
        console.log("Fetching one product to check keys...");
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .limit(1);

        if (error) {
            console.error("Error fetching product:", error);
        } else if (data && data.length > 0) {
            console.log("Product Keys:", Object.keys(data[0]));
        } else {
            console.log("No products found.");
        }
    } catch (e) {
        console.error("Script error:", e);
    }
};

checkColumns();

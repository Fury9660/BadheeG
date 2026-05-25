
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const checkAddressColumns = async () => {
    try {
        console.log("Fetching one address to check keys...");
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .limit(1);

        if (error) {
            console.error("Error fetching address:", error);
        } else if (data && data.length > 0) {
            console.log("Address Keys:", Object.keys(data[0]));
        } else {
            console.log("No addresses found to check keys. Trying to insert to see if keys return.");
            // If no data, we can't see keys from select *. 
            // We'll rely on the error from previous script, but maybe listing columns via RPC or assumption?
            // Since we can't query information_schema easily with client, we assume empty table.
        }
    } catch (e) {
        console.error("Script error:", e);
    }
};

checkAddressColumns();

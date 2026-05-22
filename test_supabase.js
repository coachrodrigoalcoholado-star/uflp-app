const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('Service Key length:', supabaseServiceKey ? supabaseServiceKey.length : 0);

async function test() {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing credentials!');
        return;
    }

    const client = createClient(supabaseUrl, supabaseAnonKey);
    const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    console.log('\n--- Testing with Anon Client ---');
    try {
        const { data: buckets, error: bError } = await client.storage.listBuckets();
        if (bError) {
            console.error('Error listing buckets (Anon):', bError);
        } else {
            console.log('Buckets (Anon):', buckets);
        }
    } catch (e) {
        console.error('Exception listing buckets (Anon):', e);
    }

    if (serviceClient) {
        console.log('\n--- Testing with Service Client ---');
        try {
            const { data: buckets, error: bError } = await serviceClient.storage.listBuckets();
            if (bError) {
                console.error('Error listing buckets (Service):', bError);
            } else {
                console.log('Buckets (Service):', buckets);
            }
        } catch (e) {
            console.error('Exception listing buckets (Service):', e);
        }

        // Test listing files in payments bucket
        try {
            const { data: files, error: fError } = await serviceClient.storage.from('payments').list();
            if (fError) {
                console.error('Error listing files in "payments" bucket:', fError);
            } else {
                console.log('Files in "payments" bucket:', files);
            }
        } catch (e) {
            console.error('Exception listing files:', e);
        }
    }
}

test();

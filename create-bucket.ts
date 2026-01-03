
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing Supabase environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log(`Attempting to create 'payments' bucket on ${supabaseUrl}...`);

    // Check if exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error("Error listing buckets:", listError);
        return;
    }

    const exists = buckets.find(b => b.name === 'payments');

    if (exists) {
        console.log("Bucket 'payments' already exists.");
        // Try to update public to true just in case
        const { error: updateError } = await supabase.storage.updateBucket('payments', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
        });
        if (updateError) console.error("Error updating bucket to public:", updateError);
        else console.log("Ensured bucket is public.");

        return;
    }

    const { data, error } = await supabase.storage.createBucket('payments', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
    });

    if (error) {
        console.error("Error creating bucket:", error);
    } else {
        console.log("Successfully created 'payments' bucket!");
    }
}

createBucket();

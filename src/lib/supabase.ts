import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    console.error("Supabase environment variables missing or placeholder.");
    // We don't throw to avoid crashing build, but we log loud
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadFileToSupabase(file: Buffer, filename: string, contentType: string) {
    const { data, error } = await supabase
        .storage
        .from('documents') // Ensure this bucket exists in Supabase
        .upload(filename, file, {
            contentType,
            upsert: true
        });

    if (error) {
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
        .storage
        .from('documents')
        .getPublicUrl(filename);

    return publicUrl;
}

export async function deleteFileFromSupabase(url: string) {
    // Extract path from URL
    // URL format: https://[project-id].supabase.co/storage/v1/object/public/documents/[filename]
    const path = url.split('/documents/').pop();

    if (!path) return;

    const { error } = await supabase
        .storage
        .from('documents')
        .remove([path]);

    if (error) {
        throw error;
    }
}

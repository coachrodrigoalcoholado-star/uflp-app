import { createClient } from '@supabase/supabase-js'

// Use trim() to remove any accidental whitespace from copy-pasting
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Environment Variables!')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function uploadFileToSupabase(file: Buffer, filename: string, contentType: string) {
    const { data, error } = await supabase
        .storage
        .from('documents') // Ensure this bucket exists in Supabase dashboard
        .upload(filename, file, {
            contentType,
            upsert: true
        });

    if (error) {
        throw error;
    }

    const { data: { publicUrl } } = supabase
        .storage
        .from('documents')
        .getPublicUrl(filename);

    return publicUrl;
}

export async function deleteFileFromSupabase(url: string) {
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


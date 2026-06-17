import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    ''
).trim()

if (!supabaseUrl || !supabaseKey) {
    console.warn('Warning: Missing Supabase Environment Variables!')
}

// Create client only if both variables are present, otherwise export a recursive proxy to prevent crash on import
const createDummyProxy = (path: string = 'supabase'): any => {
    const dummy = () => {
        throw new Error(`${path} called but Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.`);
    };
    return new Proxy(dummy, {
        get(target, prop) {
            if (typeof prop === 'symbol') return undefined;
            return createDummyProxy(`${path}.${String(prop)}`);
        }
    });
};

export const supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey)
    : createDummyProxy();

export async function uploadFileToSupabase(file: Buffer, filename: string, contentType: string) {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase is not configured.');
    }
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
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase is not configured.');
    }
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


const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '..', '.env.production.verify');
const envPath = path.join(__dirname, '..', '.env');

try {
    const content = fs.readFileSync(backupPath, 'utf8');
    const lines = content.split('\n');
    let newEnvContent = '';

    const keysToRestore = [
        'DATABASE_URL',
        'DIRECT_URL',
        'NEXTAUTH_SECRET',
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const line of lines) {
        for (const key of keysToRestore) {
            if (line.startsWith(key + '=')) {
                // Extract value, remove quotes if wrapping, remove \r, \n
                let value = line.substring(key.length + 1).trim();
                // Remove surrounding quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                // Remove literal \r\n if they exist in the string text (unexpected but possible from view_file output)
                // view_file showed literal characters? or just encoding?
                // The provided view_file output showed: DATABASE_URL="...limit=1\r\n"
                // This implies the string *contains* the characters \r\n. 
                // We should clean that.
                value = value.replace(/\\r\\n/g, '').replace(/[\r\n]/g, '');

                newEnvContent += `${key}="${value}"\n`;
            }
        }
    }

    fs.writeFileSync(envPath, newEnvContent, 'utf8');
    console.log("Restored .env from verify file.");
    console.log(newEnvContent);

} catch (e) {
    console.error("Error restoring:", e);
}

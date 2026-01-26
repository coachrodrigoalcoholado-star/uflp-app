const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

try {
    // Try reading as utf16le
    const content = fs.readFileSync(envPath, 'utf16le');
    console.log("--- Content Start ---");
    console.log(content);
    console.log("--- Content End ---");

    // If it looks like an env file (has DATABASE_URL), save as utf8
    if (content.includes('DATABASE_URL=')) {
        fs.writeFileSync(envPath, content, 'utf8');
        console.log("Successfully converted .env to UTF-8");
    } else {
        console.log("Content did not look like .env file, trying utf8...");
        const contentUtf8 = fs.readFileSync(envPath, 'utf8');
        console.log("--- UTF8 Content Start ---");
        console.log(contentUtf8);
        console.log("--- UTF8 Content End ---");
    }

} catch (e) {
    console.error("Error:", e);
}

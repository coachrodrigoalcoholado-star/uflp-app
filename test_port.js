const net = require('net');

const host = 'aws-0-us-west-2.pooler.supabase.com';
const port = 6543;

console.log(`Connecting to ${host}:${port}...`);

const socket = net.createConnection(port, host, () => {
    console.log('Successfully connected to host and port!');
    socket.end();
});

socket.on('error', (err) => {
    console.error('Connection failed:', err.message);
});

socket.setTimeout(5000, () => {
    console.log('Connection timed out after 5 seconds.');
    socket.destroy();
});

// Native fetch is available in Node 18+

async function testRegister() {
    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'testapi_debug@test.com',
                password: '123456',
                firstName: 'TestDebug',
                lastNamePaterno: 'User',
            }),
        });

        const text = await response.text();
        console.log('Status:', response.status);
        try {
            const data = JSON.parse(text);
            console.log('Response JSON:', data);
        } catch (e) {
            console.log('Response Text (Error):', text);
        }
    } catch (error) {
        console.error('Error executing fetch:', error);
    }
}

testRegister();


async function testDashboardApi() {
    try {
        // Must be running locally on port 3000
        const response = await fetch('http://localhost:3000/api/admin/dashboard', {
            headers: {
                // Mimic a session if possible, or we might hit 401. 
                // Since we can't easily mock auth headers for real NextAuth without a real cookie, 
                // this test might return 401 if we don't disable auth or have a token.
                // However, we can check if the endpoint exists and returns 401 (which means it's there).
                // Or we can rely on the user manual verification.
                // Let's just check reachability.
            }
        });

        console.log(`Status: ${response.status}`);
        if (response.status === 200) {
            const data = await response.json();
            console.log(`Retrieved ${data.length} students`);
            if (data.length > 0) {
                console.log("Sample student:", data[0].email);
                console.log("Documents:", data[0].documents?.length);
            }
        } else if (response.status === 401) {
            console.log("Endpoint protected (expected). Manual login required to view data.");
        } else {
            console.log("Unexpected status:", response.statusText);
        }
    } catch (error) {
        console.error("Error testing API:", error);
    }
}

testDashboardApi();

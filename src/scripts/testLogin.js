
const testLogin = async () => {
    try {
        console.log("Attempting to login as superadmin using USERNAME...");
        
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'superadmin', // Login controller accepts username in email field
                    password: 'Admin@123456'
                })
            });

            const data = await res.json();
            
            console.log("Status:", res.status);
            
            if (res.status === 200) {
                console.log("\n✅ API says: Login Successful via USERNAME! No verification needed.");
            } else if (res.status === 403 && data.emailVerificationRequired) {
                console.log("\n❌ API says: Verification REQUIRED via USERNAME!");
            } else {
                console.log(`\n❌ API says: Failed with status ${res.status}`);
            }

        } catch (fetchError) {
             console.log("\n❌ Network Error! Is the server running?");
        }
        
    } catch (e) {
        console.error("Script Error:", e);
    }
};

testLogin();

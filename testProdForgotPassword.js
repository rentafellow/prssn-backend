import https from 'https';

const postData = JSON.stringify({ email: "awadhkishorsingh241@gmail.com" });

const options = {
  hostname: 'prssn-backend.onrender.com',
  port: 443,
  path: '/api/auth/forgot-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const makeRequest = () => {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                resolve({ status: res.statusCode, body });
            });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
};

const test = async () => {
    try {
        const res = await makeRequest();
        console.log(`STATUS: ${res.status}`);
        console.log(`BODY: ${res.body}`);
    } catch (e) {
        console.error(e);
    }
};

test();

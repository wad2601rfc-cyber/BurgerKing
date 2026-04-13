import fetch from 'node-fetch';

const AI_CONFIG = {
    apiKey: 'YOUR_API_KEY_HERE',
    model: 'llama3-8b-8192',
    url: 'https://api.groq.com/openai/v1/chat/completions'
};

async function testGroq() {
    try {
        const response = await fetch(AI_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'test' }],
                model: AI_CONFIG.model
            })
        });
        const data = await response.json();
        console.log('API Status:', response.status);
        console.log('Response:', JSON.stringify(data).substring(0, 100));
    } catch (err) {
        console.error('Test Failed:', err);
    }
}

testGroq();

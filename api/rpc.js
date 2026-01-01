// Vercel Serverless Function - RPC Proxy for Casper Testnet
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Forward request to Casper testnet RPC
        const response = await fetch('https://node.testnet.casper.network/rpc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        return res.status(response.status).json(data);
    } catch (error) {
        console.error('RPC Proxy Error:', error);
        return res.status(500).json({
            error: 'Failed to proxy RPC request',
            message: error.message
        });
    }
}

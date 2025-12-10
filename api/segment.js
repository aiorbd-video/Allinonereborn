import fetch from 'node-fetch'; // অথবা Node 18+ এ বিল্ট-ইন fetch

export default async function handler(req, res) {
    const { payload } = req.query;

    // ১. সিকিউরিটি চেক (যাতে অন্য কেউ আপনার ব্যান্ডউইথ চুরি না করে)
    const referer = req.headers.referer || req.headers.origin || '';
    const allowedOrigins = ['bd71.vercel.app', 'localhost'];
    
    const isAllowed = allowedOrigins.some(domain => referer.includes(domain));
    
    if (!isAllowed) {
        return res.status(403).send("Access Denied");
    }

    if (!payload) {
        return res.status(400).send("No payload provided");
    }

    try {
        // আমরা URL টি encode করে পাঠিয়েছিলাম, এখন decode করছি
        const targetUrl = Buffer.from(payload, 'base64').toString('utf-8');

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://google.com'
            }
        });

        if (!response.ok) return res.status(response.status).send("Error fetching segment");

        // ২. বাফারিং এড়াতে এবং ফাস্ট করতে স্ট্রিম পাইপ করা (গুরুত্বপূর্ণ)
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'video/MP2T'); // TS ফাইলের টাইপ
        res.send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).send("Segment Error");
    }
}


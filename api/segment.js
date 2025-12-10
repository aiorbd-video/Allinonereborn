import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { payload } = req.query;

    if (!payload) return res.status(400).send("Bad Request");

    try {
        const targetUrl = Buffer.from(payload, 'base64').toString('utf-8');

        // সেগমেন্ট ফেচ করা
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://google.com'
            }
        });

        if (!response.ok) {
            // সেগমেন্ট না পেলে 404 দিন, যাতে প্লেয়ার পরেরটা ট্রাই করে
            return res.status(404).send("Segment not found"); 
        }

        // বাইনারি ডেটা বাফার হিসেবে নেওয়া
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // হেডার এবং ডেটা পাঠানো
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'video/MP2T');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // ক্যাশ করলে ফাস্ট হবে
        res.send(buffer);

    } catch (error) {
        console.error("Segment Error:", error.message);
        res.status(500).send("Error");
    }
}



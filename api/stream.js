import fetch from 'node-fetch';
import channels from '../channels.js';

export default async function handler(req, res) {
    const { id } = req.query;

    // ১. সিকিউরিটি চেক: রিকোয়েস্ট কি আপনার সাইট থেকে আসছে?
    // লোকালহোস্টে টেস্ট করার জন্য 'localhost' রাখা হয়েছে, লাইভ হলে এটা বাদ দিতে পারেন।
    const allowedOrigins = ['bd71.vercel.app', 'localhost'];
    
    const referer = req.headers.referer || req.headers.origin || '';
    const isAllowed = allowedOrigins.some(domain => referer.includes(domain));

    if (!isAllowed) {
        return res.status(403).json({ 
            error: 'Access Denied', 
            message: 'This stream only works on bd71.vercel.app' 
        });
    }

    // ২. চ্যানেল আইডি চেক করা
    if (!id || !channels[id]) {
        return res.status(404).json({ error: 'Channel not found' });
    }

    const targetUrl = channels[id];

    try {
        // ৩. আসল সার্ভার থেকে M3U8 লোড করা
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://google.com' // কিছু সার্ভার Referer চেক করে, তাই গুগলের নাম দেওয়া হলো
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch stream: ${response.statusText}`);
        }

        let m3u8Content = await response.text();

        // ৪. রিলেটিভ পাথ ফিক্স করা (খুবই গুরুত্বপূর্ণ)
        // আসল M3U8 ফাইলের ভেতরে যদি শুধু "segment1.ts" থাকে, সেটা আমাদের সার্ভারে কাজ করবে না।
        // তাই আমরা সেটাকে "https://original-site.com/segment1.ts" এ কনভার্ট করে দেব।
        
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        
        // যে লাইনগুলো '#' দিয়ে শুরু নয় (মানে ভিডিও ফাইলের নাম), সেগুলোর আগে বেস URL বসানো
        m3u8Content = m3u8Content.split('\n').map(line => {
            line = line.trim();
            if (line && !line.startsWith('#') && !line.startsWith('http')) {
                return baseUrl + line;
            }
            return line;
        }).join('\n');

        // ৫. রেসপন্স পাঠানো
        res.setHeader('Access-Control-Allow-Origin', '*'); // প্লেয়ার যাতে লোড করতে পারে
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.status(200).send(m3u8Content);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Stream error' });
    }
}


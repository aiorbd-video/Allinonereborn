import channels from '../channels.js';

export default async function handler(req, res) {
    const { id } = req.query;
    
    // হেডার সেটআপ
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!id || !channels[id]) {
        return res.status(404).send("#EXTM3U\n#EXT-X-ERROR: Channel not found");
    }

    const targetUrl = channels[id];

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://google.com'
            }
        });

        const m3u8Content = await response.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

        // --- ম্যাজিক পার্ট: লিঙ্ক এনক্রিপ্ট এবং রিপ্লেস করা ---
        const fixedContent = m3u8Content.split('\n').map(line => {
            const trimmed = line.trim();
            
            // যদি এটি কোনো লিঙ্ক হয় (কমেন্ট বা খালি লাইন না হয়)
            if (trimmed && !trimmed.startsWith('#')) {
                // ১. পূর্ণাঙ্গ URL তৈরি করা
                const absoluteUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
                
                // ২. URL টি Base64 এ এনকোড করা (যাতে দেখতে বিদঘুটে লাগে এবং নিরাপদ থাকে)
                const encodedUrl = Buffer.from(absoluteUrl).toString('base64');
                
                // ৩. আমাদের প্রক্সি লিঙ্ক বসিয়ে দেওয়া
                // প্লেয়ার এখন Bozztv তে না গিয়ে আপনার vercel এ রিকোয়েস্ট করবে
                return `/api/segment?payload=${encodedUrl}`;
            }
            return line;
        }).join('\n');

        return res.status(200).send(fixedContent);

    } catch (error) {
        console.error(error);
        return res.status(500).send("#EXTM3U\n#EXT-X-ERROR: Server Error");
    }
}



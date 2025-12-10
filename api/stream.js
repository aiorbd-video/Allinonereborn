import fetch from 'node-fetch'; // অথবা বিল্ট-ইন fetch
import channels from '../channels.js';

export default async function handler(req, res) {
    const { id, url } = req.query;

    // ১. টার্গেট URL বের করা
    let targetUrl = "";
    
    if (id && channels[id]) {
        // যদি চ্যানেল আইডি দেওয়া থাকে (প্রথম রিকোয়েস্ট)
        targetUrl = channels[id];
    } else if (url) {
        // যদি এনকোডেড URL দেওয়া থাকে (নেস্টেড প্লেলিস্টের জন্য)
        try {
            targetUrl = Buffer.from(url, 'base64').toString('utf-8');
        } catch (e) {
            return res.status(400).send("Invalid URL encoding");
        }
    } else {
        return res.status(404).send("#EXTM3U\n#EXT-X-ERROR: No Channel or URL provided");
    }

    // ২. বর্তমান হোস্ট ডোমেইন বের করা (যাতে লিঙ্ক ভুল না হয়)
    // যেমন: https://bd71.vercel.app
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const myDomain = `${protocol}://${host}`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://google.com'
            }
        });

        if (!response.ok) return res.status(response.status).send("#EXTM3U\n#EXT-X-ERROR: Source Offline");

        const m3u8Content = await response.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

        // ৩. লাইন বাই লাইন লিঙ্ক পরিবর্তন করা
        const fixedContent = m3u8Content.split('\n').map(line => {
            const trimmed = line.trim();

            // যদি এটি কোনো লিঙ্ক হয়
            if (trimmed && !trimmed.startsWith('#')) {
                // অরিজিনাল পূর্ণাঙ্গ লিঙ্ক তৈরি
                const absoluteUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
                const encodedUrl = Buffer.from(absoluteUrl).toString('base64');

                // লজিক: 
                // ফাইলটি যদি .m3u8 হয় -> আবার stream.js দিয়ে লোড করো
                // ফাইলটি যদি .ts হয় -> segment.js দিয়ে লোড করো
                if (absoluteUrl.includes('.m3u8')) {
                    return `${myDomain}/api/stream?url=${encodedUrl}`;
                } else {
                    return `${myDomain}/api/segment?payload=${encodedUrl}`;
                }
            }
            return line;
        }).join('\n');

        // ৪. রেসপন্স পাঠানো
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send(fixedContent);

    } catch (error) {
        console.error(error);
        res.status(500).send("#EXTM3U\n#EXT-X-ERROR: Stream Error");
    }
}



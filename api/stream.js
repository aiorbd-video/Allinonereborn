import channels from '../channels.js';

export default async function handler(req, res) {
    const { id } = req.query;

    // ১. রেসপন্স হেডার সেট করা (খুবই জরুরি)
    // এটি ব্রাউজার বা প্লেয়ারকে বলে যে এটি একটি ভিডিও প্লেলিস্ট
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // ডাউনলোড বা প্লে করার সময় ফাইলের নাম ঠিক করা
    res.setHeader('Content-Disposition', `inline; filename="${id || 'stream'}.m3u8"`);

    // ২. চ্যানেল না থাকলে 404 দিন (JSON নয়)
    if (!id || !channels[id]) {
        return res.status(404).send("#EXTM3U\n#EXT-X-ERROR: Channel not found");
    }

    // ৩. অরিজিন চেক (নিরাপত্তা)
    const referer = req.headers.referer || req.headers.origin || '';
    const allowedOrigins = ['bd71.vercel.app', 'localhost'];
    
    // টেস্টিং এর জন্য আপাতত চেক অফ রাখতে পারেন, লাইভ করার সময় অন করবেন
    const isAllowed = allowedOrigins.some(domain => referer.includes(domain));
    
    if (!isAllowed) {
        // প্লেয়ারকে একটি ফেক এরর ফাইল পাঠানো
        return res.status(403).send("#EXTM3U\n#EXT-X-ERROR: Access Denied (bd71 only)");
    }

    const targetUrl = channels[id];

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://google.com'
            }
        });

        if (!response.ok) {
            return res.status(response.status).send(`#EXTM3U\n#EXT-X-ERROR: Source Offline (${response.status})`);
        }

        const m3u8Content = await response.text();

        // ৪. লিঙ্ক ফিক্স করা (Absolute Path)
        // এটি রিলেটিভ লিঙ্ক (.ts) কে পূর্ণাঙ্গ লিঙ্কে রূপান্তর করে
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        
        const fixedContent = m3u8Content.split('\n').map(line => {
            const trimmed = line.trim();
            // যদি লাইনটি কমেন্ট না হয় এবং http দিয়ে শুরু না হয়
            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('http')) {
                return baseUrl + trimmed;
            }
            return line;
        }).join('\n');

        // ৫. ফাইনাল M3U8 আউটপুট পাঠানো
        return res.status(200).send(fixedContent);

    } catch (error) {
        console.error('Stream Error:', error);
        // সার্ভার ক্র্যাশ না করিয়ে একটি এরর M3U8 পাঠানো
        return res.status(500).send("#EXTM3U\n#EXT-X-ERROR: Server Error");
    }
}



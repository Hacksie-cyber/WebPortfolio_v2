export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; // We'll set this in Vercel

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are the AI assistant for Prof. Engr. Don Nicole Bamuya. 
                        Background: He is an Engineering Faculty at STI Surigao. 
                        Expertise: Cybersecurity (Ethical Hacking), IoT (ESP32, Raspberry Pi), AI Prompting. 
                        Tone: Professional, helpful, and technical.
                        
                        The user asked: ${message}`
                    }]
                }]
            })
        });

        const data = await response.json();
        const reply = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ reply });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch from Gemini' });
    }
}
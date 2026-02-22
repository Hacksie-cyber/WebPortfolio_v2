export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    // 2. Check if API Key exists
    if (!API_KEY) {
        return res.status(500).json({ error: 'API Key is missing in Vercel environment variables.' });
    }

    try {
        // Using Gemini 1.5 Flash - The current standard for speed/cost
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{
                        text: `You are the AI assistant for Prof. Engr. Don Nicole Bamuya. 
                        Context: He is an Engineering Faculty at STI Surigao. 
                        Expertise: Cybersecurity (Ethical Hacking), IoT (ESP32, Raspberry Pi), AI Prompting. 
                        Instruction: Keep answers concise, professional, and technical. If asked about contact info, refer to his email: donnicole.bamuya@surigao.sti.edu.ph.
                        
                        User Question: ${message}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                }
            })
        });

        const data = await response.json();

        // 3. Robust Error Checking for the Google Response
        if (data.error) {
            console.error('Google API Error:', data.error);
            return res.status(500).json({ error: data.error.message });
        }

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            return res.status(500).json({ error: 'Unexpected response format from Google.' });
        }

        const reply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    // Ensure this matches the name in your Vercel Dashboard
    const API_KEY = process.env.GEMINI_API_KEY; 
    const MODEL = "gemini-2.5-flash"; 

    // 1. Check if the key is actually being read
    if (!API_KEY) {
        return res.status(200).json({ 
            reply: "DEBUG ERROR: The API Key is missing. Did you add GEMINI_API_KEY to Vercel Environment Variables and redeploy?" 
        });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `You are the AI Assistant for Prof. Engr. Don Nicole Bamuya. User Question: ${message}` }]
                }]
            })
        });

        const data = await response.json();

        // 2. Check if Google returned an error
        if (data.error) {
            return res.status(200).json({ 
                reply: `GOOGLE API ERROR: ${data.error.message} (Status: ${data.error.status})` 
            });
        }

        // 3. Extract text carefully
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const textOutput = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply: textOutput });
        } else {
            return res.status(200).json({ reply: "Google returned an empty response. Check model compatibility." });
        }

    } catch (error) {
        return res.status(200).json({ reply: `SERVER ERROR: ${error.message}` });
    }
}

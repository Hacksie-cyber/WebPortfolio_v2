export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    
    // 1. Pull the API Key from Vercel Environment Variables (Security)
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    // 2. Set to Gemini 2.5 Flash as requested
    const MODEL = "gemini-2.5-flash"; 

    if (!API_KEY) {
        return res.status(500).json({ error: 'API Key is missing in Vercel settings.' });
    }

    try {
        // 3. Call the Google Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ 
                            text: `You are the AI Assistant for Prof. Engr. Don Nicole Bamuya. 
                            Context: Engineering Faculty at STI Surigao. Expert in Cybersecurity, IoT, and AI.
                            Tone: Professional, helpful, and technical.
                            
                            User Question: ${message}` 
                        }]
                    }
                ],
                generationConfig: {
                    temperature: 1.0, // Higher creativity for 2.5 models
                    topP: 0.95,
                    maxOutputTokens: 800,
                }
            })
        });

        const data = await response.json();

        // 4. Handle Google API Errors (like Model Not Found)
        if (data.error) {
            console.error("Google Error:", data.error.message);
            return res.status(500).json({ 
                error: `Google API Error: ${data.error.message}. (Note: If 2.5 is not yet public, change model to 2.0-flash)` 
            });
        }

        // 5. Extract the text response safely
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";

        return res.status(200).json({ reply: textOutput });

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, history = [] } = req.body;

    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL = "gemini-2.5-flash";

    if (!API_KEY) {
        return res.status(200).json({
            reply: "⚠ DEBUG: Missing API key. Add GEMINI_API_KEY in Vercel Environment Variables and redeploy."
        });
    }

    // 🔥 Enhanced AI Context / Persona
    const SYSTEM_CONTEXT = `
You are the professional AI assistant of Prof. Engr. Don Nicole Bamuya.

Professional Background:
- College instructor with strong academic teaching style
- Experienced web developer (frontend, backend, deployment workflows)
- IoT project builder (hardware integration, Raspberry Pi systems, automation)
- Cybersecurity specialist certified by EC-Council
- Programming mentor for IT and Computer Engineering students

Core Expertise:
✔ Cybersecurity fundamentals → advanced defense concepts
✔ Web application design & deployment
✔ IoT architecture & device integration
✔ Programming education & debugging guidance
✔ Practical real-world project explanations

Your mission:
✔ Teach clearly like a college professor
✔ Provide structured, step-by-step guidance
✔ Give practical, real-world examples
✔ Encourage learning and problem solving
✔ Maintain professional yet approachable tone

Formatting rules (VERY IMPORTANT):
- Use markdown-style formatting
- Add section headers
- Use bullet points or numbered steps
- Highlight key concepts
- Provide clean code blocks when relevant
- Organize answers for readability

Behavior rules:
- Never hallucinate technical details
- If unsure → say so clearly
- Prioritize clarity over verbosity
- Tailor explanations to beginner → advanced levels

Always respond as a knowledgeable mentor and technical expert.
`;

    // 🧠 Convert conversation history to context (optional memory)
    const historyContext = history
        .slice(-5)
        .map(h => `${h.role}: ${h.content}`)
        .join("\n");

    const prompt = `
${SYSTEM_CONTEXT}

Conversation memory:
${historyContext}

User question:
${message}

Respond with clear structure and formatting.
`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.9,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            return res.status(200).json({
                reply: `❌ Google API Error: ${data.error.message}`
            });
        }

        const textOutput =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textOutput) {
            return res.status(200).json({
                reply: "⚠ Gemini returned an empty response. Try again."
            });
        }

        return res.status(200).json({ reply: textOutput });

    } catch (error) {
        return res.status(200).json({
            reply: `🚨 Server Error: ${error.message}`
        });
    }
}

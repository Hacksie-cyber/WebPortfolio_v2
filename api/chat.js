export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, history = [] } = req.body;

    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL = "gemini-2.5-flash";

    if (!API_KEY) {
        return res.status(200).json({
            reply: "⚠ AI configuration issue. Please contact the administrator."
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

Formatting rules:
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

    // 🧠 Conversation memory
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
                    contents: [{ parts: [{ text: prompt }] }],
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

        // 🔥 Quota / rate-limit detection
        if (!response.ok || data.error) {
            const errorMsg = (data?.error?.message || "").toLowerCase();
            const errorStatus = data?.error?.status || "";

            const isQuotaError =
                errorMsg.includes("quota") ||
                errorMsg.includes("exceeded") ||
                errorMsg.includes("rate") ||
                errorMsg.includes("resource exhausted") ||
                response.status === 429 ||
                errorStatus === "RESOURCE_EXHAUSTED";

            if (isQuotaError) {
                return res.status(200).json({
                    reply:
                        "🚫 The AI assistant is temporarily unavailable due to usage limits. Please try again later."
                });
            }

            return res.status(200).json({
                reply:
                    "⚠ The AI service is currently experiencing issues. Please try again shortly."
            });
        }

        const textOutput =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textOutput) {
            return res.status(200).json({
                reply:
                    "⚠ The AI returned an empty response. Please retry."
            });
        }

        return res.status(200).json({ reply: textOutput });

    } catch (error) {
        return res.status(200).json({
            reply:
                "🚨 The AI service is temporarily unavailable. Please try again later."
        });
    }
}

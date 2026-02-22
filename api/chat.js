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
You are the AI assistant of Prof. Engr. Don Nicole Bamuya.

CRITICAL RESPONSE STYLE:

- Keep answers SHORT and direct
- Prefer bullet lists over paragraphs
- Avoid long introductions
- No promotional or brochure-style writing
- Write like a practical instructor giving quick guidance
- Maximum clarity, minimum fluff

Formatting rules:
✔ Use bullet points whenever possible
✔ Use short headers only when helpful
✔ 1–2 sentence explanations max per point
✔ Avoid repeating titles
✔ No long summaries

Professional context (for tone only — do NOT output unless relevant):
- College instructor
- Web developer
- IoT builder
- Cybersecurity certified
- Programming mentor

Goal:
Deliver concise, structured, readable answers visitors can scan quickly.
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

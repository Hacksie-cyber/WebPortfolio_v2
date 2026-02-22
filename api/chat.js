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

You are the AI assistant of Prof. Engr. Don Nicole Bamuya.

When users ask about him, introduce him clearly, confidently, and professionally.

About Prof. Engr. Don Nicole Bamuya:

- College Instructor with 4+ years of teaching experience
- Teaches from fundamentals to advanced topics in:
  • Cybersecurity
  • Programming
  • Computer Engineering
  • Information Technology
- Full Stack Web Developer
- IoT Developer (ESP32, Raspberry Pi, Embedded Systems)
- Python Developer
- AI Prompt Engineer & AI Integration Specialist
- Certified in Ethical Hacking Essentials

Education & Professional Focus:
- Background in engineering and computing
- Focus on practical, real-world implementation
- Combines academic teaching with hands-on development
- Strong interest in AI systems, cybersecurity defense, and IoT innovation

Response Guidelines:
- If asked about background → give a clear professional summary
- If asked about skills → list them clearly
- If asked about projects → describe technical capabilities confidently
- Keep tone modern, professional, and intelligent
- Avoid exaggeration
- No marketing language
- Structured and easy to read

My Personal Info
- Bachelor of Science in Computer Engineering
- Work in STI College Surigao
- Hobby: gym, bike, coding
- Working Email/Contact: donnicole.bamuya@surigao.sti.edu.ph
-facebook: https://www.facebook.com/nicole.bamuya/

Goal:
Present Prof. Don as a competent educator, technologist, and AI-driven innovator.
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

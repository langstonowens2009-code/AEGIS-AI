const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini client using the environment variable saved in Vercel
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = async (req, res) => {
    // 1. Handle CORS Preflight requests (so your frontend can talk to the backend safely)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'No research text provided.' });
        }

        // 3. Call Google Gemini with strict JSON Schema output
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze these medical research abstracts and return a raw JSON object matching the requested schema exactly. Text to analyze:\n\n${text}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        total_participants: { type: "INTEGER" },
                        consensus_summary: { type: "STRING" },
                        discrepancy_summary: { type: "STRING" },
                        limitations_and_future: { type: "STRING" }
                    },
                    required: ["total_participants", "consensus_summary", "discrepancy_summary", "limitations_and_future"]
                }
            }
        });

        // 4. Parse the AI result and send it directly back to your dashboard UI
        const resultData = JSON.parse(response.text);
        return res.status(200).json(resultData);

    } catch (error) {
        console.error("Vercel Serverless Gemini Error:", error);
        return res.status(500).json({ error: 'Failed to analyze with Gemini API.' });
    }
};

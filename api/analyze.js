const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        
        console.log("Backend received data:", req.body);
        
        if (!text) return res.status(400).json({ error: "No text provided" });

        let response;
        let retries = 3;
        while (retries > 0) {
            try {
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `You are an expert researcher. You must carefully scan every single word of the provided abstracts to fully understand what each paper is discussing. Use this deep understanding to accurately synthesize the consensus and explicitly break down any discrepancies.\n\nAnalyze these research abstracts and return a raw JSON object matching the requested schema exactly. Text to analyze:\n\n${text}`,
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
                break; // success, exit retry loop
            } catch (err) {
                if (err.status === 503 || err.status === 429) {
                    retries--;
                    if (retries === 0) throw err;
                    console.log("Model busy or rate limited, retrying in 2 seconds...");
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    throw err; // other errors
                }
            }
        }

        const resultData = JSON.parse(response.text);
        res.status(200).json(resultData);

    } catch (error) {
        console.error("Gemini API backend error:", error);
        res.status(500).json({ error: "Failed to analyze with Gemini API." });
    }
}

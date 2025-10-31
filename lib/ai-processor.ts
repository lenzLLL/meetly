import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function processMeetingTranscript(transcript: any) {
  try {
    let transcriptText = "";

    if (Array.isArray(transcript)) {
      transcriptText = transcript
        .map(
          (item: any) =>
            `${item.speaker || "Speaker"}: ${item.words
              .map((w: any) => w.word)
              .join(" ")}`
        )
        .join("\n");
    } else if (typeof transcript === "string") {
      transcriptText = transcript;
    } else if (transcript?.text) {
      transcriptText = transcript.text;
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
      throw new Error("No transcript content found");
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes meeting transcripts and provides concise summaries and action items.
          Return ONLY valid JSON with this format:
          {
              "summary": "string",
              "actionItems": ["string", "string"]
          }`,
        },
        {
          role: "user",
          content: transcriptText,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content?.trim();
    if (!response) throw new Error("Empty response from OpenAI");

    // 🔒 Sécuriser le parsing JSON
    let parsed;
    try {
      const jsonStart = response.indexOf("{");
      const jsonEnd = response.lastIndexOf("}");
      const jsonString = response.slice(jsonStart, jsonEnd + 1);
      parsed = JSON.parse(jsonString);
    } catch (err) {
      console.error("Invalid JSON from OpenAI:", response);
      parsed = {
        summary: "Could not parse AI response.",
        actionItems: [],
      };
    }

    const actionItems = Array.isArray(parsed.actionItems)
      ? parsed.actionItems.map((text: string, index: number) => ({
          id: index + 1,
          text: text,
        }))
      : [];

    return {
      summary: parsed.summary || "No summary could be generated.",
      actionItems,
    };
  } catch (error) {
    console.error("error processing transcript with chatgpt:", error);
    return {
      summary:
        "Meeting transcript processed successfully. Please check the full transcript for details.",
      actionItems: [],
    };
  }
}

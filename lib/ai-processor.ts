import OpenAI from "openai";
import { prisma } from "./db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function processMeetingTranscript(transcript: any,id:string) {
    const data = await prisma.user.findUnique({
      where: { id },
    });
    const lang = data?.lang === "en" ? "English" : "French";
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
          content: `You are a meeting transcript analyzer. You MUST respond ONLY in ${lang}.

CRITICAL RULES:
1. Extract information ONLY from what is explicitly stated in the transcript
2. Do NOT invent, assume, or infer anything not directly mentioned
3. Do NOT add context from general knowledge
4. Only mention tasks/points that are explicitly discussed or agreed upon
5. Keep summaries factual and based solely on what was said

Return ONLY valid JSON with exact keys:
- summary: Factual summary (2-3 sentences max)
- actionItems: ONLY explicit action items mentioned
- keyPoints: ONLY topics actually discussed

Format: {"summary": "...", "actionItems": [...], "keyPoints": [...]}`,
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
        keyPoints: [],
      };
    }

    const actionItems = Array.isArray(parsed.actionItems)
      ? parsed.actionItems.map((text: string, index: number) => ({
          id: index + 1,
          text,
        }))
      : [];

    const keyPoints = Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints
      : [];

    return {
      summary:
        parsed.summary ||
        (lang === "English"
          ? "No summary could be generated."
          : "Aucun résumé n'a pu être généré."),
      actionItems,
      keyPoints,
    };
  } catch (error) {
    console.error("error processing transcript with chatgpt:", error);
    return {
      summary:
        lang === "English"
          ? "Meeting transcript processed successfully. Please check the full transcript for details."
          : "La transcription de la réunion a été traitée avec succès. Veuillez consulter la transcription complète pour plus de détails.",
      actionItems: [],
      keyPoints: [],
    };
  }
}

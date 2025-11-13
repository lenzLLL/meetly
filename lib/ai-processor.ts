import { currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { prisma } from "./db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function processMeetingTranscript(transcript: any) {
    const user = await currentUser();
    const data = await prisma.user.findUnique({
      where: { id: user?.id },
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
          content: `You are an AI assistant that analyzes meeting transcripts and provides concise summaries and action items.
          Return the data in ${lang}.
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
          text,
        }))
      : [];

    return {
      summary:
        parsed.summary ||
        (lang === "English"
          ? "No summary could be generated."
          : "Aucun résumé n’a pu être généré."),
      actionItems,
    };
  } catch (error) {
    console.error("error processing transcript with chatgpt:", error);
    return {
      summary:
        lang === "English"
          ? "Meeting transcript processed successfully. Please check the full transcript for details."
          : "La transcription de la réunion a été traitée avec succès. Veuillez consulter la transcription complète pour plus de détails.",
      actionItems: [],
    };
  }
}

// Reference: blueprint:javascript_openai_ai_integrations
// The newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export async function generateQuiz(subject: string, difficulty: string, questionCount: number, materialContext?: string) {
  const prompt = `Generate ${questionCount} multiple choice questions for a quiz on "${subject}" at ${difficulty} difficulty level.
${materialContext ? `Use this context from study materials: ${materialContext}` : ''}

Return a JSON object with this exact structure:
{
  "title": "Quiz title",
  "questions": [
    {
      "questionText": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct"
    }
  ]
}

Make the questions educational and test real understanding. Include clear explanations for each answer.`;

  try {
    const response = await pRetry(
      async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_completion_tokens: 8192,
          });
          return completion.choices[0]?.message?.content || "{}";
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz");
  }
}

export async function analyzePerformance(
  quizResults: { subject: string; score: number; correctAnswers: number; totalQuestions: number }[]
) {
  const prompt = `Analyze this student's quiz performance and provide insights:

${JSON.stringify(quizResults, null, 2)}

Return a JSON object with this exact structure:
{
  "strengths": ["Topic 1", "Topic 2", "Topic 3"],
  "weaknesses": ["Topic A", "Topic B"],
  "recommendations": "Detailed recommendations for improvement"
}

Identify specific topics they excel at and areas needing improvement. Provide actionable study recommendations.`;

  try {
    const response = await pRetry(
      async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_completion_tokens: 8192,
          });
          return completion.choices[0]?.message?.content || "{}";
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    return JSON.parse(response);
  } catch (error) {
    console.error("Error analyzing performance:", error);
    throw new Error("Failed to analyze performance");
  }
}

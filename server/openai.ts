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

export async function generateQuiz(subject: string, difficulty: string, questionCount: number, materialContext?: string, existingQuestions?: string[]) {
  const existingQuestionsContext = existingQuestions && existingQuestions.length > 0
    ? `\n\nIMPORTANT: These questions already exist. DO NOT generate similar or duplicate questions:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nGenerate completely NEW and DIFFERENT questions that cover different aspects of the topic.`
    : '';

  const prompt = `Generate ${questionCount} multiple choice questions for a quiz on "${subject}" at ${difficulty} difficulty level.
${materialContext ? `Use this context from study materials: ${materialContext}` : ''}${existingQuestionsContext}

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

IMPORTANT REQUIREMENTS:
1. Make each question unique and diverse - avoid similar wording or topics
2. Randomize the order of options for each question (don't always put correct answer first)
3. Ensure questions test different concepts and aspects of the subject
4. Make the questions educational and test real understanding
5. Include clear explanations for each answer
6. Each question should be distinct and cover different learning objectives`;

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

export async function generateExamFromMaterials(
  subjectName: string,
  materialType: "midterm" | "finals",
  examType: "pre_test" | "post_test",
  materials: { title: string; description?: string }[],
  existingQuestions?: string[]
) {
  const examTypeLabel = examType === "pre_test" ? "Pre-Test" : "Post-Test";
  const materialTypeLabel = materialType === "midterm" ? "Midterm" : "Finals";
  
  const questionCount = examType === "pre_test" ? 15 : 20;
  
  const materialsContext = materials.length > 0 
    ? `The exam should cover topics from these study materials:\n${materials.map((mat, idx) => {
        const descPart = mat.description ? `\n   Description: ${mat.description}` : '';
        return `${idx + 1}. ${mat.title}${descPart}`;
      }).join('\n')}`
    : '';

  const existingQuestionsContext = existingQuestions && existingQuestions.length > 0
    ? `\n\nCRITICAL: The following questions already exist for this subject and material type. You MUST generate completely DIFFERENT questions that do NOT overlap with these:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nGenerate NEW questions covering different aspects, concepts, and applications.`
    : '';

  const prompt = `Generate a comprehensive ${examTypeLabel} for "${subjectName}" (${materialTypeLabel} period) with ${questionCount} multiple choice questions.

${materialsContext}${existingQuestionsContext}

${examType === "pre_test" 
  ? "This is a PRE-TEST designed to assess students' baseline knowledge BEFORE studying the materials. Questions should cover fundamental concepts and prerequisite knowledge that students should have or will learn from the materials." 
  : "This is a POST-TEST designed to assess students' knowledge AFTER studying all the materials. Questions should be comprehensive, covering all major topics from the materials, and test deep understanding and application of concepts."}

Return a JSON object with this exact structure:
{
  "title": "${subjectName} - ${materialTypeLabel} ${examTypeLabel}",
  "questions": [
    {
      "questionText": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct and why other options are incorrect"
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Each question MUST be unique - no duplicate or similar questions
2. Randomize the position of the correct answer (don't always put it first or in the same position)
3. Cover diverse topics and different difficulty levels within the material
4. Each question should test a different concept or skill
5. Make the questions educational, varied in difficulty, and test real understanding
6. Include detailed explanations for each answer
7. Ensure variety in question types (recall, application, analysis, synthesis)`;

  try {
    const response = await pRetry(
      async () => {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_completion_tokens: 12000,
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
    console.error(`Error generating ${examType} exam:`, error);
    throw new Error(`Failed to generate ${examType} exam`);
  }
}

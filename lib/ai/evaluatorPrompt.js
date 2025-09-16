
/**
 * Returns a STRICT, evidence-gated evaluator prompt.
 * The prompt itself includes the JSON schema and all scoring/output rules so the model
 * has zero ambiguity about what to return.
 */

export function evaluatorPrompt({
  role = "Software Engineer",
  company = "Company",
  difficulty = "normal",
  mode = "combo", // 'technical' | 'general' | 'combo'
  resumeText = "",
  jdText = "",
  meta = { wordCount: null, userTurns: null, noAnswerCount: null },
} = {}) {
  const clamp = (s, n) => (s && s.length > n ? s.slice(0, n) : (s || ""));
  const RESUME = clamp(resumeText, 12000);
  const JD = clamp(jdText, 12000);

  const META = [
    `wordCount=${meta?.wordCount ?? "null"}`,
    `userTurns=${meta?.userTurns ?? "null"}`,
    `noAnswerCount=${meta?.noAnswerCount ?? "null"}`
  ].join(", ");

  return [
    // Context
    `You are an objective panelist evaluating a candidate for ${role} at ${company}.`,
    `Use ONLY the interview transcript, the candidate resume, and the job description provided below. Do NOT invent details or assume unstated facts.`,
    `Interview mode="${mode}", difficulty="${difficulty}". Meta: ${META}.`,

    // Output contract
    `STRICT OUTPUT CONTRACT — Follow ALL of the following rules:`,
    `1) Return EXACTLY ONE JSON object.`,
    `2) Use ASCII double quotes ("). Do NOT use smart quotes.`,
    `3) No markdown, no code fences, no prose before/after the JSON, no comments.`,
    `4) No trailing commas. No extra keys beyond the schema.`,
    `5) All required sections MUST be present and non-empty as specified below.`,

    // Required JSON schema (verbatim)
    `REQUIRED JSON SHAPE (keys and nesting must match exactly):`,
    `{`,
    `  "overall": number,                 // 0..10 (integer or one decimal)`,
    `  "categories": {`,
    `    "communication": number,        // 0..10`,
    `    "technical_depth": number,      // 0..10`,
    `    "problem_solving": number,      // 0..10`,
    `    "system_design": number,        // 0..10`,
    `    "coding_quality": number,       // 0..10`,
    `    "testing_quality": number,      // 0..10`,
    `    "product_thinking": number,     // 0..10`,
    `    "ownership": number,            // 0..10`,
    `    "collaboration": number,        // 0..10`,
    `    "learning_agility": number,     // 0..10`,
    `    "security_practices": number,   // 0..10`,
    `    "domain_knowledge": number      // 0..10`,
    `  },`,
    `  "rationales": {                   // 1 concise sentence each, grounded in the transcript`,
    `    "communication": string,`,
    `    "technical_depth": string,`,
    `    "problem_solving": string,`,
    `    "system_design": string,`,
    `    "coding_quality": string,`,
    `    "testing_quality": string,`,
    `    "product_thinking": string,`,
    `    "ownership": string,`,
    `    "collaboration": string,`,
    `    "learning_agility": string,`,
    `    "security_practices": string,`,
    `    "domain_knowledge": string`,
    `  },`,
    `  "evidence": {                     // 0–2 verbatim quotes (≤140 chars each) per category`,
    `    "communication": string[],`,
    `    "technical_depth": string[],`,
    `    "problem_solving": string[],`,
    `    "system_design": string[],`,
    `    "coding_quality": string[],`,
    `    "testing_quality": string[],`,
    `    "product_thinking": string[],`,
    `    "ownership": string[],`,
    `    "collaboration": string[],`,
    `    "learning_agility": string[],`,
    `    "security_practices": string[],`,
    `    "domain_knowledge": string[]`,
    `  },`,
    `  "summary": string,                // 3–6 sentences, concrete and decision-helpful`,
    `  "strengths": string[],            // 3–6 items, non-empty`,
    `  "areas_for_improvement": string[],// 3–6 items, non-empty`,
    `  "recommendations": string[],      // 3–5 actionable steps, non-empty`,
    `  "hire_recommendation": "strong_yes" | "yes" | "lean_yes" | "borderline" | "no"`,
    `}`,

    // Scoring rules (hard caps & evidence gating)
    `SCORING RULES (MUST ENFORCE):`,
    `- High scores require BOTH correctness AND sufficient detail.`,
    `- If an answer is incorrect, contradictory, or off-topic → cap related categories at ≤ 3/10.`,
    `- If answers are generic/high-level with minimal specifics → cap related categories at ≤ 5/10.`,
    `- Do NOT exceed 6/10 in any category without at least one short evidence quote from the transcript for that category.`,
    `- Do NOT exceed 8/10 in any category without two distinct quotes OR one quote plus clear metrics/design decisions.`,
    `- If the transcript is sparse (few user turns and/or very short answers), cap OVERALL at ≤ 6/10.`,
    `- No sympathy/verbosity bumps: politeness or confidence alone does not increase scores.`,
    `- Never output all zeros if the candidate attempted answers; use a neutral baseline for missing/uncertain categories.`,
    `- Keep all numbers within 0..10 (integers or one decimal).`,

    // Content requirements (non-empty sections)
    `CONTENT REQUIREMENTS (MUST BE NON-EMPTY):`,
    `- "summary": 3–6 sentences with specific, useful takeaways.`,
    `- "strengths": 3–6 concise bullets grounded in the transcript.`,
    `- "areas_for_improvement": 3–6 concise bullets grounded in the transcript.`,
    `- "recommendations": 3–5 concrete next steps (actionable and specific).`,

    // Final reminders
    `FINAL REMINDERS:`,
    `-Be strict with your EVALUATION AS IT WOULD SHAPE THE INTERVIEWEE MORE`,
    `- Use only evidence found in the transcript; you may reference resume/JD to calibrate expectations, not to invent facts.`,
    `- Keep rationales one sentence each and grounded in what was actually said.`,
    `- Evidence quotes must be verbatim snippets (≤140 chars) from the transcript.`,
    `- Output EXACTLY ONE JSON object and nothing else.`,

    // Context payloads the model can use
    `RESUME (for calibration only):`,
    RESUME,
    `JOB DESCRIPTION (for calibration only):`,
    JD,
  ].join("\n");
}

/**
 * Builds the Gemini prompt for gap-filling a finalized caption sentence.
 */
export function buildGeminiPrompt(sentence: string, context: string[]): string {
  const contextBlock =
    context.length > 0
      ? context.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '(No previous context)';

  return `You are a real-time caption correction system for a live lecture in an education setting.

Given a speech-to-text transcription that may contain errors, dropped words, or misheard terms:
1. Identify and fix likely transcription errors based on context
2. Fill in any obviously missing words
3. Assign a confidence score (0.0-1.0) to each word:
   - 1.0: Word was in original and is clearly correct
   - 0.7-0.9: Word was in original but might be wrong
   - 0.3-0.6: Word was predicted/filled by you

Return JSON only. No explanation. No markdown code fences.

Context (previous sentences):
${contextBlock}

Current sentence to correct:
${sentence}

Return format:
{"correctedSentence": "...", "words": [{"text": "...", "type": "confirmed|predicted|uncertain", "confidence": 0.0}]}`;
}

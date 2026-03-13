/**
 * Builds the Gemini prompt for gap-filling a finalized caption sentence.
 */
export function buildGeminiPrompt(sentence: string, context: string[], domain: string = 'education'): string {
  const contextBlock =
    context.length > 0
      ? context.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '(No previous context)';

  return `You are a real-time caption correction system for a live lecture in a ${domain} setting.

Speech-to-text systems frequently mishear words — especially proper nouns, technical terms, and short words. Your job is to critically evaluate EVERY word and correct errors.

Instructions:
1. Read the sentence and context carefully. Ask: does each word make grammatical and contextual sense?
2. Fix transcription errors — wrong words, dropped words, repeated words, misheard terms
3. Be skeptical. STT often produces nonsensical phrases. If a word seems out of place, it was probably misheard.
4. Add appropriate end punctuation to correctedSentence and to the final word in "words" when missing: use ? for questions, ! for exclamations (e.g. hey there!, wow), and . otherwise. STT usually returns no punctuation.
5. Assign EACH word a type and confidence:
   - type "confirmed", confidence 0.9-1.0: Word was in the original AND makes perfect sense in context
   - type "uncertain", confidence 0.7-0.89: Word was in the original but seems slightly off or unusual
   - type "predicted", confidence 0.3-0.6: Word was CHANGED or ADDED by you to fix an error

IMPORTANT: If you change a word from the original, it MUST be type "predicted" with confidence < 0.7.
IMPORTANT: If a word looks like a common STT error (wrong homophone, garbled word, repeated word), mark it "uncertain" even if you keep it.

Return JSON only. No explanation. No markdown code fences.

Context (previous sentences):
${contextBlock}

Current sentence to correct:
${sentence}

Return format:
{"correctedSentence": "... (with trailing ? or ! or .)", "words": [{"text": "...", "type": "confirmed|predicted|uncertain", "confidence": 0.0}]}
Include punctuation in the last word's "text" when it is ? or ! or . (e.g. "there!" or "you?").`;
}

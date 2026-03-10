import type { CaptionWord, GapFillerWordResult } from '@/types';
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from './constants';

/**
 * Classifies a word's type based on its confidence score and the type returned by Gemini.
 * type='predicted' → always 'predicted'
 * confidence >= HIGH → 'confirmed'
 * confidence >= MEDIUM → 'uncertain'
 * otherwise → 'predicted'
 */
function classifyWord(result: GapFillerWordResult): CaptionWord {
  let type: CaptionWord['type'];
  if (result.type === 'predicted') {
    type = 'predicted';
  } else if (result.confidence >= CONFIDENCE_HIGH) {
    type = 'confirmed';
  } else if (result.confidence >= CONFIDENCE_MEDIUM) {
    type = 'uncertain';
  } else {
    type = 'predicted';
  }
  return {
    text: result.text,
    type,
    confidence: Math.min(1, Math.max(0, result.confidence)),
    flagged: false,
  };
}

/**
 * Builds a fallback CaptionWord array from a plain sentence string.
 * All words are marked as 'confirmed' at full confidence.
 */
export function buildFallbackWords(sentence: string): CaptionWord[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, type: 'confirmed', confidence: 1.0, flagged: false }));
}

/**
 * Parses the raw JSON string returned by the Gemini API into CaptionWords.
 * Falls back to the original sentence on any error.
 */
export function parseGapFillerResponse(
  rawJson: string,
  originalSentence: string
): { correctedSentence: string; words: CaptionWord[] } {
  try {
    // Strip markdown code fences if present
    const cleaned = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.correctedSentence !== 'string' ||
      !Array.isArray(parsed.words) ||
      parsed.words.length === 0
    ) {
      return { correctedSentence: originalSentence, words: buildFallbackWords(originalSentence) };
    }

    const words: CaptionWord[] = parsed.words.map((w: GapFillerWordResult) => classifyWord(w));
    return { correctedSentence: parsed.correctedSentence, words };
  } catch {
    return { correctedSentence: originalSentence, words: buildFallbackWords(originalSentence) };
  }
}

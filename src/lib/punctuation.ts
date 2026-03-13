/**
 * Adds trailing punctuation when STT returns none.
 * Web Speech API typically returns plain text without ? or !
 */
// \b = word boundary so "how", "how are you", "hey", "hey there" all match
const QUESTION_STARTERS =
  /^(how|what|why|when|where|who|which|is|are|do|does|did|can|could|would|should|will|have|has|had|am|was|were|hasn't|haven't|isn't|aren't|don't|doesn't|didn't|can't|couldn't|wouldn't|won't)\b/i;
const EXCLAMATION_STARTERS = /^(hey|hi|wow|oh|whoa|yeah|yes|no|awesome|great|nice)\b/i;

export function addEndPunctuation(sentence: string): string {
  const trimmed = String(sentence).trim();
  if (!trimmed) return trimmed;

  const lower = trimmed.toLowerCase();
  const lastChar = trimmed.slice(-1);

  // Already has ? or !
  if (lastChar === '?' || lastChar === '!') return trimmed;

  // STT often returns "." — replace with ? or ! when it's a question or exclamation
  if (lastChar === '.') {
    if (QUESTION_STARTERS.test(lower)) return trimmed.slice(0, -1) + '?';
    if (EXCLAMATION_STARTERS.test(lower)) return trimmed.slice(0, -1) + '!';
    return trimmed;
  }

  // No end punctuation — add it
  if (QUESTION_STARTERS.test(lower)) return trimmed + '?';
  if (EXCLAMATION_STARTERS.test(lower)) return trimmed + '!';
  return trimmed + '.';
}

/**
 * Inserts spaces into concatenated speech text (e.g. "Hellohowareyou" → "Hello how are you")
 * when the API returns words run together. Uses a small dictionary and longest-match.
 */

// Common English words for segmenting run-together speech (e.g. "Hellohowareyou" → "Hello how are you").
const DICT = new Set([
  'about', 'after', 'again', 'also', 'always', 'another', 'because', 'before', 'being', 'between',
  'could', 'doing', 'during', 'every', 'first', 'going', 'great', 'hello', 'herself', 'himself',
  'however', 'inside', 'itself', 'know', 'later', 'little', 'maybe', 'might', 'money', 'more',
  'most', 'much', 'must', 'never', 'nothing', 'other', 'over', 'people', 'please', 'really',
  'right', 'something', 'sometimes', 'still', 'such', 'take', 'thank', 'thanks', 'that', 'their',
  'them', 'then', 'there', 'these', 'thing', 'think', 'this', 'those', 'through', 'today',
  'together', 'under', 'until', 'very', 'want', 'what', 'when', 'where', 'which', 'while',
  'would', 'your', 'yourself', 'and', 'are', 'but', 'for', 'get', 'got', 'had', 'has', 'have',
  'her', 'him', 'his', 'how', 'not', 'now', 'out', 'say', 'see', 'she', 'the', 'was', 'way',
  'who', 'why', 'yes', 'you', 'all', 'any', 'can', 'did', 'its', 'let', 'may', 'new', 'old',
  'our', 'too', 'two', 'use', 'no', 'so', 'up', 'we', 'is', 'it', 'to', 'of', 'in', 'on', 'at',
  'be', 'do', 'go', 'he', 'me', 'my', 'or', 'an', "what's", "that's", "it's", "let's", "here's",
  "there's", "whats", "thats", "lets", "heres", "theres",
]);

const DICT_WORDS = Array.from(DICT).filter((w) => w.length > 1).sort((a, b) => b.length - a.length);

function segmentChunk(chunk: string): string {
  const lower = chunk.toLowerCase();
  if (/^\s*$/.test(chunk)) return chunk;
  if (chunk.includes(' ')) return chunk; // already has spaces
  const out: string[] = [];
  let rest = lower;
  while (rest.length > 0) {
    let found = false;
    for (const word of DICT_WORDS) {
      if (word.length <= rest.length && rest.slice(0, word.length) === word) {
        out.push(rest.slice(0, word.length));
        rest = rest.slice(word.length);
        found = true;
        break;
      }
    }
    if (!found) {
      if (rest.length > 0) {
        out.push(rest);
        rest = '';
      }
      break;
    }
  }
  if (rest.length > 0) out.push(rest);
  return out.join(' ');
}

/**
 * Insert spaces into text that has words run together (e.g. from Web Speech API).
 * Preserves punctuation and existing spaces.
 */
export function segmentWords(text: string): string {
  const s = String(text).trim();
  if (!s) return s;
  // Split on punctuation (keep punctuation with previous segment)
  const segments: string[] = [];
  let current = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '.' || c === '!' || c === '?' || c === ',' || c === ';' || c === ':') {
      if (current.trim()) {
        segments.push(segmentChunk(current.trim()) + c);
        current = '';
      } else {
        segments.push(c);
      }
    } else {
      current += c;
    }
  }
  if (current.trim()) segments.push(segmentChunk(current.trim()));
  return segments.join(' ').replace(/\s+/g, ' ').trim();
}

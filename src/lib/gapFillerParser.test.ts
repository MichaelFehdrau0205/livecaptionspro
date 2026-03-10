import { describe, it, expect } from 'vitest';
import { parseGapFillerResponse, buildFallbackWords } from './gapFillerParser';

const validResponse = JSON.stringify({
  correctedSentence: 'The executive branch enforces them.',
  words: [
    { text: 'The', type: 'confirmed', confidence: 1.0 },
    { text: 'executive', type: 'predicted', confidence: 0.5 },
    { text: 'branch', type: 'confirmed', confidence: 0.95 },
    { text: 'enforces', type: 'confirmed', confidence: 0.88 },
    { text: 'them.', type: 'confirmed', confidence: 1.0 },
  ],
});

describe('parseGapFillerResponse', () => {
  it('parses valid Gemini response into CaptionWords', () => {
    const { correctedSentence, words } = parseGapFillerResponse(validResponse, 'original');
    expect(correctedSentence).toBe('The executive branch enforces them.');
    expect(words).toHaveLength(5);
    expect(words[1].type).toBe('predicted');
    expect(words[0].type).toBe('confirmed');
  });

  it('classifies high-confidence words as confirmed', () => {
    const { words } = parseGapFillerResponse(validResponse, 'original');
    expect(words[2].type).toBe('confirmed'); // confidence 0.95 >= 0.9
  });

  it('classifies medium-confidence words as uncertain', () => {
    const response = JSON.stringify({
      correctedSentence: 'hello world',
      words: [
        { text: 'hello', type: 'confirmed', confidence: 0.75 },
        { text: 'world', type: 'confirmed', confidence: 1.0 },
      ],
    });
    const { words } = parseGapFillerResponse(response, 'hello world');
    expect(words[0].type).toBe('uncertain');
  });

  it('returns original sentence when response is malformed JSON', () => {
    const { correctedSentence, words } = parseGapFillerResponse('not valid json', 'original text');
    expect(correctedSentence).toBe('original text');
    expect(words[0].text).toBe('original');
  });

  it('clamps confidence scores to 0-1 range', () => {
    const response = JSON.stringify({
      correctedSentence: 'test',
      words: [{ text: 'test', type: 'confirmed', confidence: 1.5 }],
    });
    const { words } = parseGapFillerResponse(response, 'test');
    expect(words[0].confidence).toBe(1);
  });

  it('handles empty words array by falling back to original', () => {
    const response = JSON.stringify({ correctedSentence: 'x', words: [] });
    const { correctedSentence } = parseGapFillerResponse(response, 'original');
    expect(correctedSentence).toBe('original');
  });

  it('strips markdown code fences', () => {
    const fenced = '```json\n' + validResponse + '\n```';
    const { correctedSentence } = parseGapFillerResponse(fenced, 'original');
    expect(correctedSentence).toBe('The executive branch enforces them.');
  });
});

describe('buildFallbackWords', () => {
  it('splits sentence into confirmed words', () => {
    const words = buildFallbackWords('hello world');
    expect(words).toHaveLength(2);
    expect(words[0]).toEqual({ text: 'hello', type: 'confirmed', confidence: 1.0, flagged: false });
  });

  it('filters out empty strings', () => {
    const words = buildFallbackWords('  hello   world  ');
    expect(words).toHaveLength(2);
  });
});

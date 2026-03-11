import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// ─── Mock GoogleGenerativeAI ──────────────────────────────────────────────────

const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({ generateContent: mockGenerateContent }));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(function () {
    return { getGenerativeModel: mockGetGenerativeModel };
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/gap-filler', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function geminiReturns(text: string) {
  mockGenerateContent.mockResolvedValueOnce({
    response: { text: () => text },
  });
}

const validGeminiResponse = JSON.stringify({
  correctedSentence: 'The executive branch enforces the laws.',
  words: [
    { text: 'The', type: 'confirmed', confidence: 1.0 },
    { text: 'executive', type: 'predicted', confidence: 0.6 },
    { text: 'branch', type: 'confirmed', confidence: 0.95 },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = 'test-key';
});

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/gap-filler', () => {
  describe('happy path', () => {
    it('returns corrected sentence from Gemini', async () => {
      geminiReturns(validGeminiResponse);
      const res = await POST(makeRequest({ sentence: 'The executive branch enforces laws.' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.correctedSentence).toBe('The executive branch enforces the laws.');
      expect(body.words).toHaveLength(3);
    });

    it('calls Gemini with the sentence and context', async () => {
      geminiReturns(validGeminiResponse);
      await POST(makeRequest({
        sentence: 'test sentence',
        context: ['prev sentence'],
        domain: 'education',
      }));

      expect(mockGenerateContent).toHaveBeenCalledOnce();
      const prompt = mockGenerateContent.mock.calls[0][0];
      expect(prompt).toContain('test sentence');
      expect(prompt).toContain('prev sentence');
    });

    it('passes domain to the Gemini prompt', async () => {
      geminiReturns(validGeminiResponse);
      await POST(makeRequest({ sentence: 'test', domain: 'education' }));

      const prompt = mockGenerateContent.mock.calls[0][0];
      expect(prompt).toContain('education');
    });

    it('returns words with flagged: false added', async () => {
      geminiReturns(validGeminiResponse);
      const res = await POST(makeRequest({ sentence: 'test' }));
      // route.ts returns parsed words — flagged is added by SessionContext
      const body = await res.json();
      expect(body.words[0]).toHaveProperty('text');
      expect(body.words[0]).toHaveProperty('confidence');
    });
  });

  describe('input validation', () => {
    it('returns 400 when sentence is missing', async () => {
      const res = await POST(makeRequest({ context: [] }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when sentence is not a string', async () => {
      const res = await POST(makeRequest({ sentence: 123 }));
      expect(res.status).toBe(400);
    });

    it('returns 400 on invalid JSON body', async () => {
      const req = new NextRequest('http://localhost/api/gap-filler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('fallback — no API key', () => {
    it('returns fallback when GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;
      const res = await POST(makeRequest({ sentence: 'hello world' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.correctedSentence).toBe('hello world');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('fallback words are all confirmed type', async () => {
      delete process.env.GEMINI_API_KEY;
      const res = await POST(makeRequest({ sentence: 'one two three' }));
      const body = await res.json();
      expect(body.words.every((w: { type: string }) => w.type === 'confirmed')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('returns fallback on Gemini timeout', async () => {
      mockGenerateContent.mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100))
      );

      vi.useFakeTimers();
      const resPromise = POST(makeRequest({ sentence: 'test timeout' }));
      vi.advanceTimersByTime(20000);
      vi.useRealTimers();

      const res = await resPromise;
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.correctedSentence).toBe('test timeout');
    });

    it('returns fallback with rateLimited=true on 429', async () => {
      const err = Object.assign(new Error('quota'), { status: 429 });
      mockGenerateContent.mockRejectedValueOnce(err);

      const res = await POST(makeRequest({ sentence: 'rate limited' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.correctedSentence).toBe('rate limited');
      expect(body.rateLimited).toBe(true);
    });

    it('returns fallback without rateLimited on quota message (only 429 sets rateLimited)', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Resource has been exhausted'));

      const res = await POST(makeRequest({ sentence: 'quota hit' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.correctedSentence).toBe('quota hit');
      expect(body.rateLimited).toBeUndefined();
    });

    it('retries once on malformed JSON and returns fallback if retry also fails', async () => {
      geminiReturns('not valid json {{');
      geminiReturns('still not valid {{');

      const res = await POST(makeRequest({ sentence: 'malformed test' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      // Falls back to original sentence after failed retry
      expect(body.correctedSentence).toBe('malformed test');
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('returns fallback on general Gemini error', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Unknown error'));

      const res = await POST(makeRequest({ sentence: 'error test' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.correctedSentence).toBe('error test');
      expect(body.rateLimited).toBeUndefined();
    });
  });
});

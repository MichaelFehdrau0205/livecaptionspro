import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildGeminiPrompt } from '@/lib/geminiPrompt';
import { parseGapFillerResponse, buildFallbackWords } from '@/lib/gapFillerParser';
import type { GapFillerRequest, GapFillerResponse } from '@/types';

const GEMINI_TIMEOUT_MS = 15000;

function fallbackResponse(sentence: string): GapFillerResponse {
  return {
    correctedSentence: sentence,
    words: buildFallbackWords(sentence),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: GapFillerRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sentence, context = [], domain = 'education' } = body;

  if (!sentence || typeof sentence !== 'string') {
    return NextResponse.json({ error: 'sentence is required' }, { status: 400 });
  }

  // Graceful no-key fallback (missing or placeholder = no Gemini, no "rate limited" message)
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_key_here') {
    return NextResponse.json(fallbackResponse(sentence));
  }

  const prompt = buildGeminiPrompt(sentence, context.slice(-5), domain);

  let rawText: string;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), GEMINI_TIMEOUT_MS)
    );

    const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
    rawText = result.response.text();
  } catch (err: unknown) {
    const error = err as Error & { status?: number; statusCode?: number };
    const msg = (error?.message ?? '').toLowerCase();
    // Only treat as rate limit when we're sure it's 429 (avoid false "AI enhancement paused" from other errors)
    const isRateLimit =
      error?.status === 429 ||
      error?.statusCode === 429 ||
      msg.includes('429');

    if (isRateLimit) {
      console.warn('[gap-filler] Rate limited by Gemini — pausing gap filler for 60s');
      return NextResponse.json({ ...fallbackResponse(sentence), rateLimited: true });
    }

    if (error?.message === 'timeout') {
      console.warn('[gap-filler] Gemini timeout after', GEMINI_TIMEOUT_MS, 'ms — using fallback');
    } else {
      console.error('[gap-filler] Gemini error:', error?.message, '| status:', error?.status);
    }
    return NextResponse.json(fallbackResponse(sentence));
  }

  // Retry once on invalid JSON
  let parsed = parseGapFillerResponse(rawText, sentence);
  if (parsed.correctedSentence === sentence && rawText.trim()) {
    console.warn('[gap-filler] Malformed JSON from Gemini — retrying once. Raw:', rawText.slice(0, 100));
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const retryResult = await model.generateContent(prompt);
      parsed = parseGapFillerResponse(retryResult.response.text(), sentence);
    } catch (retryErr: unknown) {
      const e = retryErr as Error;
      console.error('[gap-filler] Retry also failed:', e?.message, '— using fallback');
    }
  }

  return NextResponse.json(parsed satisfies GapFillerResponse);
}

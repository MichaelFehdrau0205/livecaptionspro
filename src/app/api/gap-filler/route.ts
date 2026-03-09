import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildGeminiPrompt } from '@/lib/geminiPrompt';
import { parseGapFillerResponse, buildFallbackWords } from '@/lib/gapFillerParser';
import type { GapFillerRequest, GapFillerResponse } from '@/types';

const GEMINI_TIMEOUT_MS = 5000;

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

  // Graceful no-key fallback
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallbackResponse(sentence));
  }

  const prompt = buildGeminiPrompt(sentence, context.slice(-5));

  let rawText: string;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), GEMINI_TIMEOUT_MS)
    );

    const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
    rawText = result.response.text();
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    if (error?.status === 429 || error?.message?.includes('quota')) {
      return NextResponse.json({ ...fallbackResponse(sentence), rateLimited: true });
    }
    // timeout or network error
    return NextResponse.json(fallbackResponse(sentence));
  }

  // Retry once on invalid JSON
  let parsed = parseGapFillerResponse(rawText, sentence);
  if (parsed.correctedSentence === sentence && rawText.trim()) {
    // Potentially malformed — one retry
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const retryResult = await model.generateContent(prompt);
      parsed = parseGapFillerResponse(retryResult.response.text(), sentence);
    } catch {
      // Give up — fallback already set
    }
  }

  return NextResponse.json(parsed satisfies GapFillerResponse);
}

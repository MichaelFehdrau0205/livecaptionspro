import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildTranscriptText, printTranscript, type TranscriptData } from './transcriptExport';
import type { CaptionLine } from '@/types';

function makeWord(text: string) {
  return { text, type: 'confirmed' as const, confidence: 1.0, flagged: false };
}

function makeLine(words: string[], createdAt?: number): CaptionLine {
  return {
    id: Math.random().toString(36).slice(2),
    words: words.map(makeWord),
    isFinalized: true,
    gapFillerApplied: false,
    createdAt,
  };
}

// Fixed session times for predictable output
const SESSION_START = new Date('2026-03-15T10:00:00.000Z').getTime();
const SESSION_END = SESSION_START + 45 * 60 * 1000 + 23 * 1000; // 45m 23s

describe('buildTranscriptText', () => {
  it('includes the app name header', () => {
    const data: TranscriptData = {
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    const result = buildTranscriptText(data);
    expect(result).toContain('LIVE CAPTIONS PRO');
  });

  it('includes a formatted date in the header', () => {
    const data: TranscriptData = {
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    const result = buildTranscriptText(data);
    // Should contain a date in "Month DD, YYYY" format
    expect(result).toMatch(/Date: \w+ \d+, \d{4}/);
  });

  it('includes formatted duration in the header', () => {
    const data: TranscriptData = {
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    const result = buildTranscriptText(data);
    expect(result).toContain('Duration: 00:45:23');
  });

  it('formats timestamps correctly as [HH:MM:SS]', () => {
    const createdAt = SESSION_START + 5 * 1000; // 5s into session
    const data: TranscriptData = {
      captions: [makeLine(['Hello', 'world.'], createdAt)],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    const result = buildTranscriptText(data);
    expect(result).toContain('[00:00:05]');
  });

  it('formats large offset timestamps correctly', () => {
    const createdAt = SESSION_START + (1 * 3600 + 23 * 60 + 45) * 1000; // 1h 23m 45s
    const data: TranscriptData = {
      captions: [makeLine(['Test.'], createdAt)],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    const result = buildTranscriptText(data);
    expect(result).toContain('[01:23:45]');
  });

  it('handles lines without createdAt — no timestamp prefix', () => {
    const data: TranscriptData = {
      captions: [makeLine(['Hello', 'world.'])], // no createdAt
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    const result = buildTranscriptText(data);
    expect(result).toContain('Hello world.');
    expect(result).not.toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
  });

  it('handles empty captions array — returns only header lines', () => {
    const data: TranscriptData = {
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    const result = buildTranscriptText(data);
    const lines = result.split('\n');
    // Header is: app name, date/duration line, blank line — 3 lines total, no caption lines
    expect(lines[0]).toBe('LIVE CAPTIONS PRO');
    expect(lines[1]).toMatch(/^Date:/);
    expect(lines[2]).toBe('');
    expect(lines).toHaveLength(3);
  });

  it('outputs multiple lines in order', () => {
    const data: TranscriptData = {
      captions: [
        makeLine(['First', 'line.'], SESSION_START + 1000),
        makeLine(['Second', 'line.'], SESSION_START + 5000),
        makeLine(['Third', 'line.'], SESSION_START + 10000),
      ],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    const result = buildTranscriptText(data);
    const firstIdx = result.indexOf('First line.');
    const secondIdx = result.indexOf('Second line.');
    const thirdIdx = result.indexOf('Third line.');
    expect(firstIdx).toBeLessThan(secondIdx);
    expect(secondIdx).toBeLessThan(thirdIdx);
  });

  it('skips lines with no words', () => {
    const emptyLine: CaptionLine = {
      id: 'empty',
      words: [],
      isFinalized: true,
      gapFillerApplied: false,
    };
    const data: TranscriptData = {
      captions: [emptyLine, makeLine(['Hello.'])],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    const result = buildTranscriptText(data);
    const captionLines = result.split('\n').slice(3); // skip header
    expect(captionLines).toHaveLength(1);
    expect(captionLines[0]).toContain('Hello.');
  });
});

describe('printTranscript', () => {
  let mockPrint: ReturnType<typeof vi.fn>;
  let mockWrite: ReturnType<typeof vi.fn>;
  let mockClose: ReturnType<typeof vi.fn>;
  let mockFocus: ReturnType<typeof vi.fn>;
  let mockWin: object;

  beforeEach(() => {
    mockPrint = vi.fn();
    mockWrite = vi.fn();
    mockClose = vi.fn();
    mockFocus = vi.fn();
    mockWin = {
      document: { write: mockWrite, close: mockClose },
      focus: mockFocus,
      print: mockPrint,
    };
    vi.stubGlobal('open', vi.fn().mockReturnValue(mockWin));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens a new blank window', () => {
    const data: TranscriptData = {
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    printTranscript(data);
    expect(window.open).toHaveBeenCalledWith('', '_blank');
  });

  it('calls print on the new window', () => {
    const data: TranscriptData = {
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    printTranscript(data);
    expect(mockPrint).toHaveBeenCalledTimes(1);
  });

  it('writes HTML including the app name', () => {
    const data: TranscriptData = {
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    printTranscript(data);
    const writtenHtml: string = (mockWrite as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(writtenHtml).toContain('LIVE CAPTIONS PRO');
  });

  it('does nothing if window.open returns null', () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    const data: TranscriptData = {
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
    };
    // Should not throw
    expect(() => printTranscript(data)).not.toThrow();
  });
});

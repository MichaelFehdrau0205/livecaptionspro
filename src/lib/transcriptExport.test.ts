import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildGroupPdfData,
  buildLecturePdfData,
  buildTranscriptText,
  extractUnclearSegments,
  groupTranscriptIntoParagraphs,
  printTranscript,
  shouldShowTimestamp,
  type TranscriptData,
} from './transcriptExport';
import type { CaptionLine } from '@/types';

function makeWord(text: string, overrides: Partial<CaptionLine['words'][number]> = {}) {
  return {
    text,
    type: 'confirmed' as const,
    confidence: 1.0,
    flagged: false,
    ...overrides,
  };
}

function makeLine(words: ReturnType<typeof makeWord>[], overrides: Partial<CaptionLine> = {}): CaptionLine {
  return {
    id: Math.random().toString(36).slice(2),
    words,
    isFinalized: true,
    gapFillerApplied: false,
    ...overrides,
  };
}

const SESSION_START = new Date('2026-03-15T10:00:00.000Z').getTime();
const SESSION_END = SESSION_START + 45 * 60 * 1000 + 23 * 1000;

describe('groupTranscriptIntoParagraphs', () => {
  it('merges nearby lecture lines into paragraph-style blocks', () => {
    const captions = [
      makeLine([makeWord('Hello'), makeWord('world.')], { createdAt: SESSION_START }),
      makeLine([makeWord('How'), makeWord('are'), makeWord('you?')], { createdAt: SESSION_START + 20_000 }),
    ];

    const blocks = groupTranscriptIntoParagraphs(captions, 'lecture');

    expect(blocks).toHaveLength(1);
    expect(blocks[0].text).toBe('Hello world. How are you?');
  });

  it('starts a new group block when the speaker changes', () => {
    const captions = [
      makeLine([makeWord('First'), makeWord('speaker.')], { speakerId: 1, createdAt: SESSION_START }),
      makeLine([makeWord('Second'), makeWord('speaker.')], { speakerId: 2, createdAt: SESSION_START + 20_000 }),
    ];

    const blocks = groupTranscriptIntoParagraphs(captions, 'group');

    expect(blocks).toHaveLength(2);
    expect(blocks[0].speakerId).toBe(1);
    expect(blocks[1].speakerId).toBe(2);
  });

  it('shows timestamps only occasionally when there is a long pause', () => {
    const captions = [
      makeLine([makeWord('Intro.')], { createdAt: SESSION_START }),
      makeLine([makeWord('Resume'), makeWord('later.')], { createdAt: SESSION_START + 120_000 }),
    ];

    const blocks = groupTranscriptIntoParagraphs(captions, 'lecture');

    expect(blocks[0].showTimestamp).toBe(true);
    expect(blocks[1].showTimestamp).toBe(true);
  });

  it('splits long lecture transcripts into multiple paragraph blocks', () => {
    const manyWords = Array.from({ length: 121 }, (_, index) => makeWord(`word${index}`));
    const captions = [
      makeLine(manyWords.slice(0, 60), { createdAt: SESSION_START }),
      makeLine(manyWords.slice(60), { createdAt: SESSION_START + 5_000 }),
      makeLine([makeWord('final-word')], { createdAt: SESSION_START + 10_000 }),
    ];

    const blocks = groupTranscriptIntoParagraphs(captions, 'lecture');

    expect(blocks.length).toBeGreaterThan(1);
    expect(blocks[0].text).toContain('word0');
    expect(blocks[1].text).toContain('final-word');
  });

  it('handles missing timestamps without adding timestamp chips', () => {
    const captions = [
      makeLine([makeWord('No'), makeWord('timestamp'), makeWord('here.')]),
      makeLine([makeWord('Still'), makeWord('renders'), makeWord('fine.')]),
    ];

    const blocks = groupTranscriptIntoParagraphs(captions, 'lecture');

    expect(blocks).toHaveLength(1);
    expect(blocks[0].showTimestamp).toBe(false);
    expect(blocks[0].startTime).toBeUndefined();
  });
});

describe('shouldShowTimestamp', () => {
  it('returns false when the next block has no start time', () => {
    expect(shouldShowTimestamp(undefined, {
      id: 'b',
      showTimestamp: false,
      segments: [],
      words: [],
      text: '',
    })).toBe(false);
  });

  it('returns true after a long pause between blocks', () => {
    const previous = {
      id: 'a',
      startTime: SESSION_START,
      endTime: SESSION_START + 10_000,
      showTimestamp: true,
      segments: [],
      words: [],
      text: 'Earlier block.',
    };
    const next = {
      id: 'b',
      startTime: SESSION_START + 200_000,
      endTime: SESSION_START + 205_000,
      showTimestamp: false,
      segments: [],
      words: [],
      text: 'Later block.',
    };

    expect(shouldShowTimestamp(previous, next)).toBe(true);
  });
});

describe('buildLecturePdfData', () => {
  it('builds lecture summary and transcript blocks from the existing captions', () => {
    const data: TranscriptData = {
      captions: [
        makeLine([makeWord('Today'), makeWord('we'), makeWord('study'), makeWord('photosynthesis.')], { createdAt: SESSION_START }),
        makeLine([makeWord('Chlorophyll'), makeWord('captures'), makeWord('light'), makeWord('energy.')], { createdAt: SESSION_START + 15_000 }),
      ],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
      mode: 'lecture',
    };

    const pdf = buildLecturePdfData(data);

    expect(pdf.title).toBe('Lecture Transcript');
    expect(pdf.summaryItems).toHaveLength(3);
    expect(pdf.transcriptBlocks[0].text).toContain('Today we study photosynthesis.');
  });

  it('uses fallback summary text when captions are empty', () => {
    const pdf = buildLecturePdfData({
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
      mode: 'lecture',
    });

    expect(pdf.summaryItems[0].value).toBe('Transcript captured for later review.');
    expect(pdf.summaryItems[2].value).toBe('No recurring terms detected.');
    expect(pdf.unclearItems).toEqual([]);
  });
});

describe('buildGroupPdfData', () => {
  it('collects participants and key moments for group mode', () => {
    const data: TranscriptData = {
      captions: [
        makeLine([makeWord('Should'), makeWord('we'), makeWord('ship'), makeWord('today?')], { speakerId: 1, createdAt: SESSION_START }),
        makeLine([makeWord('We'), makeWord('will'), makeWord('follow'), makeWord('up'), makeWord('tomorrow.')], { speakerId: 2, createdAt: SESSION_START + 10_000 }),
      ],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
      mode: 'group',
    };

    const pdf = buildGroupPdfData(data);

    expect(pdf.participants.map((participant) => participant.name)).toEqual(['Speaker 1', 'Speaker 2']);
    expect(pdf.keyMoments.map((item) => item.label)).toEqual(['Question', 'Action item']);
  });

  it('renders safely when speaker IDs are missing', () => {
    const pdf = buildGroupPdfData({
      captions: [
        makeLine([makeWord('General'), makeWord('discussion.')], { createdAt: SESSION_START }),
      ],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
      mode: 'group',
    });

    expect(pdf.participants).toEqual([]);
    expect(pdf.transcriptBlocks[0].speakerId).toBeUndefined();
  });
});

describe('extractUnclearSegments', () => {
  it('collects low-confidence and flagged snippets for review', () => {
    const blocks = groupTranscriptIntoParagraphs([
      makeLine([
        makeWord('The'),
        makeWord('enzyme', { type: 'uncertain', confidence: 0.72 }),
        makeWord('reacts.'),
      ], { createdAt: SESSION_START }),
      makeLine([
        makeWord('Flag'),
        makeWord('this', { flagged: true }),
        makeWord('part.'),
      ], { createdAt: SESSION_START + 5_000 }),
    ], 'lecture');

    const items = extractUnclearSegments(blocks, 'lecture');

    expect(items).toHaveLength(2);
    expect(items[0].text).toContain('enzyme');
    expect(items[1].text).toContain('this');
  });

  it('caps unclear review items to keep the section concise', () => {
    const captions = Array.from({ length: 10 }, (_, index) => (
      makeLine([
        makeWord(`Phrase${index}`),
        makeWord('unclear', { type: 'uncertain', confidence: 0.71 }),
        makeWord('here.'),
      ], { createdAt: SESSION_START + index * 1_000 })
    ));

    const blocks = groupTranscriptIntoParagraphs(captions, 'lecture');
    const items = extractUnclearSegments(blocks, 'lecture');

    expect(items).toHaveLength(8);
    expect(items[0].text).toContain('Phrase0');
  });
});

describe('buildTranscriptText', () => {
  it('keeps the plain-text export as a flowing paragraph with no per-line timestamps', () => {
    const data: TranscriptData = {
      captions: [
        makeLine([makeWord('Hello'), makeWord('world.')], { createdAt: SESSION_START }),
        makeLine([makeWord('How'), makeWord('are'), makeWord('you?')], { createdAt: SESSION_START + 5_000 }),
      ],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
      mode: 'lecture',
    };

    const result = buildTranscriptText(data);

    expect(result).toContain('LECTURE TRANSCRIPT');
    expect(result).toContain('Hello world. How are you?');
    expect(result).not.toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
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
    mockWin = { document: { write: mockWrite, close: mockClose }, focus: mockFocus, print: mockPrint };
    vi.stubGlobal('open', vi.fn().mockReturnValue(mockWin));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes lecture-mode HTML with summary and review sections', () => {
    printTranscript({
      captions: [
        makeLine([makeWord('Today'), makeWord('we'), makeWord('learn'), makeWord('biology.')], { createdAt: SESSION_START }),
        makeLine([makeWord('Mitochondria'), makeWord('create'), makeWord('energy.')], { createdAt: SESSION_START + 15_000 }),
      ],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
      mode: 'lecture',
    });

    const html: string = mockWrite.mock.calls[0][0];

    expect(html).toContain('Lecture Transcript');
    expect(html).toContain('Summary');
    expect(html).toContain('Unclear Or Low-Confidence');
    expect(html).toContain('Notes');
    expect(html).not.toContain('Page <span class="page-number"></span>');
    expect(html).not.toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
  });

  it('writes group-mode HTML with participants and speaker blocks', () => {
    printTranscript({
      captions: [
        makeLine([makeWord('Hello'), makeWord('team.')], { speakerId: 1, createdAt: SESSION_START }),
        makeLine([makeWord('We'), makeWord('should'), makeWord('start.')], { speakerId: 2, createdAt: SESSION_START + 5_000 }),
      ],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
      mode: 'group',
    });

    const html: string = mockWrite.mock.calls[0][0];

    expect(html).toContain('Conversation Transcript');
    expect(html).toContain('Participants');
    expect(html).toContain('Speaker 1');
    expect(html).toContain('speaker-block');
  });

  it('renders empty-state copy when summary or review data is unavailable', () => {
    printTranscript({
      captions: [],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
      mode: 'group',
    });

    const html: string = mockWrite.mock.calls[0][0];

    expect(html).toContain('Speaker diarization was not available for this conversation.');
    expect(html).toContain('No explicit decisions, questions, or action items were detected automatically.');
    expect(html).toContain('No low-confidence segments were flagged in this export.');
  });

  it('renders uncertainty highlight classes for non-confirmed words', () => {
    printTranscript({
      captions: [
        makeLine([
          makeWord('Maybe'),
          makeWord('enzyme', { type: 'predicted', confidence: 0.4 }),
          makeWord('works.'),
        ], { createdAt: SESSION_START }),
      ],
      sessionStartTime: SESSION_START,
      sessionEndTime: SESSION_END,
      mode: 'lecture',
    });

    const html: string = mockWrite.mock.calls[0][0];

    expect(html).toContain('uncertain-word');
    expect(html).toContain('predicted-word');
  });

  it('does nothing if window.open returns null', () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    expect(() => printTranscript({ captions: [], sessionStartTime: SESSION_START, sessionEndTime: SESSION_END })).not.toThrow();
  });
});

import { CONFIDENCE_MEDIUM, type DisplayMode } from '@/lib/constants';
import { getSpeakerProfile } from '@/lib/speakers';
import type { CaptionLine, CaptionWord } from '@/types';

const PARAGRAPH_WORD_TARGET = 110;
const LONG_PAUSE_MS = 90_000;
const TIMESTAMP_INTERVAL_MS = 3 * 60_000;
const MAX_KEY_POINTS = 4;
const MAX_TERMS = 6;
const MAX_UNCLEAR_ITEMS = 8;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from', 'had', 'has', 'have',
  'he', 'her', 'his', 'i', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'our', 'she', 'that', 'the',
  'their', 'them', 'there', 'they', 'this', 'to', 'was', 'we', 'were', 'will', 'with', 'you', 'your',
]);

interface TranscriptSegment {
  id: string;
  speakerId?: number;
  timestamp?: number;
  text: string;
  words: CaptionWord[];
  uncertainWordCount: number;
}

interface ParagraphBlock {
  id: string;
  speakerId?: number;
  startTime?: number;
  endTime?: number;
  showTimestamp: boolean;
  segments: TranscriptSegment[];
  words: CaptionWord[];
  text: string;
}

interface ReviewItem {
  label?: string;
  timestamp?: string;
  text: string;
}

interface CommonPdfData {
  title: string;
  subtitle: string;
  compactTitle: string;
  summaryTitle: string;
  summaryItems: Array<{ label: string; value: string | string[] }>;
  transcriptBlocks: ParagraphBlock[];
  unclearItems: ReviewItem[];
  notesLabel: string;
}

interface LecturePdfData extends CommonPdfData {
  kind: 'lecture';
}

interface GroupPdfData extends CommonPdfData {
  kind: 'group';
  participants: Array<{ id: number; name: string; color: string }>;
  keyMoments: Array<{ label: string; text: string; timestamp?: string }>;
}

export interface TranscriptData {
  captions: CaptionLine[];
  sessionStartTime: number;
  sessionEndTime: number;
  mode?: DisplayMode;
  title?: string;
  speakerName?: string;
  courseName?: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(startTime: number, endTime: number): string {
  const elapsed = Math.max(0, Math.floor((endTime - startTime) / 1000));
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sentenceCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

function cleanWordToken(text: string): string {
  return text.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '').toLowerCase();
}

function isUncertainWord(word: CaptionWord): boolean {
  return word.flagged || word.type !== 'confirmed' || word.confidence < CONFIDENCE_MEDIUM;
}

function wordsToText(words: CaptionWord[]): string {
  return words.map((word) => word.text).join(' ').replace(/\s+/g, ' ').trim();
}

function wordsToHtml(words: CaptionWord[]): string {
  return words.map((word) => {
    const content = escapeHtml(word.text);
    if (!isUncertainWord(word)) return content;

    const classes = ['uncertain-word'];
    if (word.flagged) classes.push('flagged-word');
    if (word.type === 'predicted') classes.push('predicted-word');

    const confidenceLabel = Math.round(word.confidence * 100);
    const annotation = word.flagged
      ? `Flagged for review, ${confidenceLabel}% confidence`
      : `${sentenceCase(word.type)} word, ${confidenceLabel}% confidence`;

    return `<span class="${classes.join(' ')}" aria-label="${escapeHtml(annotation)}">${content}</span>`;
  }).join(' ');
}

function normalizeSegments(captions: CaptionLine[]): TranscriptSegment[] {
  return captions
    .filter((line) => line.words.length > 0)
    .map((line) => ({
      id: line.id,
      speakerId: line.speakerId,
      timestamp: line.createdAt,
      text: wordsToText(line.words),
      words: line.words,
      uncertainWordCount: line.words.filter(isUncertainWord).length,
    }));
}

function shouldBreakParagraph(mode: DisplayMode, previous: TranscriptSegment, next: TranscriptSegment, wordCount: number): boolean {
  if (wordCount >= PARAGRAPH_WORD_TARGET) return true;
  if (mode === 'group' && previous.speakerId !== next.speakerId) return true;

  if (previous.timestamp != null && next.timestamp != null) {
    const gap = next.timestamp - previous.timestamp;
    if (gap >= LONG_PAUSE_MS) return true;
  }

  const previousText = previous.text;
  if (/[?!]$/.test(previousText) && wordCount >= PARAGRAPH_WORD_TARGET * 0.66) return true;
  if (/[:;]$/.test(previousText) && wordCount >= PARAGRAPH_WORD_TARGET * 0.8) return true;

  return false;
}

export function groupTranscriptIntoParagraphs(captions: CaptionLine[], mode: DisplayMode = 'lecture'): ParagraphBlock[] {
  const segments = normalizeSegments(captions);
  const blocks: ParagraphBlock[] = [];

  let current: TranscriptSegment[] = [];
  let lastTimestampShown: number | undefined;

  function flushCurrentBlock() {
    if (current.length === 0) return;

    const first = current[0];
    const last = current[current.length - 1];
    const startTime = first.timestamp;
    const endTime = last.timestamp;
    const showTimestamp = startTime != null && (
      blocks.length === 0 ||
      lastTimestampShown == null ||
      startTime - lastTimestampShown >= TIMESTAMP_INTERVAL_MS ||
      (blocks.length > 0 && blocks[blocks.length - 1].endTime != null && startTime - blocks[blocks.length - 1].endTime! >= LONG_PAUSE_MS)
    );

    if (showTimestamp && startTime != null) lastTimestampShown = startTime;

    const words = current.flatMap((segment) => segment.words);
    blocks.push({
      id: current.map((segment) => segment.id).join('-'),
      speakerId: mode === 'group' ? first.speakerId : undefined,
      startTime,
      endTime,
      showTimestamp,
      segments: current,
      words,
      text: wordsToText(words),
    });

    current = [];
  }

  segments.forEach((segment, index) => {
    if (current.length === 0) {
      current = [segment];
      return;
    }

    const previous = current[current.length - 1];
    const wordCount = current.reduce((sum, item) => sum + item.words.length, 0);
    if (shouldBreakParagraph(mode, previous, segment, wordCount)) {
      flushCurrentBlock();
      current = [segment];
      return;
    }

    current.push(segment);

    if (index === segments.length - 1) {
      flushCurrentBlock();
    }
  });

  flushCurrentBlock();
  return blocks;
}

export function shouldShowTimestamp(previousBlock: ParagraphBlock | undefined, nextBlock: ParagraphBlock): boolean {
  if (!nextBlock.startTime) return false;
  if (!previousBlock?.endTime) return true;
  if (nextBlock.startTime - previousBlock.endTime >= LONG_PAUSE_MS) return true;
  if (!previousBlock.showTimestamp) return nextBlock.startTime - (previousBlock.startTime ?? previousBlock.endTime) >= TIMESTAMP_INTERVAL_MS;
  return nextBlock.startTime - (previousBlock.startTime ?? previousBlock.endTime) >= TIMESTAMP_INTERVAL_MS;
}

function extractTerms(captions: CaptionLine[]): string[] {
  const counts = new Map<string, number>();

  captions.forEach((line) => {
    line.words.forEach((word) => {
      const token = cleanWordToken(word.text);
      if (token.length < 4 || STOP_WORDS.has(token)) return;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_TERMS)
    .map(([term]) => sentenceCase(term));
}

function extractSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function deriveMainTopic(blocks: ParagraphBlock[], fallback: string): string {
  const firstSentence = blocks.flatMap((block) => extractSentences(block.text))[0];
  return firstSentence ?? fallback;
}

function deriveLectureKeyPoints(blocks: ParagraphBlock[]): string[] {
  return blocks
    .flatMap((block) => extractSentences(block.text))
    .filter((sentence) => sentence.split(/\s+/).length >= 5)
    .slice(0, MAX_KEY_POINTS);
}

function maybeTimestamp(block: ParagraphBlock): string | undefined {
  if (!block.showTimestamp || !block.startTime) return undefined;
  return formatTime(block.startTime);
}

function extractContextSnippet(words: CaptionWord[], targetIndex: number): string {
  const start = Math.max(0, targetIndex - 3);
  const end = Math.min(words.length, targetIndex + 4);
  return wordsToText(words.slice(start, end));
}

export function extractUnclearSegments(blocks: ParagraphBlock[], mode: DisplayMode = 'lecture'): ReviewItem[] {
  const items: ReviewItem[] = [];

  blocks.forEach((block) => {
    block.words.forEach((word, index) => {
      if (!isUncertainWord(word)) return;

      const label = mode === 'group' && block.speakerId != null
        ? getSpeakerProfile(block.speakerId).name
        : undefined;

      items.push({
        label,
        timestamp: block.startTime ? formatTime(block.startTime) : undefined,
        text: extractContextSnippet(block.words, index),
      });
    });
  });

  const deduped = new Map<string, ReviewItem>();
  items.forEach((item) => {
    const key = `${item.label ?? ''}|${item.timestamp ?? ''}|${item.text}`;
    if (!deduped.has(key)) deduped.set(key, item);
  });

  return [...deduped.values()].slice(0, MAX_UNCLEAR_ITEMS);
}

function buildHeaderSubtitle(data: TranscriptData): string {
  const pieces = [
    formatDate(data.sessionStartTime),
    `Duration ${formatDuration(data.sessionStartTime, data.sessionEndTime)}`,
  ];

  if (data.courseName) pieces.push(data.courseName);
  if (data.speakerName) pieces.push(data.speakerName);

  return pieces.join('  •  ');
}

export function buildLecturePdfData(data: TranscriptData): LecturePdfData {
  const transcriptBlocks = groupTranscriptIntoParagraphs(data.captions, 'lecture');
  const importantTerms = extractTerms(data.captions);
  const title = data.title || data.courseName || 'Lecture Transcript';

  return {
    kind: 'lecture',
    title,
    compactTitle: title,
    subtitle: buildHeaderSubtitle(data),
    summaryTitle: 'Summary',
    summaryItems: [
      {
        label: 'Main topic',
        value: deriveMainTopic(transcriptBlocks, 'Transcript captured for later review.'),
      },
      {
        label: 'Key points',
        value: deriveLectureKeyPoints(transcriptBlocks),
      },
      {
        label: 'Important terms',
        value: importantTerms.length > 0 ? importantTerms : 'No recurring terms detected.',
      },
    ],
    transcriptBlocks,
    unclearItems: extractUnclearSegments(transcriptBlocks, 'lecture'),
    notesLabel: 'Notes',
  };
}

function extractParticipants(blocks: ParagraphBlock[]): Array<{ id: number; name: string; color: string }> {
  const ids = [...new Set(blocks.map((block) => block.speakerId).filter((id): id is number => id != null))];
  return ids.map((id) => {
    const speaker = getSpeakerProfile(id);
    return { id, name: speaker.name, color: speaker.bgColor };
  });
}

function classifyGroupMoment(block: ParagraphBlock): { label: string; text: string; timestamp?: string } | null {
  const text = block.text.trim();
  const lower = text.toLowerCase();
  const timestamp = maybeTimestamp(block);

  if (!text) return null;
  if (text.endsWith('?')) return { label: 'Question', text, timestamp };
  if (/\b(action item|follow up|next step|will |going to|need to)\b/.test(lower)) return { label: 'Action item', text, timestamp };
  if (/\b(decide|decision|agreed|approve|approved)\b/.test(lower)) return { label: 'Decision', text, timestamp };
  if (/\b(important|note that|remember|blocked|issue)\b/.test(lower)) return { label: 'Important moment', text, timestamp };
  return null;
}

function deriveGroupMoments(blocks: ParagraphBlock[]): Array<{ label: string; text: string; timestamp?: string }> {
  return blocks
    .map(classifyGroupMoment)
    .filter((item): item is { label: string; text: string; timestamp?: string } => item != null)
    .slice(0, MAX_KEY_POINTS);
}

export function buildGroupPdfData(data: TranscriptData): GroupPdfData {
  const transcriptBlocks = groupTranscriptIntoParagraphs(data.captions, 'group');
  const title = data.title || 'Conversation Transcript';

  return {
    kind: 'group',
    title,
    compactTitle: title,
    subtitle: buildHeaderSubtitle(data),
    summaryTitle: 'Key moments',
    summaryItems: [],
    participants: extractParticipants(transcriptBlocks),
    keyMoments: deriveGroupMoments(transcriptBlocks),
    transcriptBlocks,
    unclearItems: extractUnclearSegments(transcriptBlocks, 'group'),
    notesLabel: 'Notes',
  };
}

function renderSummaryItems(items: Array<{ label: string; value: string | string[] }>): string {
  return items.map((item) => {
    const values = Array.isArray(item.value) ? item.value : [item.value];
    const filtered = values.map((value) => value.trim()).filter(Boolean);
    const content = filtered.length > 0
      ? `<ul class="summary-list">${filtered.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`
      : `<p class="muted">No summary data available.</p>`;

    return `<article class="summary-card">
      <h3>${escapeHtml(item.label)}</h3>
      ${content}
    </article>`;
  }).join('');
}

function renderLectureTranscript(blocks: ParagraphBlock[]): string {
  return blocks.map((block) => {
    const timestamp = maybeTimestamp(block);
    return `<article class="transcript-block">
      ${timestamp ? `<div class="timestamp-chip">${escapeHtml(timestamp)}</div>` : ''}
      <p>${wordsToHtml(block.words)}</p>
    </article>`;
  }).join('');
}

function renderGroupTranscript(blocks: ParagraphBlock[]): string {
  return blocks.map((block) => {
    const speaker = getSpeakerProfile(block.speakerId ?? 1);
    const timestamp = maybeTimestamp(block);
    return `<article class="speaker-block" style="--speaker-accent: ${speaker.bgColor};">
      <div class="speaker-meta">
        <div class="speaker-badge">
          <span class="speaker-dot" aria-hidden="true"></span>
          <span>${escapeHtml(speaker.name)}</span>
        </div>
        ${timestamp ? `<div class="timestamp-chip">${escapeHtml(timestamp)}</div>` : ''}
      </div>
      <p>${wordsToHtml(block.words)}</p>
    </article>`;
  }).join('');
}

function renderUnclearSection(items: ReviewItem[]): string {
  if (items.length === 0) {
    return `<p class="muted">No low-confidence segments were flagged in this export.</p>`;
  }

  return `<ul class="review-list">
    ${items.map((item) => {
      const meta = [item.label, item.timestamp].filter(Boolean).join('  •  ');
      return `<li>
        ${meta ? `<div class="review-meta">${escapeHtml(meta)}</div>` : ''}
        <div>${escapeHtml(item.text)}</div>
      </li>`;
    }).join('')}
  </ul>`;
}

function renderNotesSection(): string {
  return `<div class="notes-lines" aria-hidden="true">
    ${Array.from({ length: 7 }, () => '<div class="note-line"></div>').join('')}
  </div>`;
}

function buildLectureHtml(data: LecturePdfData): string {
  return `
    <section class="section">
      <div class="section-heading">
        <h2>${escapeHtml(data.summaryTitle)}</h2>
      </div>
      <div class="summary-grid">${renderSummaryItems(data.summaryItems)}</div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>Transcript</h2>
      </div>
      <div class="transcript-flow">${renderLectureTranscript(data.transcriptBlocks)}</div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>Unclear Or Low-Confidence</h2>
      </div>
      ${renderUnclearSection(data.unclearItems)}
    </section>

    <section class="section notes-section">
      <div class="section-heading">
        <h2>${escapeHtml(data.notesLabel)}</h2>
      </div>
      ${renderNotesSection()}
    </section>
  `;
}

function renderParticipants(participants: GroupPdfData['participants']): string {
  if (participants.length === 0) {
    return `<p class="muted">Speaker diarization was not available for this conversation.</p>`;
  }

  return `<div class="participants-grid">
    ${participants.map((participant) => `<div class="participant-pill" style="--speaker-accent: ${participant.color};">
      <span class="speaker-dot" aria-hidden="true"></span>
      <span>${escapeHtml(participant.name)}</span>
    </div>`).join('')}
  </div>`;
}

function renderKeyMoments(items: GroupPdfData['keyMoments']): string {
  if (items.length === 0) {
    return `<p class="muted">No explicit decisions, questions, or action items were detected automatically.</p>`;
  }

  return `<ul class="review-list">
    ${items.map((item) => `<li>
      <div class="review-meta">${escapeHtml([item.label, item.timestamp].filter(Boolean).join('  •  '))}</div>
      <div>${escapeHtml(item.text)}</div>
    </li>`).join('')}
  </ul>`;
}

function buildGroupHtml(data: GroupPdfData): string {
  return `
    <section class="section">
      <div class="section-heading">
        <h2>Participants</h2>
      </div>
      ${renderParticipants(data.participants)}
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>Key moments</h2>
      </div>
      ${renderKeyMoments(data.keyMoments)}
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>Transcript</h2>
      </div>
      <div class="transcript-flow">${renderGroupTranscript(data.transcriptBlocks)}</div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>Unclear Or Low-Confidence</h2>
      </div>
      ${renderUnclearSection(data.unclearItems)}
    </section>

    <section class="section notes-section">
      <div class="section-heading">
        <h2>${escapeHtml(data.notesLabel)}</h2>
      </div>
      ${renderNotesSection()}
    </section>
  `;
}

function buildPrintStyles(): string {
  return `
    :root {
      color-scheme: light;
      --ink: #18212f;
      --muted: #5b6575;
      --line: #d7deea;
      --surface: #f4f7fb;
      --surface-strong: #edf2f7;
      --uncertain-bg: #fff2cc;
      --predicted-bg: #dbeafe;
      --flagged-border: #c2410c;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: var(--ink);
      font-family: "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
      line-height: 1.65;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      padding: 32px 44px 72px;
      font-size: 12pt;
    }

    .document-header {
      border-bottom: 1px solid var(--line);
      padding-bottom: 18px;
      margin-bottom: 28px;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: var(--muted);
      font-size: 10pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 24pt;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .subtitle {
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 10.5pt;
    }

    .section {
      margin: 0 0 28px;
      break-inside: auto;
    }

    .section-heading {
      break-after: avoid;
      margin-bottom: 14px;
      padding-top: 4px;
      border-top: 1px solid var(--surface-strong);
    }

    h2 {
      margin: 12px 0 0;
      font-size: 14pt;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }

    .summary-grid,
    .participants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .summary-card,
    .participant-pill,
    .speaker-block {
      break-inside: avoid;
    }

    .summary-card {
      border: 1px solid var(--line);
      background: var(--surface);
      border-radius: 14px;
      padding: 14px 16px;
    }

    .summary-card h3 {
      margin: 0 0 10px;
      font-size: 11pt;
      line-height: 1.3;
    }

    .summary-list,
    .review-list {
      margin: 0;
      padding-left: 18px;
    }

    .summary-list li,
    .review-list li {
      margin: 0 0 7px;
    }

    .muted,
    .review-meta {
      color: var(--muted);
      font-size: 10pt;
    }

    .transcript-flow {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .transcript-block,
    .speaker-block {
      border: 1px solid transparent;
      border-radius: 14px;
      padding: 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .transcript-block p,
    .speaker-block p {
      margin: 0;
      font-size: 12pt;
      line-height: 1.8;
      text-wrap: pretty;
      orphans: 3;
      widows: 3;
    }

    .speaker-block {
      border-color: color-mix(in srgb, var(--speaker-accent) 22%, white);
      background: color-mix(in srgb, var(--speaker-accent) 8%, white);
      padding: 12px 14px;
    }

    .speaker-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .speaker-badge,
    .participant-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 8px 12px;
      background: color-mix(in srgb, var(--speaker-accent) 14%, white);
      border: 1px solid color-mix(in srgb, var(--speaker-accent) 26%, white);
      font-size: 10.5pt;
      font-weight: 600;
    }

    .speaker-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--speaker-accent);
      display: inline-block;
      flex: 0 0 auto;
    }

    .timestamp-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 9px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--line);
      color: var(--muted);
      font-size: 9.5pt;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .uncertain-word {
      background: var(--uncertain-bg);
      border-radius: 4px;
      padding: 0 2px;
    }

    .predicted-word {
      background: var(--predicted-bg);
    }

    .flagged-word {
      border-bottom: 2px solid var(--flagged-border);
    }

    .notes-lines {
      margin-top: 10px;
    }

    .note-line {
      border-bottom: 1px solid var(--line);
      height: 28px;
    }

    @page {
      size: auto;
      margin: 18mm 16mm 18mm;
    }

    @media print {
      body {
        padding: 0;
      }

      .section-heading,
      .summary-card,
      .participant-pill,
      .speaker-block,
      .transcript-block,
      .review-list li {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .notes-section {
        break-before: auto;
      }
    }
  `;
}

function buildDocument(title: string, subtitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${buildPrintStyles()}</style>
</head>
<body>
  <header class="document-header">
    <p class="eyebrow">Live Captions Pro</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
  </header>

  <main>
    ${body}
  </main>
</body>
</html>`;
}

function buildTranscriptParagraph(blocks: ParagraphBlock[]): string {
  return blocks.map((block) => block.text).join(' ').trim();
}

export function buildTranscriptText(data: TranscriptData): string {
  const mode = data.mode ?? 'lecture';
  const title = mode === 'group'
    ? data.title || 'Conversation Transcript'
    : data.title || data.courseName || 'Lecture Transcript';
  const blocks = groupTranscriptIntoParagraphs(data.captions, mode);

  return [
    title.toUpperCase(),
    `Date: ${formatDate(data.sessionStartTime)}  |  Duration: ${formatDuration(data.sessionStartTime, data.sessionEndTime)}`,
    '',
    buildTranscriptParagraph(blocks),
  ].join('\n');
}

function createPrintHtml(data: TranscriptData): string {
  const mode = data.mode ?? 'lecture';

  if (mode === 'group') {
    const pdfData = buildGroupPdfData(data);
    return buildDocument(
      pdfData.title,
      pdfData.subtitle,
      buildGroupHtml(pdfData),
    );
  }

  const pdfData = buildLecturePdfData(data);
  return buildDocument(
    pdfData.title,
    pdfData.subtitle,
    buildLectureHtml(pdfData),
  );
}

export function printTranscript(data: TranscriptData): void {
  const html = createPrintHtml(data);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

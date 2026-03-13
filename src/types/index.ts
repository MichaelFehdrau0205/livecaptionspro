export type SessionStatus = 'idle' | 'listening' | 'paused' | 'reconnecting' | 'ended';

export type WordType = 'confirmed' | 'predicted' | 'uncertain';

export interface CaptionWord {
  text: string;
  type: WordType;
  confidence: number; // 0.0 – 1.0
  flagged: boolean;
}

export interface CaptionLine {
  id: string;
  words: CaptionWord[];
  isFinalized: boolean;
  gapFillerApplied: boolean;
}

export interface SessionStats {
  wordCount: number;
  aiCorrections: number;
}

export type FeedbackGiven = 'yes' | 'no' | null;

export interface SessionState {
  status: SessionStatus;
  captions: CaptionLine[];
  currentInterim: string;
  sessionStartTime: number | null;
  /** Set when session ends so duration stops (frozen at end time). */
  sessionEndTime: number | null;
  stats: SessionStats;
  feedbackGiven: FeedbackGiven;
}

// Gap Filler API types
export interface GapFillerRequest {
  sentence: string;
  context: string[];
  domain?: string;
}

export interface GapFillerWordResult {
  text: string;
  type: WordType;
  confidence: number;
}

export interface GapFillerResponse {
  correctedSentence: string;
  words: GapFillerWordResult[];
  rateLimited?: boolean;
}

// FIFO stage (Week 2 multi-speaker display)
export interface FifoWord {
  text: string;
}

export interface FifoLine {
  id: string;
  speakerId: number;
  words: FifoWord[];
  interim: string;
  done: boolean;
}

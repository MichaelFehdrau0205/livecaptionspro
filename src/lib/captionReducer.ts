import { v4 as uuidv4 } from 'uuid';
import type { SessionState, CaptionLine, CaptionWord, SessionStatus, FeedbackGiven } from '@/types';

export type SessionAction =
  | { type: 'START_SESSION' }
  | { type: 'ADD_INTERIM'; payload: string }
  | { type: 'FINALIZE_LINE'; payload: string }
  | { type: 'APPLY_GAP_FILLER'; payload: { lineId: string; words: CaptionWord[] } }
  | { type: 'FLAG_WORD'; payload: { lineId: string; wordIndex: number } }
  | { type: 'END_SESSION' }
  | { type: 'SET_STATUS'; payload: SessionStatus }
  | { type: 'GIVE_FEEDBACK'; payload: FeedbackGiven };

export const initialState: SessionState = {
  status: 'idle',
  captions: [],
  currentInterim: '',
  sessionStartTime: null,
  stats: { wordCount: 0, aiCorrections: 0 },
  feedbackGiven: null,
};

function sentenceToWords(sentence: string): CaptionWord[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, type: 'confirmed', confidence: 1.0, flagged: false }));
}

export function captionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...initialState,
        status: 'listening',
        sessionStartTime: Date.now(),
        feedbackGiven: null,
      };

    case 'ADD_INTERIM':
      return { ...state, currentInterim: action.payload };

    case 'FINALIZE_LINE': {
      const text = action.payload.trim();
      if (!text) return { ...state, currentInterim: '' };
      const words = sentenceToWords(text);
      const newLine: CaptionLine = {
        id: uuidv4(),
        words,
        isFinalized: true,
        gapFillerApplied: false,
      };
      return {
        ...state,
        captions: [...state.captions, newLine],
        currentInterim: '',
        stats: {
          ...state.stats,
          wordCount: state.stats.wordCount + words.length,
        },
      };
    }

    case 'APPLY_GAP_FILLER': {
      const { lineId, words: newWords } = action.payload;
      let corrections = 0;
      const updatedCaptions = state.captions.map((line) => {
        if (line.id !== lineId) return line;
        // Count words that changed or were predicted
        corrections = newWords.filter(
          (w, i) => w.type !== 'confirmed' || (line.words[i] && w.text !== line.words[i].text)
        ).length;
        return { ...line, words: newWords, gapFillerApplied: true };
      });
      return {
        ...state,
        captions: updatedCaptions,
        stats: {
          ...state.stats,
          aiCorrections: state.stats.aiCorrections + corrections,
        },
      };
    }

    case 'FLAG_WORD': {
      const { lineId, wordIndex } = action.payload;
      const updatedCaptions = state.captions.map((line) => {
        if (line.id !== lineId) return line;
        const updatedWords = line.words.map((word, i) =>
          i === wordIndex ? { ...word, flagged: !word.flagged } : word
        );
        return { ...line, words: updatedWords };
      });
      return { ...state, captions: updatedCaptions };
    }

    case 'END_SESSION':
      return { ...state, status: 'ended', currentInterim: '' };

    case 'GIVE_FEEDBACK':
      return { ...state, feedbackGiven: action.payload };

    case 'SET_STATUS':
      return { ...state, status: action.payload };

    default:
      return state;
  }
}

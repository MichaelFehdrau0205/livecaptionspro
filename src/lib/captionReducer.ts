import { v4 as uuidv4 } from 'uuid';
import { addEndPunctuation } from '@/lib/punctuation';
import type { SessionState, CaptionLine, CaptionWord, SessionStatus, FeedbackGiven } from '@/types';

export type SessionAction =
  | { type: 'START_SESSION' }
  | { type: 'ADD_INTERIM'; payload: string }
  | { type: 'FINALIZE_LINE'; payload: string }
  | { type: 'FINALIZE_LINE_WITH_WORDS'; payload: { words: CaptionWord[] } }
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
  sessionEndTime: null,
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
        sessionEndTime: null,
        feedbackGiven: null,
      };

    case 'ADD_INTERIM': {
      const raw = String(action.payload ?? '').trim();
      return { ...state, currentInterim: raw ? addEndPunctuation(raw) : '' };
    }

    case 'FINALIZE_LINE': {
      const raw = String(action.payload ?? '').trim();
      if (!raw) return { ...state, currentInterim: '' };
      const text = addEndPunctuation(raw);
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

    case 'FINALIZE_LINE_WITH_WORDS': {
      const { words } = action.payload;
      if (!words.length) return { ...state, currentInterim: '' };
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
      // Re-apply end punctuation when Gemini returns words without it (? ! or .)
      const sentence = newWords.map((w) => w.text).join(' ');
      const withPunct = addEndPunctuation(sentence);
      let wordsToApply = newWords;
      if (withPunct.length > sentence.length) {
        const added = withPunct.slice(-1);
        const last = newWords[newWords.length - 1];
        wordsToApply = [...newWords.slice(0, -1), { ...last, text: last.text + added }];
      }
      let corrections = 0;
      const updatedCaptions = state.captions.map((line) => {
        if (line.id !== lineId) return line;
        corrections = wordsToApply.filter(
          (w, i) => w.type !== 'confirmed' || (line.words[i] && w.text !== line.words[i].text)
        ).length;
        return { ...line, words: wordsToApply, gapFillerApplied: true };
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
      return { ...state, status: 'ended', currentInterim: '', sessionEndTime: Date.now() };

    case 'GIVE_FEEDBACK':
      return { ...state, feedbackGiven: action.payload };

    case 'SET_STATUS':
      return { ...state, status: action.payload };

    default:
      return state;
  }
}

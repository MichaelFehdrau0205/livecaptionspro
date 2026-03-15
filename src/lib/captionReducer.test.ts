import { describe, it, expect } from 'vitest';
import { captionReducer, initialState, type SessionAction } from './captionReducer';

function dispatch(state = initialState, action: SessionAction) {
  return captionReducer(state, action);
}

describe('captionReducer', () => {
  it('starts a session correctly', () => {
    const state = dispatch(initialState, { type: 'START_SESSION' });
    expect(state.status).toBe('listening');
    expect(state.sessionStartTime).not.toBeNull();
    expect(state.captions).toHaveLength(0);
  });

  it('adds interim text with end punctuation (so iPhone shows ? ! . even when finals are rare)', () => {
    const state = dispatch(initialState, { type: 'ADD_INTERIM', payload: 'hello world' });
    expect(state.currentInterim).toBe('hello world.');
  });

  it('finalizes a line when STT returns final result', () => {
    const state = dispatch(initialState, { type: 'FINALIZE_LINE', payload: 'Hello world' });
    expect(state.captions).toHaveLength(1);
    expect(state.captions[0].isFinalized).toBe(true);
    expect(state.captions[0].words).toHaveLength(2);
    expect(state.captions[0].words[0].text).toBe('Hello');
    expect(state.currentInterim).toBe('');
  });

  it('increments wordCount when a line is finalized', () => {
    const state = dispatch(initialState, { type: 'FINALIZE_LINE', payload: 'one two three' });
    expect(state.stats.wordCount).toBe(3);
  });

  it('ignores empty finalized lines', () => {
    const state = dispatch(initialState, { type: 'FINALIZE_LINE', payload: '   ' });
    expect(state.captions).toHaveLength(0);
  });

  it('replaces finalized line with gap-filler corrections', () => {
    const afterFinalize = dispatch(initialState, { type: 'FINALIZE_LINE', payload: 'hello world' });
    const lineId = afterFinalize.captions[0].id;
    const correctedWords = [
      { text: 'hello', type: 'confirmed' as const, confidence: 1.0, flagged: false },
      { text: 'wonderful', type: 'predicted' as const, confidence: 0.5, flagged: false },
    ];
    const afterGapFill = dispatch(afterFinalize, {
      type: 'APPLY_GAP_FILLER',
      payload: { lineId, words: correctedWords },
    });
    expect(afterGapFill.captions[0].words[1].text).toBe('wonderful.');
    expect(afterGapFill.captions[0].gapFillerApplied).toBe(true);
  });

  it('increments aiCorrections count when gap filler changes words', () => {
    const afterFinalize = dispatch(initialState, { type: 'FINALIZE_LINE', payload: 'hello world' });
    const lineId = afterFinalize.captions[0].id;
    const correctedWords = [
      { text: 'hello', type: 'confirmed' as const, confidence: 1.0, flagged: false },
      { text: 'wonderful', type: 'predicted' as const, confidence: 0.5, flagged: false },
    ];
    const afterGapFill = dispatch(afterFinalize, {
      type: 'APPLY_GAP_FILLER',
      payload: { lineId, words: correctedWords },
    });
    expect(afterGapFill.stats.aiCorrections).toBeGreaterThan(0);
  });

  it('flags a word by lineId and wordIndex', () => {
    const afterFinalize = dispatch(initialState, { type: 'FINALIZE_LINE', payload: 'hello world' });
    const lineId = afterFinalize.captions[0].id;
    const afterFlag = dispatch(afterFinalize, {
      type: 'FLAG_WORD',
      payload: { lineId, wordIndex: 0 },
    });
    expect(afterFlag.captions[0].words[0].flagged).toBe(true);
  });

  it('toggles flagged state on second tap', () => {
    const afterFinalize = dispatch(initialState, { type: 'FINALIZE_LINE', payload: 'hello' });
    const lineId = afterFinalize.captions[0].id;
    const flagAction: SessionAction = { type: 'FLAG_WORD', payload: { lineId, wordIndex: 0 } };
    const flagged = dispatch(afterFinalize, flagAction);
    const unflagged = dispatch(flagged, flagAction);
    expect(unflagged.captions[0].words[0].flagged).toBe(false);
  });

  it('ends session and clears interim', () => {
    const listening = dispatch(initialState, { type: 'START_SESSION' });
    const withInterim = dispatch(listening, { type: 'ADD_INTERIM', payload: 'mid word' });
    const ended = dispatch(withInterim, { type: 'END_SESSION' });
    expect(ended.status).toBe('ended');
    expect(ended.currentInterim).toBe('');
  });

  it('handles empty interim results gracefully', () => {
    const state = dispatch(initialState, { type: 'ADD_INTERIM', payload: '' });
    expect(state.currentInterim).toBe('');
  });

  it('sets sessionEndTime on END_SESSION', () => {
    const listening = dispatch(initialState, { type: 'START_SESSION' });
    const beforeEnd = Date.now();
    const ended = dispatch(listening, { type: 'END_SESSION' });
    expect(ended.status).toBe('ended');
    expect(ended.sessionEndTime).not.toBeNull();
    expect(ended.sessionEndTime!).toBeGreaterThanOrEqual(beforeEnd);
  });

  it('sets feedbackGiven on GIVE_FEEDBACK', () => {
    const ended = dispatch(initialState, { type: 'END_SESSION' });
    const afterYes = dispatch(ended, { type: 'GIVE_FEEDBACK', payload: 'yes' });
    expect(afterYes.feedbackGiven).toBe('yes');
    const afterNo = dispatch(ended, { type: 'GIVE_FEEDBACK', payload: 'no' });
    expect(afterNo.feedbackGiven).toBe('no');
  });

  it('FINALIZE_LINE_WITH_WORDS creates a line with pre-scored words', () => {
    const words = [
      { text: 'Hello', type: 'confirmed' as const, confidence: 0.99, flagged: false },
      { text: 'world', type: 'uncertain' as const, confidence: 0.75, flagged: false },
    ];
    const state = dispatch(initialState, { type: 'FINALIZE_LINE_WITH_WORDS', payload: { words } });
    expect(state.captions).toHaveLength(1);
    expect(state.captions[0].isFinalized).toBe(true);
    expect(state.captions[0].words[0].text).toBe('Hello');
    expect(state.captions[0].words[0].type).toBe('confirmed');
    expect(state.captions[0].words[1].type).toBe('uncertain');
    expect(state.captions[0].words[1].confidence).toBe(0.75);
  });

  it('FINALIZE_LINE_WITH_WORDS increments wordCount', () => {
    const words = [
      { text: 'one', type: 'confirmed' as const, confidence: 0.9, flagged: false },
      { text: 'two', type: 'predicted' as const, confidence: 0.5, flagged: false },
      { text: 'three', type: 'confirmed' as const, confidence: 0.95, flagged: false },
    ];
    const state = dispatch(initialState, { type: 'FINALIZE_LINE_WITH_WORDS', payload: { words } });
    expect(state.stats.wordCount).toBe(3);
  });

  it('FINALIZE_LINE_WITH_WORDS clears currentInterim', () => {
    const withInterim = dispatch(initialState, { type: 'ADD_INTERIM', payload: 'typing' });
    const words = [{ text: 'done', type: 'confirmed' as const, confidence: 1.0, flagged: false }];
    const state = dispatch(withInterim, { type: 'FINALIZE_LINE_WITH_WORDS', payload: { words } });
    expect(state.currentInterim).toBe('');
  });

  it('FINALIZE_LINE_WITH_WORDS ignores empty words array', () => {
    const state = dispatch(initialState, { type: 'FINALIZE_LINE_WITH_WORDS', payload: { words: [] } });
    expect(state.captions).toHaveLength(0);
  });

  it('FINALIZE_LINE_WITH_WORDS stores speakerId when provided (diarization)', () => {
    const words = [{ text: 'Hi', type: 'confirmed' as const, confidence: 1.0, flagged: false }];
    const state = dispatch(initialState, { type: 'FINALIZE_LINE_WITH_WORDS', payload: { words, speakerId: 2 } });
    expect(state.captions).toHaveLength(1);
    expect(state.captions[0].speakerId).toBe(2);
  });

  it('resets feedbackGiven on START_SESSION', () => {
    const ended = dispatch(initialState, { type: 'END_SESSION' });
    const withFeedback = dispatch(ended, { type: 'GIVE_FEEDBACK', payload: 'yes' });
    expect(withFeedback.feedbackGiven).toBe('yes');
    const restarted = dispatch(withFeedback, { type: 'START_SESSION' });
    expect(restarted.feedbackGiven).toBe(null);
  });

  describe('PAUSE_SESSION', () => {
    it('sets status to paused', () => {
      const listening = dispatch(initialState, { type: 'START_SESSION' });
      const paused = dispatch(listening, { type: 'PAUSE_SESSION' });
      expect(paused.status).toBe('paused');
    });

    it('clears currentInterim when pausing', () => {
      const listening = dispatch(initialState, { type: 'START_SESSION' });
      const withInterim = dispatch(listening, { type: 'ADD_INTERIM', payload: 'in progress' });
      expect(withInterim.currentInterim).not.toBe('');
      const paused = dispatch(withInterim, { type: 'PAUSE_SESSION' });
      expect(paused.currentInterim).toBe('');
    });

    it('preserves captions when pausing', () => {
      const listening = dispatch(initialState, { type: 'START_SESSION' });
      const withLine = dispatch(listening, { type: 'FINALIZE_LINE', payload: 'Hello world' });
      expect(withLine.captions).toHaveLength(1);
      const paused = dispatch(withLine, { type: 'PAUSE_SESSION' });
      expect(paused.captions).toHaveLength(1);
      expect(paused.captions[0].words[0].text).toBe('Hello');
    });
  });
});

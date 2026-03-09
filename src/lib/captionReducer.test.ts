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

  it('adds interim text', () => {
    const state = dispatch(initialState, { type: 'ADD_INTERIM', payload: 'hello world' });
    expect(state.currentInterim).toBe('hello world');
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
    expect(afterGapFill.captions[0].words[1].text).toBe('wonderful');
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
});

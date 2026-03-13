import { describe, it, expect } from 'vitest';
import { addEndPunctuation } from './punctuation';

describe('addEndPunctuation', () => {
  it('leaves sentence unchanged if it already ends with ?', () => {
    expect(addEndPunctuation('How are you?')).toBe('How are you?');
  });

  it('leaves sentence unchanged if it already ends with !', () => {
    expect(addEndPunctuation('Hey there!')).toBe('Hey there!');
  });

  it('leaves sentence unchanged if it already ends with .', () => {
    expect(addEndPunctuation('I am fine.')).toBe('I am fine.');
  });

  it('replaces trailing . with ? for questions', () => {
    expect(addEndPunctuation('how are you.')).toBe('how are you?');
  });

  it('replaces trailing . with ! for exclamations', () => {
    expect(addEndPunctuation('hey there.')).toBe('hey there!');
  });

  it('adds ? for question starters', () => {
    expect(addEndPunctuation('how')).toBe('how?');
    expect(addEndPunctuation('how are you')).toBe('how are you?');
    expect(addEndPunctuation('What is that')).toBe('What is that?');
    expect(addEndPunctuation('Can you help')).toBe('Can you help?');
  });

  it('adds ! for exclamation starters', () => {
    expect(addEndPunctuation('hey')).toBe('hey!');
    expect(addEndPunctuation('hey there')).toBe('hey there!');
    expect(addEndPunctuation('Wow that works')).toBe('Wow that works!');
    expect(addEndPunctuation('Oh nice')).toBe('Oh nice!');
  });

  it('adds . for statements', () => {
    expect(addEndPunctuation('I am going home')).toBe('I am going home.');
    expect(addEndPunctuation('The cat sat')).toBe('The cat sat.');
  });

  it('returns empty string for empty input', () => {
    expect(addEndPunctuation('')).toBe('');
    expect(addEndPunctuation('   ')).toBe('');
  });
});

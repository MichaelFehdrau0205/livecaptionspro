import type { FifoLine } from '@/types';

export interface SpeakerProfile {
  id: number;
  name: string;
  role: string;
  bgColor: string;
  textColor: string;
}

export const SPEAKERS: SpeakerProfile[] = [
  // Speaker 1: default white text (no color box in demo)
  { id: 1, name: 'Speaker 1', role: 'Host', bgColor: '#1a1a2e', textColor: '#ffffff' },
  // Speakers 2–4: strong color boxes with dark text
  { id: 2, name: 'Speaker 2', role: 'Guest', bgColor: '#22c55e', textColor: '#111827' }, // green
  { id: 3, name: 'Speaker 3', role: 'Panel', bgColor: '#eab308', textColor: '#111827' }, // yellow
  { id: 4, name: 'Speaker 4', role: 'Audience', bgColor: '#f97316', textColor: '#111827' }, // orange
];

export function getSpeakerProfile(id: number): SpeakerProfile {
  return SPEAKERS.find((s) => s.id === id) ?? SPEAKERS[0];
}

export function attachSpeakerColors(line: FifoLine): { line: FifoLine; speaker: SpeakerProfile } {
  const speaker = getSpeakerProfile(line.speakerId);
  return { line, speaker };
}


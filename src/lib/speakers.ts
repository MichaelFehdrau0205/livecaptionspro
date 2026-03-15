/** Speaker profiles for colored caption lines (1–4). */
export interface SpeakerProfile {
  id: number;
  name: string;
  bgColor: string;
  textColor: string;
}

export const SPEAKERS: SpeakerProfile[] = [
  { id: 1, name: 'Speaker 1', bgColor: '#1a1a2e', textColor: '#ffffff' },
  { id: 2, name: 'Speaker 2', bgColor: '#22c55e', textColor: '#111827' }, // green
  { id: 3, name: 'Speaker 3', bgColor: '#eab308', textColor: '#111827' }, // yellow
  { id: 4, name: 'Speaker 4', bgColor: '#f97316', textColor: '#111827' }, // orange
];

export function getSpeakerProfile(id: number): SpeakerProfile {
  const n = Math.max(1, Math.min(4, Math.round(id)));
  return SPEAKERS.find((s) => s.id === n) ?? SPEAKERS[0];
}

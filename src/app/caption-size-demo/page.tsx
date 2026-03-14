'use client';

import Link from 'next/link';
import { SpeakerToken } from '@/components/SpeakerToken';
import { getSpeakerProfile } from '@/lib/speakers';

const SAMPLE_WORDS: { text: string; speakerId: number }[] = [
  { text: 'Hello', speakerId: 1 },
  { text: 'hello', speakerId: 1 },
  { text: 'how', speakerId: 1 },
  { text: 'are', speakerId: 1 },
  { text: 'you.', speakerId: 1 },
  { text: 'We', speakerId: 2 },
  { text: 'need', speakerId: 2 },
  { text: 'to', speakerId: 2 },
  { text: 'hello.', speakerId: 2 },
  { text: 'Wow!', speakerId: 4 },
  { text: 'How', speakerId: 4 },
  { text: 'many', speakerId: 4 },
  { text: 'talking', speakerId: 4 },
  { text: 'to', speakerId: 4 },
  { text: 'her?', speakerId: 4 },
  { text: 'Wow!', speakerId: 4 },
];

function CaptionSample({ sizeLabel, sizeClass }: { sizeLabel: string; sizeClass: string }) {
  return (
    <div className="rounded-xl bg-black/20 p-4">
      <p className="text-white/60 text-xs mb-2 font-mono">{sizeLabel}</p>
      <p className="leading-relaxed text-white">
        {SAMPLE_WORDS.map((w, i) => (
          <span key={i}>
            <SpeakerToken
              word={{ text: w.text }}
              speaker={getSpeakerProfile(w.speakerId)}
              className={sizeClass}
            />
            {i < SAMPLE_WORDS.length - 1 ? ' ' : null}
          </span>
        ))}
        <span className="inline-block w-0.5 h-5 bg-white/60 animate-pulse ml-1 align-middle" />
      </p>
    </div>
  );
}

const SIZES: { id: string; label: string; class: string }[] = [
  { id: 'A', label: 'Option A — 18px (smaller)', class: 'text-[18px]' },
  { id: 'B', label: 'Option B — 20px (current)', class: 'text-[20px]' },
  { id: 'C', label: 'Option C — 22px (a bit bigger)', class: 'text-[22px]' },
  { id: 'D', label: 'Option D — 24px (larger)', class: 'text-[24px]' },
];

export default function CaptionSizeDemoPage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col text-white">
      <header className="flex-shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="text-white/80 hover:text-white text-sm underline">
          ← Back to app
        </Link>
        <span className="text-white/60 text-sm">Caption size demo</span>
      </header>

      <main className="flex-1 px-4 py-8 max-w-[720px] mx-auto">
        <p className="text-white/70 mb-6 text-sm">
          Pick the size you like. Tell me the option (A, B, C, or D) and we’ll use it for live captions.
        </p>
        <div className="flex flex-col gap-8">
          {SIZES.map(({ id, label, class: sizeClass }) => (
            <CaptionSample key={id} sizeLabel={label} sizeClass={sizeClass} />
          ))}
        </div>
      </main>
    </div>
  );
}

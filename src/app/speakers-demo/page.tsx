'use client';

import Link from 'next/link';
import { SpeakerToken } from '@/components/SpeakerToken';
import { SPEAKERS } from '@/lib/speakers';

export default function SpeakersDemoPage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col text-white">
      <header className="flex-shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="text-white/80 hover:text-white text-sm underline">
          ← Back to app
        </Link>
        <span className="text-white/60 text-sm">SpeakerToken color demo</span>
      </header>

      <main className="flex-1 flex flex-col gap-6 px-4 py-8 max-w-[720px] mx-auto">
        <section>
          <h2 className="text-lg font-semibold mb-3">Example sentences by speaker</h2>
          <p className="text-white/70 mb-4 text-sm">
            Each person&apos;s words are shown in their own color, similar to the demo image you shared. In the real
            app, each sentence from a person would reuse that person&apos;s color.
          </p>
          <div
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base leading-relaxed"
            data-testid="speaker-token-row"
          >
            <span className="text-white">Hi everyone, welcome.</span>
            <SpeakerToken word={{ text: 'Thanks, happy to be here.' }} speaker={SPEAKERS[1]} />
            <SpeakerToken word={{ text: 'I have a quick question.' }} speaker={SPEAKERS[2]} />
            <span className="text-white">Let me know if anything is unclear.</span>
            <SpeakerToken word={{ text: 'Sure, go ahead and ask.' }} speaker={SPEAKERS[3]} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Interim / ghost token</h2>
          <p className="text-white/70 mb-4 text-sm">
            Interim words use a dashed border and slightly lower opacity, so you can tell they&apos;re still being
            recognized.
          </p>
          <SpeakerToken
            word={{ text: 'interim example' }}
            speaker={SPEAKERS[0]}
            isInterim
            showCursor
          />
        </section>
      </main>
    </div>
  );
}


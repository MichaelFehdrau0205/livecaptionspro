'use client';

import type { GroupSpeakerCount } from '@/hooks/useGroupSpeakerCount';

interface GroupSessionToolsProps {
  expectedSpeakerCount: GroupSpeakerCount;
  onExpectedSpeakerCountChange: (count: GroupSpeakerCount) => void;
}

export function GroupSessionTools({
  expectedSpeakerCount,
  onExpectedSpeakerCountChange,
}: GroupSessionToolsProps) {
  return (
    <section
      className="border-b border-white/10 bg-[#151528] px-4 py-3"
      aria-label="Group session tools"
      data-testid="group-session-tools"
    >
      <div className="mx-auto max-w-[720px]">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Speakers
            </span>
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onExpectedSpeakerCountChange(count as GroupSpeakerCount)}
                className={`min-h-[36px] rounded-full px-3 text-sm font-semibold transition-colors ${
                  expectedSpeakerCount === count
                    ? 'bg-white text-[#1a1a2e]'
                    : 'bg-white/8 text-white/70 hover:bg-white/14 hover:text-white'
                }`}
                aria-pressed={expectedSpeakerCount === count}
                data-testid={`speaker-count-${count}`}
              >
                {count}
              </button>
            ))}
            <span className="text-xs text-white/45">
              Set the expected number of people in this session.
            </span>
          </div>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
            Best results: keep the laptop close to the group, reduce overlap, let each person finish a sentence before the next speaker starts, and avoid side conversations.
          </div>
        </div>
      </div>
    </section>
  );
}

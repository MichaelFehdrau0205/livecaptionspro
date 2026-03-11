'use client';

import { useSession } from '@/context/SessionContext';

function formatDuration(startTime: number | null): string {
  if (!startTime) return '00:00:00';
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function SessionEndScreen() {
  const { state, startSession, giveFeedback } = useSession();
  const { stats, sessionStartTime, feedbackGiven } = state;
  const duration = formatDuration(sessionStartTime);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] px-6 text-white">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
        {/* Session stats */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SESSION ENDED</h2>
          <div className="mt-4 space-y-2 text-white/70 text-lg">
            <p>Duration: <span className="text-white font-mono">{duration}</span></p>
            <p>Words captured: <span className="text-white font-semibold">{stats.wordCount.toLocaleString()}</span></p>
            <p>AI corrections: <span className="text-white font-semibold">{stats.aiCorrections}</span></p>
          </div>
        </div>

        <div className="w-full border-t border-white/10" />

        {/* Feedback prompt — show thanks/great after answering */}
        <div>
          {feedbackGiven === null ? (
            <>
              <p className="text-lg font-medium mb-4">Did you miss anything important?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => giveFeedback('yes')}
                  className="px-8 py-3 rounded-2xl border-2 border-white/30 text-white font-bold
                    hover:border-white/60 active:scale-95 transition-all min-h-[56px] min-w-[80px]"
                  aria-label="Yes, I missed something"
                  data-testid="feedback-yes"
                >
                  YES
                </button>
                <button
                  onClick={() => giveFeedback('no')}
                  className="px-8 py-3 rounded-2xl border-2 border-white/30 text-white font-bold
                    hover:border-white/60 active:scale-95 transition-all min-h-[56px] min-w-[80px]"
                  aria-label="No, I got everything"
                  data-testid="feedback-no"
                >
                  NO
                </button>
              </div>
            </>
          ) : feedbackGiven === 'yes' ? (
            <p className="text-lg font-medium text-green-400" data-testid="feedback-thanks">
              Thanks for your feedback!
            </p>
          ) : (
            <p className="text-lg font-medium text-green-400" data-testid="feedback-great">
              Great!
            </p>
          )}
        </div>

        <div className="w-full border-t border-white/10" />

        {/* New session */}
        <button
          onClick={startSession}
          data-testid="new-session-button"
          className="w-full py-5 rounded-2xl bg-white text-[#1a1a2e] text-xl font-bold tracking-wide
            hover:bg-white/90 active:scale-95 transition-all min-h-[56px]"
          aria-label="Start a new captioning session"
        >
          NEW SESSION
        </button>
      </div>
    </div>
  );
}

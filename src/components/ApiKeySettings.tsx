'use client';

import { useState } from 'react';

const STORAGE_KEY = 'deepgram_api_key';

function maskKey(key: string): string {
  if (key.length <= 4) return '••••';
  return '••••••••' + key.slice(-4);
}

export function ApiKeySettings({ onClose }: { onClose: () => void }) {
  const [savedKey, setSavedKey] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) ?? '') : ''
  );
  const [inputValue, setInputValue] = useState('');

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setSavedKey(trimmed);
    setInputValue('');
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedKey('');
    setInputValue('');
  };

  const hasKey = savedKey.length > 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      data-testid="settings-modal"
    >
      <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 id="settings-title" className="text-xl font-bold text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors text-2xl leading-none"
            aria-label="Close settings"
            data-testid="settings-close"
          >
            ×
          </button>
        </div>

        {/* Status */}
        <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Speech Recognition</p>
          {hasKey ? (
            <div>
              <p className="text-sm text-green-400 font-medium">✓ Deepgram Nova-3 active</p>
              <p className="text-xs text-white/50 mt-1">Real-time per-word confidence • Est. $0.0043/min</p>
              <p className="text-xs text-white/40 mt-1 font-mono">{maskKey(savedKey)}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-white/70">Web Speech API (browser built-in)</p>
              <p className="text-xs text-white/40 mt-1">No per-word confidence — add a Deepgram key to enable it</p>
            </div>
          )}
        </div>

        {/* Key input */}
        <div className="mb-4">
          <label htmlFor="deepgram-key-input" className="block text-sm text-white/70 mb-2">
            Deepgram API key
          </label>
          <input
            id="deepgram-key-input"
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder={hasKey ? 'Enter new key to replace' : 'Paste your API key'}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50"
            data-testid="deepgram-key-input"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!inputValue.trim()}
            className="flex-1 py-3 rounded-xl bg-white text-[#1a1a2e] font-bold text-sm
              hover:bg-white/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="save-key-button"
          >
            Save key
          </button>
          {hasKey && (
            <button
              type="button"
              onClick={handleClear}
              className="py-3 px-4 rounded-xl border border-white/20 text-white/70 text-sm
                hover:bg-white/10 active:scale-95 transition-all"
              data-testid="clear-key-button"
            >
              Remove
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-white/30 text-center">
          Key stored locally in your browser only.{' '}
          <a
            href="https://console.deepgram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            Get a free key →
          </a>
        </p>
      </div>
    </div>
  );
}

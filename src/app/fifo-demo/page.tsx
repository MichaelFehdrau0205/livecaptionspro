'use client';

import Link from 'next/link';
import { FifoStage } from '@/components/FifoStage';
import type { FifoLine } from '@/types';
import { pushLine } from '@/lib/fifoModel';

// Mock data for viewport testing (Day 6 checklist)
const MOCK_LINES: FifoLine[] = [
  { id: '1', speakerId: 1, words: [{ text: 'Welcome to the FIFO stage.' }], interim: '', done: true },
  { id: '2', speakerId: 2, words: [{ text: 'This is how multi-speaker captions will look.' }], interim: '', done: true },
  { id: '3', speakerId: 1, words: [{ text: 'Older lines fade; newest at full opacity.' }], interim: '', done: true },
  { id: '4', speakerId: 2, words: [{ text: 'Resize the window or use DevTools device toolbar to test:' }], interim: '', done: true },
  { id: '5', speakerId: 1, words: [{ text: 'iPhone SE (375px), iPhone 14 Pro (393px), iPad (768px), iPad Pro (1024px).' }], interim: '', done: true },
  { id: '6', speakerId: 2, words: [{ text: 'Bottom-anchored layout and slide-up animation.' }], interim: ' coming', done: false },
];

export default function FifoDemoPage() {
  const lines = MOCK_LINES.reduce<FifoLine[]>((acc, line) => pushLine(acc, line), []);

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col text-white">
      <header className="flex-shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="text-white/80 hover:text-white text-sm underline">
          ← Back to app
        </Link>
        <span className="text-white/60 text-sm">FifoStage viewport demo</span>
      </header>
      <div className="flex-1 flex flex-col min-h-0">
        <FifoStage lines={lines} />
      </div>
    </div>
  );
}

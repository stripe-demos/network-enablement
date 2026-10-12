import { useEffect, useState } from 'react';
import { CloseIcon } from './icons';

const TIPS = [
  'Use / to explore commands.',
  'Open + to browse skills and commands.',
  'Skills give Console specialized instructions.',
  'Memory helps retain useful context.',
  'Use /plan to think through an approach.',
  'Hold Space to dictate your message.',
  'Use Shift + Enter to add a new line.',
];

export function RotatingTip({ paused = false, onDismiss }) {
  const [hovered, setHovered] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    if (paused || hovered) return;
    const timer = setInterval(() => {
      if (!document.hidden) setTipIndex(index => (index + 1) % TIPS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [paused, hovered]);

  return (
    <span className="prompt-composer__tip" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span key={tipIndex} className="prompt-composer__tip-text">{TIPS[tipIndex]}</span>
      <button type="button" className="prompt-composer__tip-dismiss" onClick={onDismiss}
        aria-label="Hide tips" title="Hide tips">
        <CloseIcon size={12} />
      </button>
    </span>
  );
}

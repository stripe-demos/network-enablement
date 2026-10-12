// Extracted from the voice prototype's MicIcon and MorphingCursor.
export function MicrophoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="4.5" y="1" width="5" height="7.5" rx="2.5" fill="currentColor" />
      <path d="M2 7c0 2.761 2.239 5 5 5s5-2.239 5-5M7 12v1.5M4.5 13.5h5"
        stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function StopVoiceIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="8" height="8" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function VoiceIndicator() {
  return (
    <span className="composer-voice-bars is-audio-reactive" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => <span key={index} />)}
    </span>
  );
}

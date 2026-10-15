import { useLayoutEffect, useRef, useState } from 'react';
import useSpeechRecognition from './useSpeechRecognition';
import VoiceMode from './VoiceMode';

/**
 * The live counterpart to `VoiceMode`.
 *
 * Where `VoiceMode` fakes dictation by revealing a canned transcript, this one
 * actually listens: it drives the Web Speech API through `useSpeechRecognition`
 * and pushes what the mic hears back out through `onTranscriptChange`, so the
 * parent's `description` — and with it the counter and strength chips — grows as
 * you speak. It's a drop-in for `VoiceMode` (same prop shape).
 *
 * When the browser has no speech API it renders `VoiceMode` instead, so the
 * demo still plays the scripted reveal rather than sitting dead.
 *
 * // motion: voice-to-text
 */
export default function LiveVoiceMode({
  transcript,
  baseText = '',
  onTranscriptChange,
  onFinish,
  className = '',
}) {
  // The text present before recording started, captured once so our own output
  // never feeds back in.
  const [base] = useState(() => baseText.trim());
  const emit = useRef(onTranscriptChange);
  useLayoutEffect(() => {
    emit.current = onTranscriptChange;
  });

  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');

  const supported = useSpeechRecognition(true, {
    onResult: ({ finalText: next, interimText: interim }) => {
      setFinalText(next);
      setInterimText(interim);
      const spoken = `${next}${interim}`.trim();
      const combined = base ? (spoken ? `${base} ${spoken}` : base) : spoken;
      emit.current?.(combined);
    },
  });

  // No speech API in this browser — hand back to the scripted reveal.
  if (!supported) {
    return (
      <VoiceMode
        transcript={transcript}
        baseText={baseText}
        onTranscriptChange={onTranscriptChange}
        onFinish={onFinish}
        className={className}
      />
    );
  }

  return (
    <div className={`flex items-start ${className}`}>
      <p className="text-body-medium text-default" aria-live="polite">
        {/* The pre-recording text, if any, leads as a plain run. */}
        {base ? `${base} ` : ''}
        <span>{finalText}</span>
        {interimText && <span className="text-subdued">{interimText}</span>}
        {/* A blinking text caret sits at the end, reading as "waiting for input". */}
        <span
          aria-hidden="true"
          className="ml-[1px] inline-block h-[1.1em] w-[2px] translate-y-[0.18em] bg-current animate-[caretBlink_1.06s_step-end_infinite]"
        />
      </p>
    </div>
  );
}

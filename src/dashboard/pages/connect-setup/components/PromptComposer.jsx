import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import VoiceGlowViz from './VoiceGlowViz';
import ShufflingPlaceholder from './ShufflingPlaceholder';
import LiveVoiceMode from './LiveVoiceMode';
import CheckChip from './CheckChip';
import AttachmentPreviewCard from './AttachmentPreviewCard';
import useFileAttachments from './useFileAttachments';
import { BUSINESS } from '../data/business';
import { ANALYZE_MS, STAGED_FILE, STAGED_PLACEHOLDER } from '../data/stagedFile';
import { PARSE_MS, WEBSITE_SUMMARY, isParseableWebsite } from '../data/websiteParse';
import HighlightedDescription from './HighlightedDescription';

// The stop affordance the mic turns into while recording, inlined from the Figma
// instance `1568:375194` ("Stop circle").
const StopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 4.5H4.5V7.5H7.5V4.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// There is no `mic` glyph in the icon set, so the microphone is inlined here. Sized
// to 12px to match the design's other action-bar icons.
const MicIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 1.5a2.25 2.25 0 0 0-2.25 2.25v3.5a2.25 2.25 0 0 0 4.5 0v-3.5A2.25 2.25 0 0 0 8 1.5Z"
      fill="currentColor"
    />
    <path
      d="M3.75 6.75v.5a4.25 4.25 0 0 0 8.5 0v-.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M8 11.5v3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Drag limits for the resize corner. The floor is the card's natural
// `min-h-[212px]`, so dragging up can't collapse it past its designed size; the
// ceiling keeps a tall card from pushing the step's footer off screen.
const MIN_CARD_H = 212;
const MAX_CARD_H = 520;

export default function PromptComposer({
  website,
  onWebsiteChange,
  description,
  onDescriptionChange,
  checks = [],
  analysis,
  placeholders = [],
  maxLength = 10000,
  onAddContext,
  onVoice,
  onFileIntentChange,
  className = '',
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  // Card height once the user has dragged the resize corner; null = the natural
  // `min-h-[212px]`.
  const [cardHeight, setCardHeight] = useState(null);
  const cardRef = useRef(null);
  const resizeRef = useRef(null);
  const [attachmentError, setAttachmentError] = useState(null);
  // `null` | 'analyzing' | 'ready'
  const [stagedStatus, setStagedStatus] = useState(null);
  const analyzeTimer = useRef(null);
  const [parsingWebsite, setParsingWebsite] = useState(false);
  const parseTimer = useRef(null);
  // Which URL we've already summarised, so editing around a parsed URL doesn't
  // re-run the read or overwrite the text again.
  const parsedUrlRef = useRef(null);

  // The picker is real, but what it stages is not: any selection stages
  // `STAGED_FILE`, so the demo is deterministic. See data/stagedFile.js.
  const { files, inputProps, dropProps, isDraggingOver, open, clear } = useFileAttachments({
    maxFiles: 1,
    onError: setAttachmentError,
  });

  const staged = stagedStatus !== null;

  useEffect(() => () => clearTimeout(analyzeTimer.current), []);

  // A picked file reads as intent even though the textarea stays empty, so the
  // parent is told separately once the analysis settles.
  useEffect(() => {
    if (files.length === 0) return undefined;
    setStagedStatus('analyzing');
    onFileIntentChange?.(false);
    clearTimeout(analyzeTimer.current);
    analyzeTimer.current = setTimeout(() => {
      setStagedStatus('ready');
      onFileIntentChange?.(true);
    }, ANALYZE_MS);
    return undefined;
  }, [files.length, onFileIntentChange]);

  const removeStaged = () => {
    clearTimeout(analyzeTimer.current);
    setStagedStatus(null);
    onFileIntentChange?.(false);
    clear();
  };

  const isEmpty = description.length === 0;
  // Frozen once a file is staged: the design still shows the example text, but it
  // shouldn't keep cycling while an attachment is the actual input.
  const isCycling =
    isEmpty && !isFocused && !isRecording && !staged && placeholders.length > 1;

  const commit = (value) => onDescriptionChange(value.slice(0, maxLength));

  // Held in a ref so the website effect doesn't re-run on every keystroke just
  // because `commit` is a new function identity.
  const commitRef = useRef(commit);
  useLayoutEffect(() => {
    commitRef.current = commit;
  });

  const handleDescriptionChange = (event) => {
    commit(event.target.value);
  };

  // Reading the website writes its summary into the description, so the existing
  // checks pass on real text and the counter reflects it. Only fires for a URL we
  // recognise, and never overwrites something already typed.
  // motion: website-parse
  useEffect(() => {
    if (!isParseableWebsite(website)) return undefined;
    if (parsedUrlRef.current === website.trim()) return undefined;
    if (description.length > 0) return undefined;

    const debounce = setTimeout(() => {
      setParsingWebsite(true);
      parseTimer.current = setTimeout(() => {
        parsedUrlRef.current = website.trim();
        setParsingWebsite(false);
        commitRef.current(WEBSITE_SUMMARY);
      }, PARSE_MS);
    }, 500);

    return () => {
      clearTimeout(debounce);
      clearTimeout(parseTimer.current);
      setParsingWebsite(false);
    };
  }, [website, description.length]);

  // Drag-to-resize, driven from the corner handle. `cardHeight` is null until the
  // user drags, so the card keeps its natural `min-h` until then. The drag start
  // is held in a ref rather than state — it changes every pointer event and
  // nothing renders off it.
  const startResize = (event) => {
    // Keep the gesture from selecting text or focusing the textarea underneath.
    event.preventDefault();
    resizeRef.current = {
      startY: event.clientY,
      startHeight: cardRef.current?.getBoundingClientRect().height ?? MIN_CARD_H,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const resizeMove = (event) => {
    const drag = resizeRef.current;
    if (!drag) return;
    const next = drag.startHeight + (event.clientY - drag.startY);
    setCardHeight(Math.min(MAX_CARD_H, Math.max(MIN_CARD_H, next)));
  };

  const endResize = (event) => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  // Keyboard equivalent, so the handle isn't mouse-only.
  const resizeKeyDown = (event) => {
    const step = event.key === 'ArrowDown' ? 16 : event.key === 'ArrowUp' ? -16 : 0;
    if (!step) return;
    event.preventDefault();
    const current = cardHeight ?? cardRef.current?.getBoundingClientRect().height ?? MIN_CARD_H;
    setCardHeight(Math.min(MAX_CARD_H, Math.max(MIN_CARD_H, current + step)));
  };

  const handleVoice = () => {
    // motion: voice-to-text
    if (isRecording) {
      // Whatever has been dictated so far is already committed to the parent, so
      // stopping just hands the card back to the textarea.
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    onVoice?.();
  };

  // Chrome paints autofilled fields light blue (and black text) with an
  // unoverridable UA style; stalling the background transition keeps ours.
  const inputStyles =
    'w-full rounded-[8px] border border-hairline bg-surface px-4 text-body-small text-default placeholder:text-placeholder transition-shadow duration-[240ms] focus:outline-none focus:shadow-[0_0_0_4px_rgba(8,142,249,0.36)] autofill:[transition:background-color_9999s,box-shadow_240ms] autofill:[-webkit-text-fill-color:var(--color-default)]';

  return (
    <div className={`w-full max-w-[580px] ${className}`}>
      <label htmlFor="composer-website" className="block text-body-small text-default">
        Business website
      </label>
      <div className="relative">
        <input
          id="composer-website"
          type="text"
          value={website}
          onChange={(event) => onWebsiteChange(event.target.value)}
          // There's no form to submit, so Enter would otherwise leave the field
          // focused (and its focus ring lit) through the whole read.
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          placeholder="www.example.com"
          className={`mt-3 h-[56px] ${parsingWebsite ? 'pr-[160px]' : ''} ${inputStyles}`}
        />
        {parsingWebsite && (
          <span
            className="absolute top-3 right-3 flex h-[56px] items-center gap-1.5 text-label-small text-subdued"
            aria-live="polite"
          >
            <span className="size-3 animate-[chipSpin_700ms_linear_infinite] rounded-full border-[1.5px] border-neutral-200 border-t-brand-500" />
            Reading your website
          </span>
        )}
      </div>

      <label
        htmlFor="composer-description"
        className="mt-6 block text-body-small text-default"
      >
        Tell us about your business*
      </label>

      {/* Offset tray holding the white input card and, below it, the satisfaction
          chips — the chips sit outside the card on the tray, not inside it. */}
      <div className="relative isolate mt-3 flex w-full flex-col gap-2 overflow-hidden rounded-[14px] bg-offset p-2">
        <div
          {...dropProps}
          ref={cardRef}
          style={cardHeight ? { height: cardHeight } : undefined}
          className={`relative isolate flex min-h-[212px] w-full flex-col justify-between overflow-hidden rounded-[6px] bg-surface p-1 shadow-[0px_2px_5px_0px_rgba(48,49,61,0.08),0px_1px_1px_0px_rgba(0,0,0,0.12)] ${
            !isRecording && isDraggingOver
              ? 'outline-2 outline-offset-[-2px] outline-dashed outline-brand-400'
              : ''
          }`}
        >
          {/* While recording, the whole card border lights up with the Stripe
              gradient (a masked 1px ring) that slowly spins via a rotating conic
              gradient, with the live glow below blooming from the bottom edge.
              Both sit behind the text/buttons (card is isolated, so -z stays
              above the white background). */}
          {isRecording && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 rounded-[6px] p-px opacity-90 animate-[voiceBorderSpin_8s_linear_infinite]"
              style={{
                background:
                  'conic-gradient(from var(--voice-angle, 0deg), #FF80B5, #FF8A3D, #FFC24B, #B06AFF, #FF80B5)',
                WebkitMask:
                  'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
          )}
          {/* The bottom-edge glow reacts to the mic while recording: a blooming
              light from the centre of the bottom edge. */}
          <VoiceGlowViz
            active={isRecording}
            className="pointer-events-none absolute inset-x-0 top-0 bottom-0 -z-10"
          />
          {/* Hidden picker input — `open()` clicks it to raise the OS dialog. */}
          <input {...inputProps} />
          {/* The vertically-shuffling placeholder sits behind the caret. A native
              `placeholder` attribute can't animate, so the textarea has none.
              It clears the moment the field is focused, rather than sitting behind
              the caret, so it never competes with what's being typed. */}
          {isEmpty && !isFocused && !isRecording && (
            // The 12px inset lives on this wrapper, not on the clipping element.
            // `box-sizing: border-box` means padding on the element that owns
            // `overflow-hidden` eats into its own height, which sliced the third
            // line of every 3-line placeholder in half.
            <div className="pointer-events-none absolute top-1 right-1 left-1 p-3">
              {/* With a file staged the examples give way to a single instruction
                  about the file. A one-item list can't cycle, so it sits static. */}
              <ShufflingPlaceholder
                items={staged ? [STAGED_PLACEHOLDER] : placeholders}
                active={isCycling}
              />
            </div>
          )}

          {isRecording ? (
            // Dictation takes over the card. `LiveVoiceMode` streams real
            // speech-to-text from the mic; without a speech API it falls back to
            // revealing the canned `BUSINESS.description` (the same string the
            // rest of the flow infers from).
            <LiveVoiceMode
              transcript={BUSINESS.description}
              baseText={description}
              onTranscriptChange={commit}
              onFinish={() => setIsRecording(false)}
              className="min-h-0 flex-1 p-3"
            />
          ) : (
            <HighlightedDescription
              value={description}
              highlights={analysis.highlights}
              onChange={handleDescriptionChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={maxLength}
            />
          )}

          {staged && (
            <div className="shrink-0 px-3 pb-1">
              <AttachmentPreviewCard
                name={STAGED_FILE.name}
                meta={STAGED_FILE.meta}
                preview={STAGED_FILE.preview}
                onRemove={removeStaged}
              />
            </div>
          )}

          {/* Action bar sits inside the card, bottom-left. */}
          <div className="flex shrink-0 items-end gap-2 p-2">
            <button
              type="button"
              aria-label={isRecording ? 'Stop recording' : 'Describe your business by voice'}
              aria-pressed={isRecording}
              onClick={handleVoice}
              className={`flex h-[28px] min-h-[28px] shrink-0 cursor-pointer items-center justify-center gap-[6px] rounded-[6px] px-2 py-1 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(8,142,249,0.36)] ${
                isRecording
                  ? 'bg-brand-500 text-button-primary-text hover:bg-brand-600'
                  : 'bg-offset text-icon-default hover:bg-neutral-100'
              }`}
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
            </button>
            <button
              type="button"
              onClick={() => {
                setAttachmentError(null);
                open();
                onAddContext?.();
              }}
              className="flex h-[28px] min-h-[28px] shrink-0 cursor-pointer items-center justify-center gap-[6px] rounded-[6px] bg-offset px-2 py-1 text-label-medium text-default transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(8,142,249,0.36)]"
            >
              <Icon name="add" size="xsmall" fill="currentColor" className="text-icon-default" />
              Add files or photos
            </button>
          </div>

          {/* Resize corner — the diagonal lines from the design, made functional.
              Dragging it grows or shrinks the card, and since the editor inside is
              `flex-1` the textarea takes up the difference. Width is fixed by the
              surrounding layout, so this is vertical-only (hence `ns-resize`).
              `touch-none` stops a drag from scrolling the page on touch. */}
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize the description field"
            tabIndex={0}
            onPointerDown={startResize}
            onPointerMove={resizeMove}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            onKeyDown={resizeKeyDown}
            className="absolute right-0 bottom-0 flex size-4 cursor-ns-resize touch-none items-end justify-end p-[2px] text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(8,142,249,0.36)]"
          >
            <svg aria-hidden="true" viewBox="0 0 8 8" className="size-2">
              <path d="M8 0 0 8M8 4 4 8" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {checks.map((check) => (
            <CheckChip
              key={check.id}
              label={check.label}
              satisfied={check.satisfied}
              checking={analysis.status === 'checking' || stagedStatus === 'analyzing' || parsingWebsite}
            />
          ))}
        </div>

        {/* No visible counter, so the cap only surfaces once it's hit (typing
            stops, or a paste is truncated to fit). Figma `2528:54193`. */}
        {description.length >= maxLength && (
          <div className="flex items-start gap-1 text-critical" role="alert">
            <span className="flex h-4 shrink-0 items-center">
              <Icon name="warningCircle" size="xsmall" fill="currentColor" />
            </span>
            <p className="text-label-small">
              You’ve reached the {maxLength.toLocaleString()}-character limit.
            </p>
          </div>
        )}

        <div id="description-analysis-status" className={analysis.error ? 'text-label-small text-subdued' : 'sr-only'} role="status" aria-live="polite">
          {analysis.error ? (
            <span>
              {analysis.error}{' '}
              <button type="button" onClick={analysis.retry} className="cursor-pointer text-brand underline">Try again</button>
            </span>
          ) : analysis.highlights.length ? (
            'Blue highlights show useful details. Hover or move your text cursor over them to see what they inform.'
          ) : analysis.status === 'checking' ? (
            'Looking for useful business details…'
          ) : analysis.status === 'ready' ? (
            'Add what you offer and who collects your customers’ payments.'
          ) : (
            'Useful business details will highlight in blue as you type.'
          )}
        </div>

        {attachmentError && (
          <p className="text-label-small text-critical" role="alert">
            {attachmentError}
          </p>
        )}
      </div>
    </div>
  );
}

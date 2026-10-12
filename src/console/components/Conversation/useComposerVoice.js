import { useCallback, useEffect, useRef, useState } from 'react';
import { draftEndRange, placeCaretAtEnd } from './composerDom';
import { startVoiceAudioMeter } from './voiceAudioMeter';

const HOLD_MS = 300;
const ERRORS = {
  'not-allowed': 'Microphone access was denied. Allow it in your browser settings to use voice.',
  'service-not-allowed': 'Speech recognition is not allowed in this browser.',
  'audio-capture': 'No microphone is available. Check your microphone connection.',
  network: 'Voice could not connect. Check your connection and try again.',
  'no-speech': 'No speech detected. Try voice again.',
};

function notifyEditor(editor) {
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function focusEnd(editor) {
  editor.focus({ preventScroll: true });
  placeCaretAtEnd(editor);
}

// Both button-toggle and hold-to-talk use one session. DOM insertion preserves
// the composer's existing mention chips and typed draft. Late callbacks from
// stopped sessions are ignored, including permission responses after release.
export function useComposerVoice({ editorRef, containerRef, chatId, disabled }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [indicatorAnchor, setIndicatorAnchor] = useState(null);
  const sessionRef = useRef(null);
  const holdRef = useRef(null);

  const stop = useCallback(() => {
    clearTimeout(holdRef.current?.timer);
    holdRef.current = null;
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) {
      session.stopMeter?.();
      session.anchor.remove();
      // Keep the latest visible transcript, including interim words, for review.
      if (session.node?.isConnected) {
        session.node.replaceWith(document.createTextNode(session.node.textContent));
      }
      try { session.recognition?.abort(); } catch { /* Already stopped. */ }
      const editor = editorRef.current;
      if (editor) {
        // Replacing the transcript node invalidates its selection. Restore the
        // end position only in the focused editor; don't reclaim outside focus.
        if (document.activeElement === editor) placeCaretAtEnd(editor);
        notifyEditor(editor);
      }
    }
    setIndicatorAnchor(null);
    setStatus('idle');
  }, [editorRef]);

  const start = useCallback((mode = 'toggle') => {
    const editor = editorRef.current;
    if (!editor || disabled || sessionRef.current) return;
    setError('');
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice is not supported in this browser. Try Chrome or keep typing.');
      return;
    }
    // Browsers leave a placeholder <br> after deleting the last character.
    // It must not become a real newline when dictation starts in an empty draft.
    if (!editor.innerText.trim() && !editor.querySelector('.mention-chip')) editor.replaceChildren();
    const anchor = document.createElement('span');
    anchor.dataset.composerDecoration = 'voice';
    anchor.className = 'prompt-composer__listening';
    anchor.contentEditable = 'false';
    anchor.setAttribute('aria-hidden', 'true');
    draftEndRange(editor).insertNode(anchor);
    setIndicatorAnchor(anchor);
    focusEnd(editor);
    const session = { mode, recognition: null, node: null, anchor, prefix: editor.innerText.trim() && !/\s$/.test(editor.innerText) ? ' ' : '', committed: '' };
    sessionRef.current = session;

    function fail(message) {
      if (sessionRef.current !== session) return;
      stop();
      setError(message);
    }

    try {
      const recognition = new Recognition();
      session.recognition = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';
      recognition.onstart = () => {
        if (sessionRef.current === session) setStatus('listening');
      };
      recognition.onresult = event => {
        if (sessionRef.current !== session || !editor.isConnected) return;
        const words = Array.from(event.results, result => result[0].transcript.trim()).filter(Boolean).join(' ');
        const transcript = [session.committed, words].filter(Boolean).join(' ');
        if (!transcript) return;
        if (!session.node) {
          session.node = document.createElement('span');
          session.node.dataset.voiceTranscript = 'true';
          // Insert beside the indicator in the final block, not after the block.
          session.anchor.before(session.node);
        }
        session.node.textContent = session.prefix + transcript;
        focusEnd(editor);
        editor.scrollTop = editor.scrollHeight;
        notifyEditor(editor);
      };
      recognition.onerror = event => {
        fail(ERRORS[event.error] || 'Voice stopped unexpectedly. Try again.');
      };
      recognition.onend = () => {
        if (sessionRef.current !== session) return;
        // Some browsers end a recognition stream during a pause. Keep toggle
        // and held sessions running until the user explicitly stops them.
        session.committed = session.node?.textContent.trim() || session.committed;
        try { recognition.start(); } catch { fail('Voice stopped. Tap the microphone to try again.'); }
      };
      setStatus('starting');
      recognition.start();
      session.stopMeter = startVoiceAudioMeter(anchor);
    } catch {
      fail('Could not start voice. Check microphone access and try again.');
    }
  }, [disabled, editorRef, stop]);

  function handleKeyDown(event) {
    if (event.nativeEvent?.isComposing || event.isComposing) return false;
    if (holdRef.current && !holdRef.current.activated && event.code !== 'Space') {
      clearTimeout(holdRef.current.timer);
      holdRef.current = null;
      // Fast typing can press the next letter before releasing Space. Resolve
      // that tap now so words keep their normal order and separation.
      if (event.key !== 'Escape' && document.activeElement === editorRef.current) {
        document.execCommand('insertText', false, ' ');
      }
    }
    if (sessionRef.current && (event.key === 'Enter' || event.key === 'Escape')) {
      event.preventDefault();
      event.stopPropagation();
      stop();
      return true;
    }
    if (event.code !== 'Space' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || disabled) return false;
    // Space during toggle-listening doesn't create a second held session.
    if (sessionRef.current) {
      if (sessionRef.current.mode === 'hold') { event.preventDefault(); return true; }
      return false;
    }
    event.preventDefault();
    if (event.repeat || holdRef.current) return true;
    const hold = { timer: null, activated: false };
    hold.timer = setTimeout(() => {
      hold.activated = true;
      start('hold');
    }, HOLD_MS);
    holdRef.current = hold;
    return true;
  }

  useEffect(() => {
    function onKeyUp(event) {
      if (event.code !== 'Space' || !holdRef.current) return;
      const hold = holdRef.current;
      clearTimeout(hold.timer);
      holdRef.current = null;
      if (hold.activated) {
        stop();
      } else if (document.activeElement === editorRef.current) {
        // Native insertion preserves the current selection, chips, and undo.
        document.execCommand('insertText', false, ' ');
      }
    }
    function outside(event) {
      if (!containerRef.current?.contains(event.target)) stop();
    }
    function hidden() { if (document.hidden) stop(); }
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', stop);
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', outside);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', stop);
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [containerRef, editorRef, stop]);

  useEffect(() => {
    // Cleanup runs on conversation/plan changes as well as unmount.
    return stop;
  }, [chatId, disabled, stop]);

  return { active: status !== 'idle', status, error, indicatorAnchor, start, stop, handleKeyDown };
}

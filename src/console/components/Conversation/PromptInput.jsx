import { useState, useRef, useLayoutEffect, useEffect, useEffectEvent, useCallback, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArtifactPicker } from './ArtifactPicker';
import { SkillPicker } from './SkillPicker';
import { ContextUsage } from './ContextUsage';
import { AskQuestion } from './AskQuestion';
import { PlusIcon } from '../icons';
import { MicrophoneIcon, StopVoiceIcon, VoiceIndicator } from './VoiceIndicator';
import { useComposerVoice } from './useComposerVoice';
import { ALL_SKILLS } from '../../data/skills';
import { CANVAS_TAB_DATA, getTabIconSvgHtml } from '../Canvas/canvasArtifactRegistry';

// Measures the screen rect of a collapsed caret range. Collapsed ranges return
// zero-size rects in most browsers, so we insert a zero-width marker span,
// measure it, then immediately remove it to get an accurate position.
function measureCaretRect(range, editableEl) {
  let rect = range.getBoundingClientRect();
  if (rect.height === 0) {
    const marker = document.createElement('span');
    marker.textContent = '​';
    const clone = range.cloneRange();
    clone.collapse(true);
    clone.insertNode(marker);
    rect = marker.getBoundingClientRect();
    marker.parentNode?.removeChild(marker);
  }
  if (rect.height > 0) {
    return { left: rect.left, top: rect.top, bottom: rect.bottom };
  }
  const fb = editableEl?.getBoundingClientRect();
  return { left: fb?.left ?? 0, top: fb?.top ?? 0, bottom: fb?.bottom ?? 0 };
}

// PromptInput — contenteditable rich input supporting inline @-mention chips.
//
// Behavior:
//   - Shared inset composer for inline and sticky placement, with a blinking block caret.
//   - Typing @: opens ArtifactPicker near the caret. Selecting an artifact
//     inserts an inline `.mention-chip` span (contenteditable=false) at the @
//     position, then moves caret after it.
//   - Backspace at chip: browser's user-select:all on the chip means one press
//     selects it, second press deletes it.
//   - Enter submits; Shift+Enter inserts newline.
//   - Submit collects plain text + mentions[] from the DOM and calls onSubmit.

export function PromptInput({
  inputId,
  placeholder = 'Ask anything',
  onSubmit,
  working = false,
  onCancel,
  preserveOnSubmit = false,
  submissionFeedback = false,
  onSubmissionConfirmed,
  onMentionsChange,
  onNavigateUp,
  onInputFocus,
  isAnchored = false,
  chatId,
  activeTabId = null,
  contextUsagePercent = 82, // Sample usage until the prototype has a context-budget backend.
  visibleTabIds = [],
  artifactIds = [],
  mentionVariant = 'inline',
  cmdLPendingChip = null,
  onCmdLChipConsumed,
  disableAutoFocus = false,
  onSlashCommand,
  commands = ALL_SKILLS,
  showVisionAndContext = false,
  draftToInsert = null,
  planOpen = false,
  onPlanSelect,
  onPlanCancel,
  suggestions = [],
  onSuggestionSelect,
  hideEmptyFooter = false,
}) {
  const generatedInputId = useId();
  const [sendConfirmation, setSendConfirmation] = useState(null);
  const sendConfirmed = submissionFeedback || Boolean(sendConfirmation && sendConfirmation.chatId === chatId);
  useEffect(() => {
    if (!sendConfirmation) return;
    const timer = setTimeout(() => setSendConfirmation(null), 800);
    return () => clearTimeout(timer);
  }, [sendConfirmation]);
  const [exitingSuggestions, setExitingSuggestions] = useState(null);
  const suggestionExitRef = useRef(null);
  const releaseSuggestionExit = useCallback(() => {
    const pending = suggestionExitRef.current;
    suggestionExitRef.current = null;
    pending?.animation.cancel();
    if (pending) pending.row.style.pointerEvents = '';
  }, []);
  const cancelSuggestionExit = useCallback(() => {
    releaseSuggestionExit();
    setExitingSuggestions(null);
  }, [releaseSuggestionExit]);
  useEffect(() => releaseSuggestionExit, [chatId, releaseSuggestionExit]);

  function selectSuggestion(event, suggestion) {
    if (suggestionExitRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSuggestionSelect?.(suggestion);
      return;
    }
    const row = event.currentTarget.parentElement;
    setExitingSuggestions(suggestions);
    // Let the pressed pill spring back for 160ms, then fade the row for 120ms.
    const animation = row.animate([
      { opacity: 1 },
      { opacity: 1, offset: 160 / 280 },
      { opacity: 0 },
    ], { duration: 280, easing: 'linear', fill: 'forwards' });
    suggestionExitRef.current = { animation, row };
    row.style.pointerEvents = 'none';
    animation.finished.then(() => {
      if (suggestionExitRef.current?.animation !== animation) return;
      // Remove the retained row before releasing its final transparent frame.
      setExitingSuggestions(null);
    }).catch(() => {}); // Typing, switching chats, or unmounting cancels the fade.
    onSuggestionSelect?.(suggestion);
  }
  const [isEmpty, setIsEmpty] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [caretRect, setCaretRect] = useState(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [skillPickerOpen, setSkillPickerOpenState] = useState(false);
  const [skillCaretRect, setSkillCaretRect] = useState(null);
  const [skillPickerQuery, setSkillPickerQuery] = useState('');
  const [skillSuggestion, setSkillSuggestion] = useState('');
  function setSkillPickerOpen(open) {
    setSkillPickerOpenState(open);
    setSkillSuggestion('');
  }
  const matchingSkills = useMemo(() => {
    const query = skillPickerQuery.trim().toLowerCase();
    return query ? commands.filter(skill => skill.name.toLowerCase().includes(query) || skill.description.toLowerCase().includes(query)) : commands;
  }, [commands, skillPickerQuery]);
  const skillMenuVisible = skillPickerOpen && matchingSkills.length > 0;
  if (exitingSuggestions && (planOpen || skillMenuVisible)) setExitingSuggestions(null);
  useLayoutEffect(() => {
    // Preserve the fade while the draft fills; release it after the retained row exits.
    if (!exitingSuggestions) releaseSuggestionExit();
  }, [exitingSuggestions, releaseSuggestionExit]);
  const skillCompletion = skillPickerQuery && !skillSuggestion.startsWith(skillPickerQuery.toLowerCase())
    ? '' : skillSuggestion.slice(skillPickerQuery.length);

  const editableRef = useRef(null);
  const promptRowRef = useRef(null);
  const atPressedRef = useRef(false);
  const atStartRef = useRef(null); // { node: TextNode, offset: number }
  const slashPressedRef = useRef(false);
  const slashStartRef = useRef(null); // { node: TextNode, offset: number }
  const pickerPreviewIdRef = useRef(null);
  const inputContentRef = useRef(null);
  const questionContentRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(null);
  const voice = useComposerVoice({
    editorRef: editableRef,
    containerRef: inputContentRef,
    chatId,
    disabled: planOpen,
  });

  function startVoice() {
    setPickerOpen(false);
    setSkillPickerOpen(false);
    setSkillSuggestion('');
    voice.start();
  }

  useLayoutEffect(() => {
    const content = planOpen ? questionContentRef.current : inputContentRef.current;
    if (!content) return;
    const measure = () => setCardHeight(content.offsetHeight + 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [planOpen]);

  useEffect(() => {
    if (!draftToInsert || !editableRef.current) return;
    const el = editableRef.current;
    el.textContent = draftToInsert.text;
    setIsEmpty(!draftToInsert.text.trim());
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [draftToInsert]);

  const updateCursor = useCallback(() => {
    const el = editableRef.current;
    const selection = window.getSelection();
    if (!el || document.activeElement !== el || !selection?.isCollapsed || !selection.rangeCount) {
      setCursorPosition(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (!el.contains(range.startContainer)) {
      setCursorPosition(null);
      return;
    }
    let rect = range.getBoundingClientRect();
    // End-of-line and chip boundaries can return an empty caret rectangle.
    // Measure the preceding character/element without changing the editable DOM.
    if (!rect.height && range.startOffset > 0) {
      const preceding = range.cloneRange();
      preceding.setStart(range.startContainer, range.startOffset - 1);
      const previousRect = preceding.getBoundingClientRect();
      rect = { left: previousRect.right, top: previousRect.top, height: previousRect.height };
    }
    const container = el.getBoundingClientRect();
    const remaining = document.createRange();
    remaining.selectNodeContents(el);
    remaining.setStart(range.endContainer, range.endOffset);
    const next = {
      left: rect.height ? rect.left - container.left : 0,
      top: rect.height ? rect.top - container.top : 0,
      height: rect.height || 18,
      atEnd: remaining.toString().length === 0,
    };
    setCursorPosition(prev => prev?.left === next.left && prev?.top === next.top && prev?.height === next.height && prev?.atEnd === next.atEnd ? prev : next);
  }, []);

  useEffect(() => {
    let frame;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateCursor);
    };
    const el = editableRef.current;
    document.addEventListener('selectionchange', schedule);
    el?.addEventListener('input', schedule);
    el?.addEventListener('scroll', schedule);
    const observer = new ResizeObserver(schedule);
    if (el) observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('selectionchange', schedule);
      el?.removeEventListener('input', schedule);
      el?.removeEventListener('scroll', schedule);
      observer.disconnect();
    };
  }, [updateCursor]);

  const notifyChatReset = useEffectEvent(() => {
    onMentionsChange?.([]);
    return disableAutoFocus;
  });

  // Reset on chat switch: clear content, close picker, re-focus.
  useLayoutEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    el.innerHTML = '';
    setExitingSuggestions(null);
    setSendConfirmation(null);
    setIsEmpty(true);
    setPickerOpen(false);
    setPickerQuery('');
    setSkillPickerOpen(false);
    setSkillPickerQuery('');
    atStartRef.current = null;
    slashStartRef.current = null;
    const skipFocus = notifyChatReset();
    // Small delay so focus lands after any panel transition.
    if (!skipFocus) {
      const id = setTimeout(() => el.focus({ preventScroll: true }), 80);
      return () => clearTimeout(id);
    }
  }, [chatId]);

  function updateIsEmpty() {
    const el = editableRef.current;
    if (!el) return;
    const hasText = el.innerText.trim().length > 0;
    const hasChip = el.querySelector('.mention-chip') !== null;
    setIsEmpty(!hasText && !hasChip);
  }

  function updateMentions() {
    const el = editableRef.current;
    if (!onMentionsChange) return;
    const chips = el ? [...el.querySelectorAll('[data-mention-tab-id]')] : [];
    onMentionsChange(chips.map((c) => c.dataset.mentionTabId));
  }

  function handlePickerPreview(tabId) {
    pickerPreviewIdRef.current = tabId;
    if (!onMentionsChange) return;
    const el = editableRef.current;
    const chips = el ? [...el.querySelectorAll('[data-mention-tab-id]')].map((c) => c.dataset.mentionTabId) : [];
    onMentionsChange(tabId ? [...chips, tabId] : chips);
  }

  function insertMentionChip(tabId, label) {
    const el = editableRef.current;
    if (!el) return;

    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);

    // Delete "@" + any query text the user typed (e.g. "@risk").
    // atStartRef records where @ was inserted; if it's still the same text node
    // and before the current caret, delete from there to here.
    const atStart = atStartRef.current;
    if (
      atStart &&
      range.startContainer === atStart.node &&
      range.startOffset >= atStart.offset
    ) {
      range.setStart(atStart.node, atStart.offset);
      range.deleteContents();
    } else if (range.startOffset > 0) {
      // Fallback: just delete the @ character immediately before the caret.
      range.setStart(range.startContainer, range.startOffset - 1);
      range.deleteContents();
    }
    atStartRef.current = null;

    // Build the chip span.
    const chip = document.createElement('span');
    chip.contentEditable = 'false';
    chip.dataset.mentionTabId = tabId;
    chip.className = 'mention-chip';
    chip.dataset.mentionLabel = label;
    if (mentionVariant === 'chip') {
      const iconSvg = getTabIconSvgHtml(tabId);
      chip.innerHTML = `${iconSvg}<span class="mention-chip__label">${label}</span>`;
    } else {
      chip.textContent = `@${label}`;
    }

    // Insert a trailing space so the caret has somewhere to land after the chip.
    const space = document.createTextNode(' ');
    range.insertNode(space);
    range.insertNode(chip);

    // Move caret to just after the trailing space.
    const after = document.createRange();
    after.setStartAfter(space);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);

    setPickerOpen(false);
    updateIsEmpty();
    updateMentions();
    // The selectionchange from programmatic caret placement can fire before the
    // DOM has fully reflowed, producing a zero rect. Re-measure one frame later.
  }

  function insertSkillChip(skillId) {
    const el = editableRef.current;
    if (!el) return;

    // Clear the slash text from the input
    const slashStart = slashStartRef.current;
    if (slashStart) {
      el.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (
          slashStart.node &&
          range.startContainer === slashStart.node &&
          range.startOffset >= slashStart.offset
        ) {
          range.setStart(slashStart.node, slashStart.offset);
          range.deleteContents();
        }
      }
    }
    slashStartRef.current = null;
    setSkillPickerOpen(false);
    setSkillPickerQuery('');
    updateIsEmpty();

    if (skillId === 'voice') startVoice();
    else onSlashCommand?.(skillId);
  }

  function handleSkillActiveChange(name) {
    setSkillSuggestion(name);
  }

  function insertCmdLChip(ref) {
    const el = editableRef.current;
    if (!el) return;

    el.focus();
    const sel = window.getSelection();

    // Move caret to end of content so the chip appends after existing text/chips.
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    if (sel) { sel.removeAllRanges(); sel.addRange(range); }

    // Build inline text mention — same visual as @mention chips (text-only, secondary color).
    const chip = document.createElement('span');
    chip.contentEditable = 'false';
    chip.className = 'mention-chip';

    if (ref.type === 'element') {
      const label = `${ref.artifactLabel} · ${ref.value}`;
      chip.dataset.mentionTabId = ref.tabId ?? '';
      chip.dataset.mentionLabel = label;
      chip.textContent = `@${label}`;
    } else {
      // artifact-level reference
      chip.dataset.mentionTabId = ref.tabId ?? '';
      chip.dataset.mentionLabel = ref.artifactLabel ?? '';
      chip.textContent = `@${ref.artifactLabel ?? ''}`;
    }

    const space = document.createTextNode(' ');
    const curRange = sel?.rangeCount > 0 ? sel.getRangeAt(0) : range;
    curRange.insertNode(space);
    curRange.insertNode(chip);

    const after = document.createRange();
    after.setStartAfter(space);
    after.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(after);

    updateIsEmpty();
    updateMentions();
  }

  useEffect(() => {
    if (!cmdLPendingChip) return;
    insertCmdLChip(cmdLPendingChip);
    onCmdLChipConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmdLPendingChip]);

  function handleInput() {
    setSendConfirmation(null);
    cancelSuggestionExit();
    const sel = window.getSelection();

    // @ was just pressed — open the artifact picker.
    if (atPressedRef.current) {
      atPressedRef.current = false;
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        setCaretRect(measureCaretRect(range, editableRef.current));
        atStartRef.current = { node: range.startContainer, offset: Math.max(0, range.startOffset - 1) };
        setPickerQuery('');
        setPickerOpen(true);
      }
    } else if (pickerOpen && sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const atStart = atStartRef.current;
      if (atStart && range.startContainer === atStart.node && range.startOffset >= atStart.offset) {
        const query = atStart.node.textContent.slice(atStart.offset + 1, range.startOffset);
        setPickerQuery(query);
        if (range.startOffset <= atStart.offset) {
          setPickerOpen(false);
          atStartRef.current = null;
        }
      } else {
        setPickerOpen(false);
        atStartRef.current = null;
      }
    }

    // / was just pressed — open the skill picker.
    if (slashPressedRef.current) {
      slashPressedRef.current = false;
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        setSkillCaretRect({ ...measureCaretRect(range, editableRef.current), fromSlash: true });
        slashStartRef.current = { node: range.startContainer, offset: Math.max(0, range.startOffset - 1) };
        setSkillPickerQuery('');
        setSkillPickerOpen(true);
      }
    } else if (skillPickerOpen && sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const slashStart = slashStartRef.current;
      if (slashStart && range.startContainer === slashStart.node && range.startOffset >= slashStart.offset) {
        const query = slashStart.node.textContent.slice(slashStart.offset + 1, range.startOffset);
        setSkillPickerQuery(query);
        setSkillCaretRect({ ...measureCaretRect(range, editableRef.current), fromSlash: true });
        if (range.startOffset <= slashStart.offset) {
          setSkillPickerOpen(false);
          slashStartRef.current = null;
        }
      } else {
        setSkillPickerOpen(false);
        slashStartRef.current = null;
      }
    }

    updateIsEmpty();
    updateMentions();
  }

  function handleKeyDown(e) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && e.repeat) { e.preventDefault(); return; }
    if (!pickerOpen && !skillMenuVisible && voice.handleKeyDown(e)) return;
    if (e.key === 'ArrowUp' && isEmpty) {
      e.preventDefault();
      e.stopPropagation(); // prevent this event from reaching the document nav listener
      onNavigateUp?.();
      return;
    }
    if (e.key === '@') {
      voice.stop();
      atPressedRef.current = true;
      return;
    }
    if (e.key === '/') {
      voice.stop();
      slashPressedRef.current = true;
      return;
    }

    // Enter submits after voice handling has had first refusal.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    // While listening, the first submit action ends dictation for review.
    if (voice.active) {
      voice.stop();
      return;
    }
    const el = editableRef.current;
    if (!el) return;

    const mentions = [];
    const segments = [];

    function collectSegment(node) {
      if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-composer-decoration')) {
        return;
      } else if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent.replace(/\u00a0/g, ' ');
        if (t) segments.push({ type: 'text', text: t });
      } else if (node.dataset?.mentionTabId) {
        const label = node.dataset.mentionLabel ?? '';
        mentions.push({ tabId: node.dataset.mentionTabId });
        segments.push({ type: 'mention', text: `@${label}` });
      } else if (node.dataset?.skillId) {
        segments.push({ type: 'skill', text: node.textContent });
      } else if (node.dataset?.cmdlType) {
        segments.push({ type: 'cmdl', text: node.textContent });
      } else if (node.nodeName === 'BR') {
        segments.push({ type: 'text', text: '\n' });
      } else {
        if ((node.nodeName === 'DIV' || node.nodeName === 'P') && segments.length > 0) {
          segments.push({ type: 'text', text: '\n' });
        }
        node.childNodes.forEach(collectSegment);
      }
    }
    el.childNodes.forEach(collectSegment);

    const text = segments.map((s) => s.text).join('').trim();
    if (!text && mentions.length === 0) return;

    // Trim leading/trailing whitespace from edge text segments only.
    const trimmedSegments = segments
      .map((s, i) => {
        if (s.type !== 'text') return s;
        const t = i === 0 ? s.text.trimStart() : i === segments.length - 1 ? s.text.trimEnd() : s.text;
        return { ...s, text: t };
      })
      .filter((s) => s.text.length > 0);

    setSendConfirmation({ chatId });
    onSubmit?.(text, mentions, trimmedSegments);

    if (preserveOnSubmit) {
      // Landing keeps the submitted prompt visible until the chat handoff.
      // The chatId reset clears it once the new conversation opens.
      setPickerOpen(false);
      setSkillPickerOpen(false);
      el.blur();
      return;
    }

    el.innerHTML = '';
    setIsEmpty(true);
    setPickerOpen(false);
    setSkillPickerOpen(false);
    onMentionsChange?.([]);
    el.focus();
  }

  const contextTab = activeTabId ? CANVAS_TAB_DATA[activeTabId] : null;
  const contextLabel = contextTab?.label || activeTabId || 'Conversation';
  const usage = Math.max(0, Math.min(100, contextUsagePercent));
  const showViewingLabel = showVisionAndContext && visibleTabIds.length > 0;
  const showStop = working && isEmpty;
  const showSendConfirmation = sendConfirmed && !working && (isEmpty || preserveOnSubmit);

  return (
    <div
      ref={promptRowRef}
      className={`prompt-composer${isAnchored ? ' prompt-composer--anchored' : ''}${!showVisionAndContext ? ' prompt-composer--compact-footer' : ''}`}
    >
      <div className="prompt-composer__extension">
      {skillMenuVisible && !planOpen ? (
        <SkillPicker
          key={skillPickerQuery}
          isOpen={skillPickerOpen}
          items={matchingSkills}
          anchorRef={promptRowRef}
          onSelect={insertSkillChip}
          onActiveChange={handleSkillActiveChange}
          onClose={() => { setSkillPickerOpen(false); setSkillPickerQuery(''); slashStartRef.current = null; }}
        />
      ) : ((suggestions.length > 0 && isEmpty) || exitingSuggestions) && !planOpen ? (
        <div className="prompt-composer__suggestions" role="group" aria-label="Suggested next steps">
          {(exitingSuggestions ?? suggestions).map(suggestion => (
            <button
              key={suggestion.label}
              type="button"
              className="prompt-composer__suggestion-pill"
              onMouseDown={event => event.preventDefault()}
              onClick={event => selectSuggestion(event, suggestion)}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      ) : null}
      </div>
      <div className="prompt-composer__card" style={{ height: cardHeight ?? undefined }}>
        <div
          ref={inputContentRef}
          className={`prompt-composer__content${planOpen ? '' : ' is-active'}`}
          inert={planOpen}
          aria-hidden={planOpen}
        >
        <div className="prompt-composer__editor">
          <div
            id={inputId ?? generatedInputId}
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={placeholder}
            aria-multiline="true"
            data-voice-active={voice.active}
            className={`prompt-composer__input mention-input mention-input--${mentionVariant}`}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => { setIsFocused(true); updateCursor(); onInputFocus?.(); }}
            onBlur={() => { setIsFocused(false); setCursorPosition(null); }}
          />
          {isEmpty && !voice.active && (
            <span className="prompt-composer__placeholder" aria-hidden="true">
              <span className={`prompt-composer__placeholder-cursor${isFocused ? '' : ' is-idle'}`}>{placeholder.charAt(0)}</span>{placeholder.slice(1)}
            </span>
          )}
          {!isEmpty && !voice.active && isFocused && cursorPosition && (
            <span className="prompt-composer__cursor" style={cursorPosition} aria-hidden="true" />
          )}
          {voice.indicatorAnchor && createPortal(
            <VoiceIndicator />,
            voice.indicatorAnchor,
          )}
          {skillMenuVisible && skillCaretRect?.fromSlash && skillCompletion && isFocused && cursorPosition?.atEnd && (
            <span className="prompt-composer__suggestion" aria-hidden="true" style={{
              left: cursorPosition.left,
              top: cursorPosition.top,
              // The caret rect is the text box, not the full editor line box.
              // Match its height so the completion does not add line leading again.
              lineHeight: `${cursorPosition.height}px`,
              maxWidth: `calc(100% - ${cursorPosition.left}px)`,
            }}>
              {skillCompletion}
            </span>
          )}
        </div>
        <div className="prompt-composer__actions">
          <div className="prompt-composer__tools">
          <button
            type="button"
            className="prompt-composer__plus"
            aria-label="Add a skill or command"
            aria-haspopup="listbox"
            aria-expanded={skillMenuVisible}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => {
              voice.stop();
              const el = editableRef.current;
              if (!el) return;
              el.focus();
              setPickerOpen(false);
              setSkillPickerQuery('');
              slashStartRef.current = null;
              setSkillCaretRect(el.getBoundingClientRect());
              setSkillPickerOpen(!skillPickerOpen);
            }}
          >
            <PlusIcon size={10} />
          </button>
          <button
            type="button"
            className="prompt-composer__voice"
            aria-label={voice.active ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={voice.active}
            title={voice.active ? 'Stop voice input (Enter)' : 'Start voice input (or hold Space while typing)'}
            onMouseDown={event => event.preventDefault()}
            onClick={() => { if (voice.active) voice.stop(); else startVoice(); }}
          >
            {voice.active ? <StopVoiceIcon /> : <MicrophoneIcon />}
          </button>
          </div>
          <button
            type="button"
            className={`prompt-composer__send${showSendConfirmation ? ' is-confirmed' : ''}`}
            aria-label={showStop ? 'Stop response' : showSendConfirmation ? 'Message sent' : 'Send message'}
            onAnimationEnd={event => {
              if (event.animationName === 'composer-send-confirm') onSubmissionConfirmed?.();
            }}
            disabled={!showStop && (isEmpty || showSendConfirmation)}
            onMouseDown={event => event.preventDefault()}
            onClick={showStop ? () => {
              setSendConfirmation(null);
              onCancel?.();
            } : handleSubmit}
          >
            {showStop ? <StopVoiceIcon /> : <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d={showSendConfirmation ? 'M3.5 8 6.5 11 12.5 5' : 'M8 13V3M3.5 7.5 8 3l4.5 4.5'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>}
          </button>
        </div>
        </div>
        {planOpen && (
          <div ref={questionContentRef} className="prompt-composer__question">
            <AskQuestion
              embedded
              title="What should the plan focus on?"
              subtitle="Choose a starting point or describe what you have in mind."
              options={['Investigate the biggest issues', 'Identify opportunities to improve']}
              autoFocus
              scopedKeyboard
              onSelect={onPlanSelect}
              onCancel={onPlanCancel}
            />
          </div>
        )}
      </div>
      <span className="sr-only" role="status">
        {voice.status === 'starting' ? 'Starting voice. Allow microphone access if prompted.' : voice.active ? 'Listening. Press Enter or click the stop button to stop.' : ''}
      </span>
      {voice.error && <p className="prompt-composer__voice-error" role="alert">{voice.error}</p>}
      {(!hideEmptyFooter || planOpen || showVisionAndContext) && <div className="prompt-composer__footer">
        {planOpen ? (
          <span className="prompt-composer__instructions">↑/↓ to navigate · Enter to confirm · Esc to cancel</span>
        ) : showVisionAndContext ? (
        <span
          className={`prompt-composer__context${showViewingLabel ? '' : ' is-hidden'}`}
          title={showViewingLabel ? `Console is viewing ${contextLabel}` : undefined}
          aria-hidden={!showViewingLabel}
        >
          <span className="prompt-composer__context-prefix">Viewing</span>
          <span className="prompt-composer__context-artifact">
            {contextTab && <span className="prompt-composer__context-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: getTabIconSvgHtml(activeTabId) }} />}
            <span className="prompt-composer__context-name">{contextLabel}</span>
          </span>
        </span>
        ) : null}
        {showVisionAndContext && <ContextUsage usage={usage} />}
      </div>}

      <ArtifactPicker
        isOpen={pickerOpen}
        caretLeft={caretRect?.left ?? null}
        caretTop={caretRect?.top ?? null}
        caretBottom={caretRect?.bottom ?? null}
        anchorRef={editableRef}
        tabIds={artifactIds}
        query={pickerQuery}
        onSelect={insertMentionChip}
        onPreviewChange={handlePickerPreview}
        onClose={() => { setPickerOpen(false); setPickerQuery(''); atStartRef.current = null; handlePickerPreview(null); }}
      />
    </div>
  );
}

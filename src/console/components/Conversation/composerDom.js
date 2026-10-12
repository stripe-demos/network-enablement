// Return an insertion point inside the final text block, before any trailing
// editor placeholder <br>. Decorations are UI, never part of the draft.
export function draftEndRange(editor) {
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  let parent = editor;
  while (parent) {
    let last = parent.lastChild;
    // Range.insertNode splits the last text node when adding the voice UI,
    // leaving an empty text sibling after it. That sibling is logically at
    // the end but has no caret rectangle, so the custom cursor falls back to
    // the start. Anchor in the final real text node instead.
    while (last && (
      (last.nodeType === Node.TEXT_NODE && last.textContent.length === 0) ||
      (last.nodeType === Node.ELEMENT_NODE && last.hasAttribute('data-composer-decoration'))
    )) last = last.previousSibling;
    if (!last) {
      range.setStart(parent, 0);
      break;
    }
    if (last.nodeType === Node.TEXT_NODE) {
      range.setStart(last, last.textContent.length);
      break;
    }
    if (last.nodeName === 'BR') {
      range.setStartBefore(last);
      break;
    }
    if (last.nodeType !== Node.ELEMENT_NODE || last.contentEditable === 'false') {
      range.setStartAfter(last);
      break;
    }
    parent = last;
  }
  range.collapse(true);
  return range;
}

export function placeCaretAtEnd(editor) {
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(draftEndRange(editor));
}

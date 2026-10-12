import { useLayoutEffect } from 'react';

// Adapted from the source comparison follower for our sticky composer and
// non-overflowing layout. User inspection pauses following until the bottom.
export function useConversationFollow({ areaRef, listRef, dockRef, chatId, turnCount }) {
  useLayoutEffect(() => {
    const area = areaRef.current;
    const list = listRef.current;
    const dock = dockRef.current;
    if (!area || !list) return;
    let following = true;
    let inspectingHistory = false;
    let touchY;
    let userScrollUntil = 0;
    const follow = () => {
      const overflowing = list.scrollHeight + (dock?.offsetHeight ?? 0) > area.clientHeight + 4;
      if (!following || inspectingHistory || !overflowing || turnCount === 0) return;
      area.scrollTop = Math.max(0, area.scrollHeight - area.clientHeight);
    };
    const onScroll = () => {
      // Replacing Thinking with a task can briefly shrink the scroll range.
      // That browser clamp isn't a request to stop following. Only an upward
      // user gesture or opening history pauses us; reaching bottom resumes.
      if ((!inspectingHistory || performance.now() < userScrollUntil)
        && area.scrollHeight - area.clientHeight - area.scrollTop < 2) {
        following = true;
        inspectingHistory = false;
      }
    };
    const onWheel = event => {
      userScrollUntil = performance.now() + 500;
      if (event.deltaY < 0) following = false;
      else if (event.deltaY > 0) onScroll();
    };
    const onTouchStart = event => { touchY = event.touches[0]?.clientY; };
    const onTouchMove = event => {
      userScrollUntil = performance.now() + 500;
      const next = event.touches[0]?.clientY;
      if (next > touchY) following = false;
      touchY = next;
    };
    const onInspect = event => {
      if (event.type === 'keydown' && !event.target.closest('input, textarea, [contenteditable="true"]')
        && ['ArrowDown', 'PageDown', 'End'].includes(event.key)) userScrollUntil = performance.now() + 500;
      if (event.type === 'keydown' && !event.target.closest('input, textarea, [contenteditable="true"]')
        && ['ArrowUp', 'PageUp', 'Home'].includes(event.key)) following = false;
      if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
      if (event.target.closest('[aria-expanded][aria-controls], .task-module .task-header')) {
        following = false;
        inspectingHistory = true;
        userScrollUntil = 0;
      }
    };
    const observer = new ResizeObserver(follow);
    observer.observe(list);
    observer.observe(area);
    if (dock) observer.observe(dock);
    area.addEventListener('scroll', onScroll, { passive: true });
    area.addEventListener('wheel', onWheel, { passive: true });
    area.addEventListener('touchstart', onTouchStart, { passive: true });
    area.addEventListener('touchmove', onTouchMove, { passive: true });
    area.addEventListener('click', onInspect, true);
    area.addEventListener('keydown', onInspect, true);
    follow();
    return () => {
      observer.disconnect();
      area.removeEventListener('scroll', onScroll);
      area.removeEventListener('wheel', onWheel);
      area.removeEventListener('touchstart', onTouchStart);
      area.removeEventListener('touchmove', onTouchMove);
      area.removeEventListener('click', onInspect, true);
      area.removeEventListener('keydown', onInspect, true);
    };
  }, [areaRef, listRef, dockRef, chatId, turnCount]);
}

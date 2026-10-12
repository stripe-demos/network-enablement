import { useEffect, useRef, useState } from 'react';
import { ALL_SKILLS } from '../../data/skills';

const ROW_H = 32;

export function SkillPicker({ isOpen, anchorRef, items = ALL_SKILLS, onSelect, onClose, onActiveChange }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const menuRef = useRef(null);

  const navItems = items;

  useEffect(() => {
    if (!isOpen) return;
    const skill = navItems[activeIdx];
    onActiveChange?.(skill ? skill.name.toLowerCase() : '');
  }, [activeIdx, isOpen, navItems, onActiveChange]);

  useEffect(() => {
    if (!isOpen || navItems.length === 0) return;
    function onKeyDown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setActiveIdx((i) => Math.min(i + 1, navItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const skill = navItems[activeIdx];
        if (skill) onSelect(skill.id, skill.name);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, activeIdx, navItems, onSelect, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(event) {
      if (menuRef.current?.contains(event.target) || anchorRef?.current?.contains(event.target)) return;
      onClose();
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen, anchorRef, onClose]);

  // Keep the slash query alive in the editor so Backspace can reveal matches,
  // but hide the popup and release keyboard handling while no commands match.
  if (!isOpen || navItems.length === 0) return null;

  return <SkillMenu
    menuRef={menuRef}
    items={navItems}
    activeIdx={activeIdx}
    onActiveChange={setActiveIdx}
    onSelect={onSelect}
  />;
}

// Shared menu surface for the live picker and the Design System reference.
// Keyboard handling and dismissal belong to SkillPicker, not the static sample.
export function SkillMenu({ menuRef, items = ALL_SKILLS, activeIdx = 0, onActiveChange, onSelect }) {
  function renderRow(skill, flatIndex) {
    const isActive = flatIndex === activeIdx;
    return (
      <div
        key={skill.id}
        role="option"
        aria-selected={isActive}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 8px',
          height: ROW_H,
          background: isActive ? 'var(--color-surface-2)' : 'transparent',
          borderRadius: 6,
          cursor: 'pointer',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        onMouseEnter={() => onActiveChange?.(flatIndex)}
        onMouseDown={(e) => {
          e.preventDefault();
          onSelect?.(skill.id, skill.name);
        }}
      >
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, width: '100%' }}>
          <span style={{ fontSize: 13, fontWeight: 500, lineHeight: '20px', color: 'var(--color-text-primary)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {skill.name}
          </span>
          <span style={{ fontSize: 13, fontWeight: 400, lineHeight: '20px', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '1 0 0' }}>
            {skill.description}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="skill-picker-menu skill-picker-menu--inline" role="listbox" aria-label="Commands">
      <div className="skill-picker-menu__items">
        {items.map((skill, i) => renderRow(skill, i))}
      </div>
    </div>
  );
}

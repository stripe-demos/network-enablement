import React from 'react';

/**
 * 40x40 leading mark on a list row: a brand logo where one exists, otherwise
 * initials on a panel fill. Radius 8 (rounded-card), per 429:226230.
 *
 * `tone="deep"` for a mark sitting on a panel-filled row, where the default fill
 * is the same colour as the row and the tile vanishes (SendDialog.tsx:541).
 */
export default function Avatar({
  name,
  initials,
  logo,
  size = 40,
  tone = 'default',
}) {
  const box = { width: size, height: size };

  if (logo) {
    // The logo fills the box — no panel tile behind it. Brand artwork carries its
    // own background (the OpenAI mark is a black square), so a tile just inset it
    // inside a second, lighter square.
    return (
      <span style={box} className="block shrink-0 overflow-hidden rounded-card">
        <img
          src={logo}
          alt=""
          style={box}
          className="block h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      style={box}
      className={`text-sail-label-medium-emphasized flex shrink-0 items-center justify-center rounded-card text-ink ${
        tone === 'deep' ? 'bg-panel-deep' : 'bg-panel'
      }`}
      aria-hidden="true"
    >
      {initials ?? name?.slice(0, 1).toUpperCase()}
    </span>
  );
}

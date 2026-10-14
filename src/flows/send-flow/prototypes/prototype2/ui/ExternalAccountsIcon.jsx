import React from 'react';

/**
 * The mark on the "Your external accounts" row — supplied artwork (Icons/Avatar.svg).
 *
 * A 40px rounded tile with a card-and-arrow glyph: money leaving Stripe for somewhere
 * outside it, which is exactly what the row opens.
 *
 * The tile is part of the artwork rather than a container this component sits in, so it
 * replaces the icon tile the row used to draw. Its two hard-coded colours are swapped for
 * the tokens they match — #ECF1F6 is `panel-deep` (the fill every mark takes when it sits
 * ON a panel) and #1A2C44 is `ink` — so the mark follows the theme instead of pinning two
 * greys into a component.
 */
export default function ExternalAccountsIcon({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={`block shrink-0 ${className}`.trim()}
    >
      <path
        d="M0 7.5C0 3.35786 3.35786 0 7.5 0H32.5C36.6421 0 40 3.35786 40 7.5V32.5C40 36.6421 36.6421 40 32.5 40H7.5C3.35786 40 0 36.6421 0 32.5V7.5Z"
        fill="var(--color-panel-deep)"
      />
      <g fill="var(--color-ink)" fillRule="evenodd" clipRule="evenodd">
        <path d="M15.3125 15.3125H20C20.5178 15.3125 20.9375 14.8928 20.9375 14.375C20.9375 13.8572 20.5178 13.4375 20 13.4375H15C14.1371 13.4375 13.4375 14.1371 13.4375 15V23.75C13.4375 24.6129 14.1371 25.3125 15 25.3125H28.125C28.9879 25.3125 29.6875 24.6129 29.6875 23.75V20C29.6875 19.4822 29.2678 19.0625 28.75 19.0625C28.2322 19.0625 27.8125 19.4822 27.8125 20V23.4375H15.3125V15.3125Z" />
        <path d="M20.625 18.75V20C20.625 20.5178 21.0447 20.9375 21.5625 20.9375C22.0803 20.9375 22.5 20.5178 22.5 20V18.75C22.5 18.2322 22.0803 17.8125 21.5625 17.8125C21.0447 17.8125 20.625 18.2322 20.625 18.75ZM19.0625 18.75V20C19.0625 21.3807 20.1818 22.5 21.5625 22.5C22.9432 22.5 24.0625 21.3807 24.0625 20V18.75C24.0625 17.3693 22.9432 16.25 21.5625 16.25C20.1818 16.25 19.0625 17.3693 19.0625 18.75Z" />
        <path d="M11.25 16.5625C11.7678 16.5625 12.1875 16.9822 12.1875 17.5V25.625C12.1875 26.1428 12.6072 26.5625 13.125 26.5625H25.625C26.1428 26.5625 26.5625 26.9822 26.5625 27.5C26.5625 28.0178 26.1428 28.4375 25.625 28.4375H13.125C11.5717 28.4375 10.3125 27.1783 10.3125 25.625V17.5C10.3125 16.9822 10.7322 16.5625 11.25 16.5625Z" />
        <path d="M24.3812 15.6188C24.0395 15.2771 24.0395 14.723 24.3812 14.3813L26.6376 12.125L24.3748 12.125C23.8916 12.125 23.4998 11.7332 23.4998 11.25C23.4999 10.7667 23.8916 10.375 24.3749 10.375L28.7501 10.3751C28.9822 10.3751 29.2047 10.4673 29.3688 10.6314C29.5329 10.7955 29.6251 11.018 29.6251 11.2501L29.6249 15.6251C29.6249 16.1084 29.2331 16.5001 28.7499 16.5001C28.2666 16.5001 27.8749 16.1083 27.8749 15.625L27.875 13.3625L25.6186 15.6188C25.2769 15.9605 24.7229 15.9605 24.3812 15.6188Z" />
      </g>
    </svg>
  );
}

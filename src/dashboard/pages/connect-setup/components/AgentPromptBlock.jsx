import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

/**
 * The generated prompt, in a fixed-height scrolling well with a gradient fade at
 * the bottom edge and a full-width copy strip beneath it.
 *
 * Deliberately not `sail/CodeBlock`: that one puts its action in a header strip
 * and renders line numbers, where this design has neither and adds the fade and
 * the agent logos.
 *
 * The whole footer strip is the copy button — the agent logos and the "Copy
 * prompt" label share it. Pass `agents` as `[{ src, alt }]` to show the logos.
 */
export default function AgentPromptBlock({ code = '', agents = [], onCopy, className = '' }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // motion: copy-confirm
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      onCopy?.(code);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable in insecure contexts — fail quietly rather than
      // leaving the button stuck in a pending state.
    }
  };

  return (
    <div
      className={`flex h-[280px] w-full flex-col overflow-hidden rounded-[6px] border border-hairline ${className}`}
    >
      <div className="relative min-h-0 flex-1">
        {/* `text-monospace-small` is 14/20, matching the design's Code/Medium. */}
        <pre className="h-full overflow-y-auto bg-neutral-25 p-3 text-monospace-small whitespace-pre-wrap text-subdued">
          {code}
        </pre>

        {/* Fade over the bottom edge of the scroll area, so the text dissolves
            into the copy strip rather than being cut mid-line. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[1px] bottom-0 h-10 bg-gradient-to-b from-transparent to-neutral-25"
        />
      </div>

      <button
        type="button"
        onClick={copy}
        className="flex w-full shrink-0 cursor-pointer items-center justify-center gap-[6px] border-t border-hairline bg-surface p-2 transition-colors hover:bg-offset focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(8,142,249,0.36)]"
      >
        {agents.length > 0 && (
          // Each logo SVG carries its own rounded-tile background.
          <span className="flex items-center gap-2">
            {agents.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                width={16}
                height={16}
                className="block size-4 shrink-0"
                draggable={false}
              />
            ))}
          </span>
        )}
        {copied && (
          <Icon name="check" size="xxsmall" fill="currentColor" className="text-icon-success" />
        )}
        <span className="text-label-medium-emphasized text-subdued" aria-live="polite">
          {copied ? 'Copied' : 'Copy integration prompt'}
        </span>
      </button>
    </div>
  );
}

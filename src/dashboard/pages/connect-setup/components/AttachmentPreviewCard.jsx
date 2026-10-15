import { Icon } from './Icon';

/**
 * A staged attachment inside the composer: a clipped preview of the file's
 * contents fading out under a white scrim, with the filename and type beneath.
 *
 * The preview well is narrower than the text inside it, which is what produces the
 * design's clipped-at-the-right-edge look — the text is deliberately not wrapped
 * to the well.
 */
export default function AttachmentPreviewCard({
  name,
  meta,
  preview,
  onRemove,
  className = '',
}) {
  return (
    <div
      className={`group relative w-[266px] shrink-0 rounded-[6px] border border-hairline p-2 ${className}`}
    >
      <div className="relative h-20 w-full overflow-hidden">
        <div className="absolute top-0 left-0 h-20 w-[260px] overflow-hidden rounded-[4px] bg-offset p-2.5">
          <p className="w-[652px] text-monospace-xsmall whitespace-pre-wrap text-default">
            {preview}
          </p>
        </div>
        {/* Scrim so the excerpt dissolves rather than being cut mid-line. */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 h-20 w-[260px] bg-gradient-to-b from-transparent to-[rgba(255,255,255,0.8)] backdrop-blur-[0.5px]"
        />
      </div>

      <div className="flex w-full flex-col">
        <p className="text-body-small-emphasized text-default">{name}</p>
        <p className="text-body-small text-neutral-500">{meta}</p>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded bg-surface text-icon-subdued opacity-0 transition-opacity hover:text-icon-default focus:opacity-100 group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[rgba(8,142,249,0.36)]"
        >
          <Icon name="cancel" size="xxsmall" fill="currentColor" />
        </button>
      )}
    </div>
  );
}

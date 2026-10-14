import React from 'react';

/**
 * The layout primitive every step sits in.
 *
 * Design reference: a 512px content column at x=368 inside the sheet — optically
 * centred, with the bottom 40-50% of the sheet often empty. Three layouts, one
 * primitive rather than three components:
 *
 *   'column'   512px column between equal spacers       (most steps)
 *   'split'    two panes, white left / panel right      (email compose only)
 *   'centered' centred content                          (success)
 *
 * There used to be a fourth, 'stepper', which filled the left spacer with the
 * add-recipient progress rail. The reference dialog's sub-flows carry no such
 * rail, so the spacer is now only ever a spacer.
 */
export default function ContentColumn({
  layout = 'column',
  gutter,
  heading,
  children,
}) {
  if (layout === 'split') {
    // 50/50 on 429:225139: form inset in the left half, the preview pane filling
    // the right half of the sheet flush to its edges.
    return (
      <div className="flex h-full">
        <div className="flex-1 overflow-y-auto pl-14 pr-8 pt-8 pb-8">
          <div className="w-full max-w-[512px]">
            {heading && <Heading>{heading}</Heading>}
            {children}
          </div>
        </div>
        {/* The preview sits on the brand gradient rather than the flat panel fill: the
            pane is a picture of an email arriving, not another region of the product.
            `bg-cover` with a centred position because the pane is portrait and the art
            is landscape — cover crops the sides rather than squashing the waves, and
            `bg-panel` still paints underneath while the image loads. */}
        <div
          className="flex w-1/2 shrink-0 items-center overflow-y-auto bg-panel bg-cover bg-center px-12"
          style={{ backgroundImage: 'url(/email-preview-bg.jpg)' }}
        >
          {gutter}
        </div>
      </div>
    );
  }

  if (layout === 'centered') {
    return (
      <div className="flex h-full items-center justify-center px-8">
        <div className="w-full max-w-[512px] text-center">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center pt-8 pb-16">
      {/* Equal 368px spacers either side keep the column optically centred at the
          x=368 the frames draw it at. */}
      <div className="w-[368px] shrink-0" aria-hidden="true" />
      <div className="w-[512px] shrink-0">
        {heading && <Heading>{heading}</Heading>}
        {children}
      </div>
      <div className="w-[368px] shrink-0" aria-hidden="true" />
    </div>
  );
}

function Heading({ children }) {
  return <h1 className="text-sail-heading-large mb-6 text-ink">{children}</h1>;
}

export function ConsoleLegalFooter() {
  return (
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.6,
            color: 'var(--color-text-tertiary)',
            // Don't intercept clicks — the panel below this footer
            // (and any nested controls) shouldn't get blocked just
            // because the footer happens to overlap them on a tall
            // canvas.
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          Use of Console subject to{' '}
          <span style={{ textDecoration: 'underline', pointerEvents: 'auto' }}>
            Console Terms
          </span>{' '}
          and{' '}
          <span style={{ textDecoration: 'underline', pointerEvents: 'auto' }}>
            Privacy Policy
          </span>
          .
        </div>
  );
}

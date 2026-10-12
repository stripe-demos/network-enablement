import { useLayoutEffect, useRef } from 'react';
import cubeSvg from '../../assets/rubiks-cube.svg?raw';

// Keep the injected SVG DOM intact when the surrounding task changes phase;
// replacing innerHTML would reset SMIL's active animation interval.
const cubeMarkup = { __html: cubeSvg };

export function RubiksCube({ playing, loop = false, onComplete }) {
  const ref = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useLayoutEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useLayoutEffect(() => {
    if (!playing) return;
    const animation = ref.current?.querySelector('animate');
    const handleEnd = () => onCompleteRef.current?.();
    animation?.addEventListener('endEvent', handleEnd);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (reducedMotion.matches) {
        animation?.endElement();
      } else {
        animation?.setAttribute('repeatCount', loop ? 'indefinite' : '1');
        animation?.beginElement();
      }
    };
    // Start after the SVG is mounted; also avoid a begin/end pair at time zero
    // when React StrictMode replays mount effects in development.
    const frame = requestAnimationFrame(sync);
    reducedMotion.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(frame);
      reducedMotion.removeEventListener('change', sync);
      animation?.removeEventListener('endEvent', handleEnd);
      animation?.endElement();
    };
  }, [playing, loop]);

  return <span
    ref={ref}
    className="new-conversation-cube"
    aria-hidden="true"
    dangerouslySetInnerHTML={cubeMarkup}
  />;
}

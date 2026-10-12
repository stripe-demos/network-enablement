/** @param {SVGSVGElement} svg */
export function clientPointToSvg(svg, clientX, clientY) {
  const p = svg.createSVGPoint();
  p.x = clientX;
  p.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  return p.matrixTransform(ctm.inverse());
}

/** @param {SVGSVGElement} svg @param {HTMLElement} wrap */
export function svgUserToWrapOffset(svg, wrap, ux, uy) {
  const p = svg.createSVGPoint();
  p.x = ux;
  p.y = uy;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { left: 0, top: 0 };
  const screen = p.matrixTransform(ctm);
  const wr = wrap.getBoundingClientRect();
  return { left: screen.x - wr.left, top: screen.y - wr.top };
}

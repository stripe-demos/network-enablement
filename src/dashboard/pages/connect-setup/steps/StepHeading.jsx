/**
 * The step's "Header lockup" — a bold lead clause followed by a subdued
 * continuation on the same line.
 *
 * Both are 20/28 (`Heading/Medium` in the design); only the weight differs, which
 * is why this uses the heading pair rather than mixing heading and body utilities.
 * This has to outrank the 16/24 section titles inside a step, or the page reads as
 * one flat level.
 */
export default function StepHeading({ lead, rest, className = '' }) {
  return (
    <h2 className={`text-heading-medium text-default ${className}`}>
      {lead}
      {rest ? <span className="text-heading-medium-subdued text-subdued"> {rest}</span> : null}
    </h2>
  );
}

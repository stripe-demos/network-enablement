export const STREAM_CHARACTERS_PER_SECOND = 200;
export function createTextStream(text) {
  let end = 0;
  const chunks = Array.from(text).map((character, index) => {
    end += character.length;
    return { at: (index + 1) * 1000 / STREAM_CHARACTERS_PER_SECOND, end };
  });
  return { text, chunks, duration: chunks.at(-1)?.at ?? 0 };
}

export function getStreamedText(stream, elapsed) {
  const visible = stream.chunks.findLast(chunk => chunk.at <= elapsed);
  return stream.text.slice(0, visible?.end ?? 0);
}
// Stream during the message entrance without an artificial first-word pause.
export function getPresentedText(stream, elapsed) {
  return getStreamedText(stream, elapsed);
}

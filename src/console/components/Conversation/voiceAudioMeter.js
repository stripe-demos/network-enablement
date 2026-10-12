// Independent of transcription: reads microphone volume locally and drives the
// existing bars. A production voice client can supply its existing MediaStream.
export function startVoiceAudioMeter(anchor, existingStream) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || (!existingStream && !navigator.mediaDevices?.getUserMedia)) return () => {};

  let stopped = false;
  let context;
  let stream;
  let source;
  let frame;
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(frame);
    source?.disconnect();
    if (!existingStream) stream?.getTracks().forEach(track => track.stop());
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  };

  try {
    // Create/resume during the user's gesture, before awaiting permission.
    context = new AudioContext();
    void context.resume().catch(stop);
    const input = existingStream
      ? Promise.resolve(existingStream)
      : navigator.mediaDevices.getUserMedia({ audio: true });
    void input.then(inputStream => {
      stream = inputStream;
      if (stopped) {
        if (!existingStream) stream.getTracks().forEach(track => track.stop());
        return;
      }
      source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser); // Never connect to speakers (no feedback).
      const samples = new Float32Array(analyser.fftSize);
      const history = Array(10).fill(0);
      let level = 0;
      let previous = 0;
      function update(now) {
        if (stopped) return;
        // 30Hz is enough for smooth bars, without rerendering the composer.
        if (now - previous >= 32) {
          previous = now;
          analyser.getFloatTimeDomainData(samples);
          const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
          const target = Math.min(1, Math.max(0, rms - 0.008) * 12);
          level += (target - level) * (target > level ? 0.65 : 0.25);
          history.unshift(level);
          history.pop();
          anchor.querySelectorAll('.composer-voice-bars > span').forEach((bar, index) => {
            bar.style.setProperty('--voice-scale', String(0.2 + history[index] * 0.8));
          });
        }
        frame = requestAnimationFrame(update);
      }
      frame = requestAnimationFrame(update);
    }).catch(stop); // If metering is unavailable, transcription can continue.
  } catch {
    stop();
  }
  return stop;
}

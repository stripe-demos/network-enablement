import { useEffect, useRef, useState } from 'react';
import { CHECKS, MIN_LENGTH, evaluateChecks } from '../data/promptStrength';
import { DESCRIPTION_TRAITS, currentHighlights, segmentDescription } from '../data/descriptionInsights';

const EMPTY_CHECKS = CHECKS.map((check) => ({ ...check, satisfied: false }));
const DEBOUNCE_MS = 160;
// The server gives the classifier 8s; allow a little more for the round trip.
const TIMEOUT_MS = 10000;

// The offline stand-in for /api/analyze-description, shaped like its response:
// checks from the keyword heuristic, and a highlight on every clause where a
// trait's reading matches. No `confidence`, so the tooltip rates these by
// explicitness alone.
function analyzeLocally(description) {
  const highlights = segmentDescription(description).flatMap(({ start, end, text }) => {
    const traits = Object.keys(DESCRIPTION_TRAITS).filter((id) =>
      DESCRIPTION_TRAITS[id].readings.some(({ test }) => test.test(text))
    );
    return traits.length ? [{ start, end, traits }] : [];
  });
  return { description, highlights, checks: evaluateChecks(description) };
}

export default function useDescriptionAnalysis(description, enabled) {
  const [result, setResult] = useState(null);
  const [request, setRequest] = useState({ description: '', status: 'idle', error: null });
  const [retryCount, setRetryCount] = useState(0);
  const cache = useRef(new Map());
  // Set once the endpoint reports it has no key (503), so later edits analyse
  // locally straight away instead of waiting on a request that can't succeed.
  const liveUnavailable = useRef(false);
  const eligible = description.trim().length >= MIN_LENGTH;

  useEffect(() => {
    if (!enabled || !eligible) return;
    let cancelled = false;
    const controller = new AbortController();
    let timeout;
    // A failed live analysis falls back to the local one rather than an error,
    // so Continue still works offline. Local results aren't cached, so the next
    // edit tries the live endpoint again.
    const fallBackToLocal = () => {
      setResult(analyzeLocally(description));
      setRequest({ description, status: 'ready', error: null });
    };
    const timer = setTimeout(async () => {
      const cached = cache.current.get(description);
      if (cached) {
        setResult(cached);
        setRequest({ description, status: 'ready', error: null });
        return;
      }
      if (liveUnavailable.current) {
        fallBackToLocal();
        return;
      }
      setRequest({ description, status: 'checking', error: null });
      timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch('/api/analyze-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description }),
          signal: controller.signal,
        });
        if (response.status === 503) liveUnavailable.current = true;
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Live highlighting is unavailable.');
        if (data.description !== description || !Array.isArray(data.highlights) || !Array.isArray(data.checks)) {
          throw new Error('Live highlighting returned an incomplete result.');
        }
        if (cancelled) return;
        cache.current.set(description, data);
        if (cache.current.size > 20) cache.current.delete(cache.current.keys().next().value);
        setResult(data);
        setRequest({ description, status: 'ready', error: null });
      } catch {
        if (cancelled) return;
        fallBackToLocal();
      } finally {
        clearTimeout(timeout);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [description, enabled, eligible, retryCount]);

  const current = result?.description === description;
  const status = !eligible || !enabled ? 'idle'
    : request.description === description ? request.status : 'checking';
  return {
    highlights: eligible && status !== 'error' ? currentHighlights(result, description) : [],
    checks: current && eligible ? result.checks : EMPTY_CHECKS,
    status,
    // Failures fall back to the local analysis, so there is no error to show;
    // kept so the composer's retry UI still has a shape to read.
    error: status === 'error' ? request.error : null,
    retry: () => {
      liveUnavailable.current = false;
      setRetryCount((count) => count + 1);
    },
  };
}

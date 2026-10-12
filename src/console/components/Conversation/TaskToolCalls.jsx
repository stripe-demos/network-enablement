import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { TaskSubtitleArrow } from '../icons';

const ROW_HEIGHT = 22;
const MAX_VISIBLE_CALLS = 4;

// Absolute rows move through a clipped four-row viewport. Stable call IDs let
// existing rows slide up while the oldest exits and a new row enters below.
export function TaskToolCalls({ calls, complete }) {
  const reducedMotion = useReducedMotion();
  const rows = complete
    ? [{ id: 'summary', label: `Used ${calls.length} ${calls.length === 1 ? 'tool' : 'tools'}` }]
    : calls.slice(-MAX_VISIBLE_CALLS);
  const transition = { duration: reducedMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] };

  return (
    <>
      <motion.div className="task-tool-calls" data-complete={complete || undefined}
        aria-hidden="true" initial={false}
        animate={{ height: rows.length * ROW_HEIGHT }} transition={transition}>
        <AnimatePresence initial={false}>
          {rows.map((call, index) => (
            <motion.div key={call.id} className="task-subtitle task-tool-call" data-call-id={call.id}
              initial={{ opacity: 0, y: (index + 1) * ROW_HEIGHT }}
              animate={{ opacity: 1, y: index * ROW_HEIGHT }}
              exit={{ opacity: 0, y: -ROW_HEIGHT }} transition={transition}>
              <TaskSubtitleArrow /><span title={call.label}>{call.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <span className="sr-only" role="status">{rows.at(-1)?.label}</span>
    </>
  );
}

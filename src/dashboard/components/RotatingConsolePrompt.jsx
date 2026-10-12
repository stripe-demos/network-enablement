import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export default function RotatingConsolePrompt({ prompts }) {
  const [index, setIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    let timer
    const schedule = () => {
      clearInterval(timer)
      if (!document.hidden) {
        timer = setInterval(() => setIndex((current) => (current + 1) % prompts.length), 2000)
      }
    }
    schedule()
    document.addEventListener('visibilitychange', schedule)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [reduceMotion, prompts.length])

  return (
    <span className="console-prompt-rotation" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'tween', duration: reduceMotion ? 0 : 0.3, ease: [0.42, 0, 0.58, 1] }}
        >
          {prompts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

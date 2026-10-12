import { Routes, Route, Navigate } from 'react-router-dom'
import ConsoleApp from './console/ConsoleApp.jsx'

export default function App({ initialSubmission }) {
  return (
    <Routes>
      <Route path="/" element={<ConsoleApp initialSubmission={initialSubmission} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

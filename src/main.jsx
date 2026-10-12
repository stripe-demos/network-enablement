import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './console/contexts/ThemeContext'
import './index.css'
import App from './App.jsx'
import { consumeConsoleHandoff } from './integration/consoleHandoff'
import PrototypeSettings from './prototype-settings/PrototypeSettings'
import { CONSOLE_PROTOTYPE_SETTINGS } from './console/prototypeSettingsConfig'

const initialSubmission = consumeConsoleHandoff(window.history)

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/console">
    <ThemeProvider>
      <App initialSubmission={initialSubmission} />
      <PrototypeSettings {...CONSOLE_PROTOTYPE_SETTINGS} />
    </ThemeProvider>
  </BrowserRouter>,
)

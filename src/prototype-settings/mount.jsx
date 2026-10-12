import { createRoot } from 'react-dom/client';
import PrototypeSettings from './PrototypeSettings';

/**
 * Mounts the prototype settings on its own React root, for pages that don't
 * render `<PrototypeSettings />` inside their own app (e.g. an extra HTML
 * entry point that should keep importing only its own code). Takes the same
 * props as the component.
 */
export function mountPrototypeSettings(props = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  createRoot(container).render(<PrototypeSettings {...props} />);
}

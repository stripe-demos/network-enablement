import './Conversation/futureTasks.css';
import { ChevronDownSmall } from './icons';

// Shared source/task affordance from the comparison prototype: right → down.
export function DisclosureChevron({ expanded }) {
  return <span className="disclosure-chevron" data-expanded={expanded} aria-hidden="true"><ChevronDownSmall size={8} /></span>;
}

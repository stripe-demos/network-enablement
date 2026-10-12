import { useState } from 'react';
import { CopyIcon, ExpandArrowIcon } from '../icons';

// Uses the same collapsed code callout and numbered SQL styles as live tasks.
export function TaskCodeBlock({ title, code, onOpen }) {
  const [copied, setCopied] = useState(false);
  return <div className="code-block code-block--peek" style={{ marginTop: 10 }}>
    <div className="code-header"><span>{title}</span><div className="code-actions">
      <button title={copied ? 'Copied' : 'Copy'} onClick={async () => {
        try { await navigator.clipboard.writeText(code); setCopied(true); } catch { setCopied(false); }
      }}><CopyIcon size={12} /></button>
      {onOpen && <button title="Open artifact" onClick={onOpen}><ExpandArrowIcon size={12} /></button>}
    </div></div>
    <div className="code-body">{code.split('\n').map((line, index) => <div key={index}><span className="ln">{index + 1}</span>{line.split(/(\b(?:SELECT|FROM|WHERE|AND|AS)\b)/g).map((part, i) => <span key={i} className={/^(SELECT|FROM|WHERE|AND|AS)$/.test(part) ? 'kw' : undefined}>{part}</span>)}</div>)}</div>
  </div>;
}

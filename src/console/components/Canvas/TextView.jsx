import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const RAW_CONTENT = `## When to use this skill
When the user asks why their taxes were zero, or different in general than what they would've expected
(e.g. "the taxes or tax rates are wrong"). This can also help when the user thinks they should or
shouldn't collect taxes in a given "location" (origin or destination) but when we did.

---

## A summary of how to calculate taxes using Stripe Tax
To be tax-compliant you need to:
1. Understand which locations require you to collect tax.
2. Register for tax in those locations.
3. Calculate and collect tax.
4. Report, file, and remit the tax you collected.

Stripe calculates tax on a transaction taking into account some or all of the following factors:
* The location of the seller
* The location of the customer
* The location where the activity is performed
* The type of products sold

> Each country handles tax on sold products and services differently, often calling it by a different
> name. In the US, businesses deal with sales tax. Throughout Europe, it's called value-added tax (VAT).
> Canada and most countries in the Asia Pacific region refer to it as goods and services tax (GST).

\`\`\`python
import stripe
stripe.api_key = "sk_live_..."
tax_settings = stripe.tax.Settings.retrieve()
tax_registration = stripe.tax.Registration.create(
    country="US",
)
\`\`\``;

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{renderInline(part.slice(2, -2))}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
    return part;
  });
}

/** Render a markdown string to React elements. Handles the subset used in these documents. */
function renderMarkdown(md) {
  const lines = md.split('\n');
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'code';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      elements.push(
        <div key={key++} className="md-code-block">
          {lang && <div className="md-code-block__lang">{lang}</div>}
          <pre>
            {codeLines.map((cl, ci) => (
              <div key={ci} className="md-code-block__line">
                <span className="md-code-block__ln">{String(ci + 1).padStart(2, '0')}</span>
                <code><PythonLine code={cl} /></code>
              </div>
            ))}
          </pre>
        </div>
      );
      continue;
    }

    // Headings
    const h2 = line.match(/^## (.+)/);
    if (h2) { elements.push(<h2 key={key++}>{h2[1]}</h2>); i++; continue; }
    const h1 = line.match(/^# (.+)/);
    if (h1) { elements.push(<h1 key={key++}>{h1[1]}</h1>); i++; continue; }

    // HR
    if (line.trim() === '---') { elements.push(<hr key={key++} />); i++; continue; }

    // Blockquote — collect consecutive > lines
    if (line.startsWith('> ')) {
      const bqLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        bqLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(<blockquote key={key++}><p>{renderInline(bqLines.join(' '))}</p></blockquote>);
      continue;
    }

    // Ordered list — collect consecutive `N. ` lines
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(<ol key={key++}>{items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}</ol>);
      continue;
    }

    // Unordered list — collect consecutive `* ` or `- ` lines
    if (/^[*-] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[*-] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(<ul key={key++}>{items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}</ul>);
      continue;
    }

    // Blank line — skip
    if (line.trim() === '') { i++; continue; }

    // Paragraph — collect non-special consecutive lines
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('```') &&
      !/^[*-] /.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      lines[i].trim() !== '---'
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      elements.push(<p key={key++}>{renderInline(paraLines.join(' '))}</p>);
    }
  }

  return elements;
}

/** Minimal Python syntax highlighter for the code block in rendered view. */
function PythonLine({ code }) {
  const tokens = [];
  let rest = code;
  while (rest.length > 0) {
    const strMatch = rest.match(/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
    if (strMatch) {
      tokens.push(<span key={tokens.length} className="syn-str">{strMatch[1]}</span>);
      rest = rest.slice(strMatch[1].length);
      continue;
    }
    const kwMatch = rest.match(/^(import)\b/);
    if (kwMatch) {
      tokens.push(<span key={tokens.length} className="syn-kw">{kwMatch[1]}</span>);
      rest = rest.slice(kwMatch[1].length);
      continue;
    }
    const objMatch = rest.match(/^(stripe)(\.[a-zA-Z_][a-zA-Z0-9_]*)+/);
    if (objMatch) {
      const full = objMatch[0];
      const parts = full.split('.');
      tokens.push(<span key={tokens.length} className="syn-obj">{parts[0]}</span>);
      for (let i = 1; i < parts.length; i++) {
        tokens.push(<span key={tokens.length} className="syn-plain">.</span>);
        tokens.push(<span key={tokens.length} className="syn-fn">{parts[i]}</span>);
      }
      rest = rest.slice(full.length);
      continue;
    }
    tokens.push(<span key={tokens.length} className="syn-plain">{rest[0]}</span>);
    rest = rest.slice(1);
  }
  return <>{tokens}</>;
}

export const TextView = forwardRef(function TextView({ headerViewMode, onDirtyChange, initialContent = RAW_CONTENT, guide = false }, ref) {
  const [content, setContent] = useState(initialContent);
  const savedRef = useRef(initialContent);
  const gutterRef = useRef(null);
  const bodyRef = useRef(null);

  useImperativeHandle(ref, () => ({
    save() {
      savedRef.current = content;
      onDirtyChange?.(false);
    },
  }), [content, onDirtyChange]);

  function handleChange(e) {
    const val = e.target.value;
    setContent(val);
    onDirtyChange?.(val !== savedRef.current);
  }

  function handleBodyScroll(e) {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  }

  const view = headerViewMode === 'preview' ? 'rendered' : 'code';
  const lines = content.split('\n');

  return (
    <>
      {view === 'code' ? (
        <div className="cv-editor-wrap">
          <div className="cv-editor-gutter" ref={gutterRef} aria-hidden="true">
            {lines.map((_, i) => (
              <div key={i} className="cv-editor-line-num">{String(i + 1).padStart(2, '0')}</div>
            ))}
          </div>
          <div ref={bodyRef} className="cv-editor-body" onScroll={handleBodyScroll}>
            <pre
              className="cv-editor-pre"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '\n' }}
            />
            <textarea
              className="cv-editor-textarea"
              value={content}
              onChange={handleChange}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
            />
          </div>
        </div>
      ) : (
        <>
          <div id="textRenderedView" className={`text-rendered-view${guide ? ' text-rendered-view--guide' : ''}`}>
            {renderMarkdown(content)}
          </div>
          <div style={{ height: 50, flexShrink: 0 }} />
        </>
      )}
    </>
  );
});

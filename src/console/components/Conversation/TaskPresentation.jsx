import { Children, isValidElement } from 'react';
import { useFutureTasks } from '../../variants/useFutureTasks';
import { TaskDisclosure } from './FutureTaskBlock';
import { PRESET_TASK_STEPS } from '../../data/presetTaskSteps';

function findClass(children, name) {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.props.className?.split(' ').includes(name)) return child;
    const found = findClass(child.props.children, name);
    if (found) return found;
  }
}

function textContent(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return isValidElement(node) ? Children.toArray(node.props.children).map(textContent).join('') : '';
}

function toolCalls(body) {
  return Children.toArray(body).filter(node => isValidElement(node) &&
    /(^| )code-(inline|block)( |$)/.test(node.props.className ?? '')).map(node => {
    const header = findClass(node.props.children, 'code-header');
    return { node, label: textContent(header ? Children.toArray(header.props.children)[0] : node).trim() };
  });
}

// Reuse the authored tool/SQL elements and their canvas handlers, but present
// completed work as the same progress → per-tool disclosure loop as live work.
export function TaskPresentation({ ref, children, onTaskToggle, preset, ...props }) {
  const [future] = useFutureTasks();
  if (!future) return <div ref={ref} {...props}>{children}</div>;
  const title = findClass(children, 'task-name')?.props.children ?? 'Completed task';
  const body = findClass(children, 'task-detail-inner')?.props.children;
  const calls = toolCalls(body);
  const steps = PRESET_TASK_STEPS[preset];
  return <TaskDisclosure ref={ref} group preset={preset} title={title} timer={steps.reduce((total, step) => total + step.duration, 0)} expanded={props.className?.includes('expanded')}
    onExpandedChange={onTaskToggle}>
    <div className="checkpoint-group-history">
      {steps.map(step => <div className="checkpoint-step" key={step.calls[0]}>
        <div className="console-response checkpoint-message">{step.message}</div>
        <TaskDisclosure title={step.calls[0]} timer={step.duration}>
          <p className="task-body-text">{step.detail}</p>
          {calls.filter(call => step.calls.includes(call.label)).map(call => call.node)}
          <p className="task-body-text">{step.outcome}</p>
        </TaskDisclosure>
      </div>)}
    </div>
  </TaskDisclosure>;
}

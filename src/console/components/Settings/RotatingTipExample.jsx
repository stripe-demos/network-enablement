import { useState } from 'react';
import { RotatingTip } from '../RotatingTip';

export function RotatingTipExample() {
  const [visible, setVisible] = useState(true);

  if (!visible) return <button type="button" className="composer-example__control-button" onClick={() => setVisible(true)}>Show tips</button>;

  return <RotatingTip onDismiss={() => setVisible(false)} />;
}

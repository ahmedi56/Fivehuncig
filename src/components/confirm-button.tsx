import { useEffect, useState } from 'react';

import { Button } from './ui';

/** Two-tap confirmation that works on every platform (no blocking dialogs). */
export function ConfirmButton({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <Button
      kind={armed ? 'ember' : 'quiet'}
      label={armed ? confirmLabel : label}
      onPress={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
    />
  );
}

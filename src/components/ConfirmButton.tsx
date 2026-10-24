import { useId, useState } from 'react';

/** A button that asks first: resets, reveals and other things that can't be undone. */
export function ConfirmButton({ label, question, detail, confirmLabel, cancelLabel = 'Cancel', onConfirm, className = 'btn btn--outline' }: {
  label: string;
  question: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!open) {
    return (
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }
  return (
    <div className="panel card--outline confirm" role="alertdialog" aria-labelledby={`${id}-q`} aria-describedby={detail ? `${id}-d` : undefined}>
      <span className="panel__title" id={`${id}-q`}>{question}</span>
      {detail && <span id={`${id}-d`}>{detail}</span>}
      <div className="grid-2 grid-2--stack-narrow">
        <button type="button" className="btn btn--outline" autoFocus onClick={() => setOpen(false)}>{cancelLabel}</button>
        <button type="button" className="btn" onClick={() => { setOpen(false); onConfirm(); }}>{confirmLabel}</button>
      </div>
    </div>
  );
}

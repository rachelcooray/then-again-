import { useId } from 'react';

export function SwitchRow({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="setting">
      <div className="setting__text" id={id}>
        <span>{label}</span>
        {description && <span>{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        className="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__track" aria-hidden="true"><span className="switch__knob" /></span>
      </button>
    </div>
  );
}

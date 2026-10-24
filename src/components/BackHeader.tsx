import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BackIcon } from './Icons';

/**
 * Sub-screen header. Back returns to the previous screen when there is one,
 * otherwise to `fallback` (for example after opening a deep link).
 */
export function BackHeader({ title, fallback, backLabel, children }: {
  title: string;
  fallback: string;
  backLabel: string;
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(fallback);
  };
  return (
    <div className="back-header">
      <button type="button" className="icon-btn" aria-label={backLabel} onClick={goBack}>
        <BackIcon />
      </button>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="screen">
      <h1 className="display">Page not found</h1>
      <p className="muted">That page doesn’t exist. Today’s puzzles are a tap away.</p>
      <Link to="/" className="btn btn--start">Go to today <span aria-hidden="true">→</span></Link>
    </div>
  );
}

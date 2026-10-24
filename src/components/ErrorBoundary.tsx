import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../lib/errors';

/** If a screen crashes, show a calm way out instead of a blank page, and send a report. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(Object.assign(error, { stack: `${error.stack ?? ''}\n${info.componentStack ?? ''}` }));
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Moving to another screen clears the error.
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="screen" role="alert">
        <h1 className="display">Something went wrong</h1>
        <p className="muted">Sorry about that. Your progress is safe, and we’ve been sent a report so we can fix it.</p>
        <a href="#/" className="btn btn--start" onClick={() => this.setState({ failed: false })}>Back to today</a>
        <button type="button" className="btn btn--outline btn--start" onClick={() => location.reload()}>Reload the app</button>
      </div>
    );
  }
}

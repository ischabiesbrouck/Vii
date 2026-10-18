import { Component, type ReactNode } from 'react';
import i18n from '@/i18n';

interface State {
  error: Error | null;
}

/** Keeps one broken page from taking down the whole app shell. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-xl py-16 text-center">
        <p className="font-serif text-xl font-semibold">{i18n.t('error.title')}</p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
        >
          {i18n.t('error.retry')}
        </button>
      </div>
    );
  }
}

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  private handleReload = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
        <div className="terminal-window max-w-lg w-full">
          <div className="terminal-titlebar">
            <span className="terminal-dot bg-red-500" />
            <span className="terminal-dot bg-yellow-500/40" />
            <span className="terminal-dot bg-emerald-500/40" />
            <span className="text-xs text-gray-600 ml-2">error</span>
          </div>
          <div className="px-5 py-8 text-center font-mono">
            <div className="text-red-400 text-lg mb-3">{'\u2717'} Something went wrong</div>
            <pre className="text-xs text-red-400/60 bg-surface-0 border border-border rounded-lg px-4 py-3 mb-6 text-left overflow-x-auto max-h-32">
              {this.state.error.message}
            </pre>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 text-sm min-h-[40px] font-mono bg-surface-2 hover:bg-surface-3 active:bg-surface-4 border border-border text-gray-400 hover:text-gray-200 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 text-sm min-h-[40px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

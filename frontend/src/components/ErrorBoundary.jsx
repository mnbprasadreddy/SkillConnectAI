import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Neural Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card p-12 max-w-lg space-y-6">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Neural Link Severed</h1>
              <p className="text-muted">A critical exception occurred in the application stream. Our neural networks are investigating the anomaly.</p>
            </div>
            {this.state.error && (
              <pre className="text-[10px] bg-black/50 p-4 rounded-xl text-red-400 overflow-x-auto text-left font-mono">
                {this.state.error.toString()}
              </pre>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="neon-button-cyan flex items-center justify-center gap-2 w-full"
            >
              <RotateCcw className="w-5 h-5" />
              Re-initialize Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

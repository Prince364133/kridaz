import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-[#0A0A0A] border border-white/10 rounded-[32px] p-12 text-center space-y-8">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white uppercase tracking-tight">Something went wrong</h1>
              <p className="text-white/40 text-sm leading-relaxed">
                We've encountered an unexpected error. Our team has been notified.
              </p>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-left overflow-auto max-h-40">
              <p className="text-[10px] font-mono text-red-400/60 leading-tight">
                {this.state.error?.toString()}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <RotateCcw size={16} /> REFRESH PAGE
              </button>
              <a
                href="/"
                className="flex-1 bg-[#55DEE8] hover:bg-[#a3e635] text-black h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Home size={16} /> RETURN HOME
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

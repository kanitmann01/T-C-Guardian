
import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
                    <div className="max-w-2xl w-full bg-red-900/20 border border-red-500/50 rounded-xl p-8">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong.</h1>
                        <p className="text-slate-300 mb-4">The application encountered a critical error.</p>
                        <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-96 font-mono text-xs text-red-300">
                            <p className="font-bold mb-2">{this.state.error?.toString()}</p>
                            <pre>{this.state.errorInfo?.componentStack}</pre>
                        </div>
                        <button
                            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            onClick={() => window.location.reload()}
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

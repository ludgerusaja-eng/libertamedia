import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h1 className="text-lg font-bold text-red-900">Terjadi Kesalahan</h1>
              </div>
              <p className="text-sm text-red-700 mb-4">
                {this.state.error?.message || 'Sesuatu tidak berjalan dengan baik. Coba muat ulang halaman.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

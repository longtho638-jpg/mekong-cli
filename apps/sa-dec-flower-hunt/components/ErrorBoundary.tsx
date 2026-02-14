'use client';

import React, { ReactNode } from 'react';

interface Props {
    children: ReactNode;
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
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);

        // Send to error tracking (Sentry, etc.)
        // reportError(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">
                            Có lỗi xảy ra
                        </h1>
                        <p className="text-gray-700 mb-6">
                            {this.state.error?.message || 'Ứng dụng gặp lỗi bất ngờ. Vui lòng thử lại.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Tải lại trang
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

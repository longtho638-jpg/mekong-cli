"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen flex-col items-center justify-center bg-deep-space-900 px-4 text-center">
            <div className="rounded-full bg-red-900/30 p-3">
              <svg
                className="h-12 w-12 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-starlight-100">
              Something went wrong
            </h1>
            <p className="mt-2 text-gray-400">
              Please refresh the page or try again later.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-deep-space-900"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

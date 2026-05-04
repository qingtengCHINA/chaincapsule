'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[50dvh] flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/30 border border-red-900/30 flex items-center justify-center">
              <span className="text-lg text-red-400">!</span>
            </div>
            <div>
              <p className="text-sm text-zinc-300 mb-1">页面出现了问题</p>
              <p className="text-xs text-zinc-600">
                {this.state.error?.message || '未知错误'}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 px-4 py-2 rounded-lg hover:border-zinc-700"
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

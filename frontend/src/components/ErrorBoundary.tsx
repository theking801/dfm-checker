import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center space-y-4">
            <div className="text-4xl">💥</div>
            <h2 className="text-lg font-bold text-red-700 dark:text-red-300">Erreur détectée</h2>
            <p className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-100 dark:bg-red-900/50 p-3 rounded-lg overflow-auto max-h-40 text-left">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

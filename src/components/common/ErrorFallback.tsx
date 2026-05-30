import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorFallback({ message = '数据加载失败，请稍后重试', onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-3 rounded-xl bg-red-500/10 mb-4">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <p className="text-sm text-slate-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
        >
          <RefreshCw size={12} />
          重新加载
        </button>
      )}
    </div>
  );
}

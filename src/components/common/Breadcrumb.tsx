interface BreadcrumbItem {
  label: string;
  /** 可选 id：用于侧边栏跳转（暂作为预留字段） */
  id?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * 统一面包屑组件
 * - 字号：text-xs
 * - 默认颜色：text-slate-400
 * - 当前页（最后一项）：text-cyan-400 + 半粗
 * - 分隔符：SVG chevron ›
 * - 间距：gap-2，与下方 h1 间距 mb-2
 */
export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <div className={`flex items-center gap-2 text-xs text-slate-400 mb-2 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <svg
                className="w-3 h-3 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            <span
              className={
                isLast
                  ? 'text-cyan-400 font-medium'
                  : 'text-slate-400 hover:text-slate-300 transition-colors'
              }
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

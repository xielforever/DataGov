import { ShieldAlert } from 'lucide-react';

interface ForbiddenStateProps {
  title?: string;
  description?: string;
  requiredPermissions?: string[];
}

export default function ForbiddenState({
  title = '无权访问当前能力',
  description = '你的账号暂未开通该菜单或操作权限，请联系平台管理员在角色权限中授权。',
  requiredPermissions = [],
}: ForbiddenStateProps) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
      <div className="max-w-xl rounded-2xl border border-amber-400/20 bg-slate-900/80 p-8 text-center shadow-2xl shadow-slate-950/30">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
        {requiredPermissions.length > 0 && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left">
            <p className="text-xs font-medium text-slate-500">缺少权限点</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {requiredPermissions.map((permission) => (
                <span key={permission} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

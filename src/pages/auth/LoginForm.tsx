import { useState } from "react";
import { login, persistAuthSession } from "../../services/api";
import type { LoginResponseData } from "../../types/api";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onLoginSuccess?: (session: LoginResponseData) => void;
}

export default function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword, onLoginSuccess }: LoginFormProps) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!account || !password) {
      setErrorMessage("请输入账号和密码");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setLoading(true);
    try {
      const session = await login({ username: account, password, rememberMe });
      persistAuthSession(session);
      setLoading(false);
      setSuccess(true);
      window.setTimeout(() => onLoginSuccess?.(session), 250);
    } catch (error) {
      setLoading(false);
      setSuccess(false);
      setErrorMessage(error instanceof Error ? error.message : "登录失败，请稍后重试");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className={`relative mx-auto w-full max-w-md transition-all duration-300 ${shake ? "animate-shake" : ""}`}>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative lg:hidden">
            <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20" style={{ animationDuration: "3s" }} />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md">
              <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-slate-100 via-white to-cyan-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              数据治理平台登录
            </h1>
            <p className="mt-1 text-xs text-slate-400">数据集成、数据资产、标准规范、血缘监控</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3 text-center text-xs text-slate-400">
          仅支持工号、域账号或企业邮箱登录
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="group relative">
            <label
              className={`absolute left-4 text-xs font-medium transition-all duration-200 ${
                focused === "account" || account ? "-top-2.5 rounded bg-[#0f172a] px-1 text-cyan-400" : "top-3.5 text-slate-400"
              }`}
            >
              工号 / 域账号 / 邮箱
            </label>
            <div
              className={`flex items-center rounded-xl border bg-slate-900/50 px-4 py-3.5 transition-all duration-200 ${
                focused === "account" ? "border-cyan-500/80 shadow-lg shadow-cyan-500/5" : "border-white/5 hover:border-white/10"
              }`}
            >
              <input
                type="text"
                autoComplete="username"
                aria-label="工号、域账号或邮箱"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                onFocus={() => setFocused("account")}
                onBlur={() => setFocused(null)}
                className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-transparent"
                placeholder="account"
              />
              <svg
                className={`h-4 w-4 transition-colors duration-200 ${focused === "account" ? "text-cyan-400" : "text-slate-500"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          <div className="group relative">
            <label
              className={`absolute left-4 text-xs font-medium transition-all duration-200 ${
                focused === "password" || password ? "-top-2.5 rounded bg-[#0f172a] px-1 text-cyan-400" : "top-3.5 text-slate-400"
              }`}
            >
              安全密码
            </label>
            <div
              className={`flex items-center rounded-xl border bg-slate-900/50 px-4 py-3.5 transition-all duration-200 ${
                focused === "password" ? "border-cyan-500/80 shadow-lg shadow-cyan-500/5" : "border-white/5 hover:border-white/10"
              }`}
            >
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-label="安全密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-transparent"
                placeholder="password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                className="text-slate-500 transition-colors hover:text-slate-300"
              >
                {showPassword ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="rounded border-slate-700 bg-slate-900/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
              />
              记住账户
            </label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs text-cyan-400/80 transition-colors hover:text-cyan-300"
            >
              忘记安全密码？
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 transition-all duration-300 group-hover:from-cyan-500 group-hover:via-teal-500 group-hover:to-indigo-500" />
            <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.2} />
                    <path d="M12 3a9 9 0 019 9" />
                  </svg>
                  校验平台授权中...
                </>
              ) : success ? (
                <>
                  <svg className="h-4 w-4 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  安全认证成功
                </>
              ) : (
                <>
                  进入治理空间
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
          <span className="text-xs text-slate-500">还没有账户？</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
        </div>

        <button
          type="button"
          onClick={onSwitchToRegister}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-800/30 py-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-emerald-500/30 hover:bg-slate-800/60 hover:text-emerald-300"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          注册企业账户
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/5 pt-4 text-[10px] text-slate-500">
          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          本系统已经过平台安全级信息等级保护测评
        </div>
      </div>
    </div>
  );
}

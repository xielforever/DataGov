import { useState, useRef } from "react";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword, onLoginSuccess }: LoginFormProps) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      onLoginSuccess?.();
    }, 2000);
  };

  return (
    <div
      className={`relative w-full max-w-md mx-auto transition-all duration-300 ${
        shake ? "animate-shake" : ""
      }`}
    >
      {/* 玻璃态卡片 */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/60 p-8 shadow-2xl backdrop-blur-xl">
        {/* 内部倾斜微光 */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />

        {/* 顶部指示条 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        {/* Logo 与 标题 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="lg:hidden relative">
            <div
              className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20"
              style={{ animationDuration: "3s" }}
            />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md">
              <svg
                className="w-7 h-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
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
            <p className="mt-1 text-xs text-slate-400">
              数据集成、数据资产、标准规范、血缘监控
            </p>
          </div>
        </div>

        {/* 第三方登录/企业单点登录入口 */}
        <div className="mb-6 flex gap-3">
          {[
            {
              icon: (
                <svg
                  className="h-5 w-5 text-[#007FFF]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M1.98 12.18c.03-3.08.79-5.74 2.27-7.97l.08-.12c.16-.25.3-.49.46-.72l.14-.19.01-.01c2.1-2.6 4.97-3.14 8.21-1.57.44.21.84.48 1.25.75l.13.1.28-.21a11.1 11.1 0 011.83-1.15 10.4 10.4 0 017.2-.38c.11.04.14.15.11.25-.26.85-.6 1.67-1.05 2.45l-.17.3c-.09.14-.15.24-.04.41l.24.37c.72 1.13 1.2 2.37 1.45 3.7.2 1.05.21 2.11.08 3.16-.28 2.28-1.12 4.31-2.58 6.07-.15.19-.31.37-.47.55l-.14.16-.01.01a11.16 11.16 0 01-8.21 1.57c-.44-.21-.84-.48-1.25-.75l-.13-.1-.28.21a11.1 11.1 0 01-1.83 1.15c-2.45.98-4.9.82-7.2.38-.11-.04-.14-.15-.11-.25.26-.85.6-1.67 1.05-2.45.16-.27.24-.46.07-.72-.45-.69-.84-1.42-1.17-2.19-.36-.81-.61-1.65-.75-2.53z" />
                </svg>
              ),
              label: "SSO登录",
            },
            {
              icon: (
                <svg
                  className="h-5 w-5 text-[#237BF2]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.36 15.5H8.64a.64.64 0 01-.64-.64v-.15c0-.6.44-1.12 1.03-1.23l1.88-.34a1.8 1.8 0 001.09-.59l.3-.35c.16-.18.15-.46-.02-.62l-.76-.71a1.28 1.28 0 01-.39-.77l-.09-.59c-.04-.31.13-.61.42-.72.63-.23 1.28-.21 1.87.06.27.12.4.42.33.72l-.12.55a1.28 1.28 0 01-.36.64l-.79.79c-.16.16-.16.42.01.58l.3.31c.36.37.85.59 1.37.6l2.12.06c.35.01.64.3.64.65v.23c0 .35-.29.64-.64.64z" />
                </svg>
              ),
              label: "钉钉登录",
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-800/40 py-2.5 text-xs text-slate-300 transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-800/80 hover:text-cyan-300"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* 分割线 */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
          <span className="text-xs text-slate-500">或企业账户登录</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
        </div>

        {/* 登录表单 */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* 账号输入 */}
          <div className="group relative">
            <label
              className={`absolute left-4 text-xs font-medium transition-all duration-200 ${
                focused === "account" || account
                  ? "-top-2.5 text-cyan-400 bg-[#0f172a] px-1 rounded"
                  : "top-3.5 text-slate-400"
              }`}
            >
              工号 / 域账号 / 邮箱
            </label>
            <div
              className={`flex items-center rounded-xl border bg-slate-900/50 px-4 py-3.5 transition-all duration-200 ${
                focused === "account"
                  ? "border-cyan-500/80 shadow-lg shadow-cyan-500/5"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                onFocus={() => setFocused("account")}
                onBlur={() => setFocused(null)}
                className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-transparent"
                placeholder="account"
              />
              <svg
                className={`h-4 w-4 transition-colors duration-200 ${
                  focused === "account" ? "text-cyan-400" : "text-slate-500"
                }`}
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

          {/* 密码输入 */}
          <div className="group relative">
            <label
              className={`absolute left-4 text-xs font-medium transition-all duration-200 ${
                focused === "password" || password
                  ? "-top-2.5 text-cyan-400 bg-[#0f172a] px-1 rounded"
                  : "top-3.5 text-slate-400"
              }`}
            >
              安全密码
            </label>
            <div
              className={`flex items-center rounded-xl border bg-slate-900/50 px-4 py-3.5 transition-all duration-200 ${
                focused === "password"
                  ? "border-cyan-500/80 shadow-lg shadow-cyan-500/5"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <input
                type={showPassword ? "text" : "password"}
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
                className="text-slate-500 transition-colors hover:text-slate-300"
              >
                {showPassword ? (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 选项组：记住密码 & 忘记密码 */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
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

          {/* 提交/登录按钮 */}
          <button
            type="submit"
            disabled={loading || success}
            className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed"
          >
            {/* 渐变色背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 transition-all duration-300 group-hover:from-cyan-500 group-hover:via-teal-500 group-hover:to-indigo-500" />
            {/* 光泽扫过动画 */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeOpacity={0.2}
                    />
                    <path d="M12 3a9 9 0 019 9" />
                  </svg>
                  校验平台授权中...
                </>
              ) : success ? (
                <>
                  <svg
                    className="h-4 w-4 text-emerald-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  安全认证成功！
                </>
              ) : (
                <>
                  进入治理空间
                  <svg
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>

        {/* 分割线 */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
          <span className="text-xs text-slate-500">还没有账户？</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
        </div>

        {/* 注册按钮 */}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="w-full rounded-xl border border-white/5 bg-slate-800/30 py-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-emerald-500/30 hover:bg-slate-800/60 hover:text-emerald-300 flex items-center justify-center gap-2"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          注册企业账户
        </button>

        {/* 企业合规认证提示 */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <svg
            className="w-3.5 h-3.5 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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

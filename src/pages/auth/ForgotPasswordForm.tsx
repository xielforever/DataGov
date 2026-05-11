import { useState, useRef, useEffect } from "react";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

type Step = 1 | 2 | 3 | 4;

export default function ForgotPasswordForm({ onSwitchToLogin }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [account, setAccount] = useState("");
  const [verifyMethod, setVerifyMethod] = useState<"email" | "sms">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // 触发抖动 + 错误提示
  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  // 密码强度
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const strength = getPasswordStrength(newPassword);
  const strengthLabel = ["", "弱", "中", "强", "极强"][strength];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
  ][strength];

  // 验证码输入处理
  const handleCodeInput = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) codeRefs.current[i + 1]?.focus();
  };

  const handleCodeKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setCode(next);
    const focusIdx = Math.min(text.length, 5);
    codeRefs.current[focusIdx]?.focus();
  };

  // 步骤 1：发送验证码
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      triggerError("请输入您的账户标识");
      return;
    }
    if (verifyMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
      triggerError("企业邮箱格式不正确");
      return;
    }
    if (verifyMethod === "sms" && !/^1[3-9]\d{9}$/.test(account)) {
      triggerError("手机号格式不正确");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCountdown(60);
      setStep(2);
    }, 1200);
  };

  // 重新发送
  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(60);
  };

  // 步骤 2：验证码校验
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.some((c) => !c)) {
      triggerError("请填写完整的 6 位安全验证码");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1000);
  };

  // 步骤 3：重置密码
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      triggerError("请填写新的安全密码");
      return;
    }
    if (newPassword.length < 8) {
      triggerError("密码长度至少 8 位");
      return;
    }
    if (strength < 3) {
      triggerError("密码强度不足，需包含大小写字母、数字与特殊字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 1500);
  };

  return (
    <div
      className={`relative w-full max-w-md mx-auto transition-all duration-300 ${
        shake ? "animate-shake" : ""
      }`}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/60 p-8 shadow-2xl backdrop-blur-xl">
        {/* 内部倾斜微光 */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/10 via-transparent to-cyan-500/10" />
        {/* 顶部指示条 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* 标题 */}
        <div className="relative mb-6 flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 animate-ping rounded-full bg-amber-500/20"
              style={{ animationDuration: "3s" }}
            />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-cyan-500/20">
              <svg
                className="h-6 w-6 text-amber-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 019.9-1" />
                <circle cx="12" cy="16" r="1" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white tracking-wide">
              {step === 4 ? "密码重置成功" : "重置安全密码"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {step === 1 && "请验证您的身份信息以重置访问凭据"}
              {step === 2 && `验证码已发送至您的${verifyMethod === "email" ? "企业邮箱" : "手机"}`}
              {step === 3 && "请设置新的安全密码"}
              {step === 4 && "您的访问凭据已更新"}
            </p>
          </div>
        </div>

        {/* 步骤指示器 */}
        {step < 4 && (
          <div className="relative mb-6 flex items-center justify-between">
            {[1, 2, 3].map((s, idx) => (
              <div key={s} className="flex flex-1 items-center">
                <div className="relative flex flex-col items-center flex-shrink-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300 ${
                      step > s
                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                        : step === s
                        ? "border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        : "border-slate-700 bg-slate-800/40 text-slate-500"
                    }`}
                  >
                    {step > s ? (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      s
                    )}
                  </div>
                  <span
                    className={`absolute top-10 whitespace-nowrap text-[10px] ${
                      step >= s ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {["验证身份", "安全校验", "重置密码"][idx]}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`mx-2 h-px flex-1 transition-colors duration-300 ${
                      step > s ? "bg-emerald-500/40" : "bg-slate-700/60"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 错误提示 */}
        {errorMsg && (
          <div className="mb-4 mt-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 animate-fadeIn">
            <svg
              className="h-4 w-4 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* === 步骤 1：身份验证 === */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-5 mt-8 animate-fadeIn">
            {/* 验证方式选择 */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-slate-900/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setVerifyMethod("email");
                  setAccount("");
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
                  verifyMethod === "email"
                    ? "bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-200 shadow-inner"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                企业邮箱
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifyMethod("sms");
                  setAccount("");
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
                  verifyMethod === "sms"
                    ? "bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-200 shadow-inner"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                手机号码
              </button>
            </div>

            {/* 账户输入 */}
            <div className="relative">
              <label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focused === "account" || account
                    ? "-top-2 text-[10px] bg-[#0f172a] px-1.5 text-amber-400"
                    : "top-3.5 text-xs text-slate-500"
                }`}
              >
                {verifyMethod === "email" ? "企业邮箱地址" : "注册手机号"}
              </label>
              <input
                type={verifyMethod === "email" ? "email" : "tel"}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                onFocus={() => setFocused("account")}
                onBlur={() => setFocused(null)}
                className={`w-full rounded-xl border bg-slate-900/40 px-4 py-3 text-sm text-white outline-none transition-all duration-200 ${
                  focused === "account"
                    ? "border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "border-white/5 hover:border-white/10"
                }`}
                autoComplete={verifyMethod === "email" ? "email" : "tel"}
              />
            </div>

            {/* 安全提示 */}
            <div className="flex items-start gap-2 rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3 text-[11px] leading-relaxed text-cyan-200/70">
              <svg className="h-4 w-4 flex-shrink-0 mt-0.5 text-cyan-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                出于安全考虑，我们将向您的{verifyMethod === "email" ? "企业邮箱" : "注册手机"}发送一次性安全验证码。该验证码 10 分钟内有效。
              </span>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-orange-600 to-cyan-600 transition-all duration-300 group-hover:from-amber-500 group-hover:via-orange-500 group-hover:to-cyan-500" />
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.2} />
                      <path d="M12 3a9 9 0 019 9" />
                    </svg>
                    身份核验中...
                  </>
                ) : (
                  <>
                    发送安全验证码
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>
        )}

        {/* === 步骤 2：验证码校验 === */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-5 mt-8 animate-fadeIn">
            {/* 接收账户展示 */}
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="h-4 w-4 flex-shrink-0 text-amber-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {verifyMethod === "email" ? (
                    <>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </>
                  ) : (
                    <>
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </>
                  )}
                </svg>
                <span className="text-xs text-slate-300 truncate">{account}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCode(["", "", "", "", "", ""]);
                }}
                className="text-[11px] text-cyan-400/80 hover:text-cyan-300 flex-shrink-0 ml-2"
              >
                修改
              </button>
            </div>

            {/* 6 位验证码输入 */}
            <div>
              <label className="mb-2 block text-xs text-slate-400">请输入 6 位安全验证码</label>
              <div className="flex justify-between gap-2" onPaste={handleCodePaste}>
                {code.map((c, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      codeRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={c}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className={`h-12 w-full rounded-xl border bg-slate-900/40 text-center text-lg font-semibold text-white outline-none transition-all duration-200 ${
                      c
                        ? "border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        : "border-white/5 hover:border-white/10 focus:border-amber-500/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 重发倒计时 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">没有收到验证码？</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className={`transition-colors ${
                  countdown > 0
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-cyan-400/80 hover:text-cyan-300"
                }`}
              >
                {countdown > 0 ? `${countdown}s 后可重新发送` : "重新发送"}
              </button>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-orange-600 to-cyan-600 transition-all duration-300 group-hover:from-amber-500 group-hover:via-orange-500 group-hover:to-cyan-500" />
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.2} />
                      <path d="M12 3a9 9 0 019 9" />
                    </svg>
                    校验中...
                  </>
                ) : (
                  "校验并继续"
                )}
              </span>
            </button>
          </form>
        )}

        {/* === 步骤 3：重置密码 === */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5 mt-8 animate-fadeIn">
            {/* 新密码 */}
            <div className="relative">
              <label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focused === "newPassword" || newPassword
                    ? "-top-2 text-[10px] bg-[#0f172a] px-1.5 text-amber-400"
                    : "top-3.5 text-xs text-slate-500"
                }`}
              >
                新的安全密码
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setFocused("newPassword")}
                onBlur={() => setFocused(null)}
                className={`w-full rounded-xl border bg-slate-900/40 px-4 py-3 pr-11 text-sm text-white outline-none transition-all duration-200 ${
                  focused === "newPassword"
                    ? "border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "border-white/5 hover:border-white/10"
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* 密码强度 */}
            {newPassword && (
              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength ? strengthColor : "bg-slate-700/40"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">密码强度：<span className={
                    strength === 1 ? "text-red-400" :
                    strength === 2 ? "text-orange-400" :
                    strength === 3 ? "text-yellow-400" :
                    strength === 4 ? "text-emerald-400" : "text-slate-500"
                  }>{strengthLabel || "请输入"}</span></span>
                  <span className="text-slate-600">建议 ≥8 位 / 含大小写 / 数字 / 特殊符号</span>
                </div>
              </div>
            )}

            {/* 确认密码 */}
            <div className="relative">
              <label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focused === "confirmPassword" || confirmPassword
                    ? "-top-2 text-[10px] bg-[#0f172a] px-1.5 text-amber-400"
                    : "top-3.5 text-xs text-slate-500"
                }`}
              >
                确认新密码
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocused("confirmPassword")}
                onBlur={() => setFocused(null)}
                className={`w-full rounded-xl border bg-slate-900/40 px-4 py-3 pr-16 text-sm text-white outline-none transition-all duration-200 ${
                  confirmPassword && newPassword !== confirmPassword
                    ? "border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                    : confirmPassword && newPassword === confirmPassword
                    ? "border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : focused === "confirmPassword"
                    ? "border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : "border-white/5 hover:border-white/10"
                }`}
                autoComplete="new-password"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {confirmPassword && (
                  <span className={newPassword === confirmPassword ? "text-emerald-400" : "text-red-400"}>
                    {newPassword === confirmPassword ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 安全策略提示 */}
            <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200/70">
              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <div className="font-medium text-amber-200/90 mb-0.5">企业级密码安全策略</div>
                  <div>新密码不可与最近 3 次使用过的密码相同，且每 90 天需更新一次。</div>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-orange-600 to-cyan-600 transition-all duration-300 group-hover:from-amber-500 group-hover:via-orange-500 group-hover:to-cyan-500" />
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.2} />
                      <path d="M12 3a9 9 0 019 9" />
                    </svg>
                    更新凭据中...
                  </>
                ) : (
                  "确认重置密码"
                )}
              </span>
            </button>
          </form>
        )}

        {/* === 步骤 4：成功 === */}
        {step === 4 && (
          <div className="mt-8 flex flex-col items-center text-center animate-fadeIn">
            <div className="relative mb-6">
              <div
                className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20"
                style={{ animationDuration: "2s" }}
              />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <svg className="h-8 w-8 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">访问凭据已更新</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-xs">
              您的安全密码已成功重置。出于账户安全考虑，所有已登录的会话将被强制下线，请使用新密码重新登录平台。
            </p>
            <button
              onClick={onSwitchToLogin}
              className="group relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 transition-all duration-300 group-hover:from-cyan-500 group-hover:via-teal-500 group-hover:to-indigo-500" />
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative flex items-center justify-center gap-2">
                立即登录平台
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>
          </div>
        )}

        {/* 返回登录 */}
        {step < 4 && (
          <div className="relative mt-6 pt-5 border-t border-white/5">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full text-center text-xs text-slate-500 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              返回登录
            </button>
          </div>
        )}

        {/* 底部指示条 */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      </div>
    </div>
  );
}

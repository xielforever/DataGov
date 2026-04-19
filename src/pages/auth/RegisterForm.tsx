import { useState } from "react";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: "",
    captcha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [captchaSent, setCaptchaSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState(1); // 1: 基本信息, 2: 安全设置

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const sendCaptcha = () => {
    if (!formData.email && !formData.phone) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setCaptchaSent(true);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCaptchaSent(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.username || !formData.email || !formData.phone) {
        setShake(true);
        setTimeout(() => setShake(false), 600);
        return;
      }
      setStep(2);
      return;
    }
    if (
      !formData.password ||
      !formData.confirmPassword ||
      !formData.captcha ||
      !agreed
    ) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    }, 2000);
  };

  // 密码强度评估
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, text: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { level: 1, text: "弱", color: "bg-red-500" };
    if (score <= 3) return { level: 2, text: "中", color: "bg-yellow-500" };
    if (score <= 4) return { level: 3, text: "强", color: "bg-emerald-500" };
    return { level: 4, text: "极强", color: "bg-cyan-400" };
  };

  const strength = getPasswordStrength(formData.password);

  const renderInput = (
    key: string,
    label: string,
    icon: React.ReactNode,
    type = "text",
    rightElement?: React.ReactNode
  ) => (
    <div className="group relative">
      <label
        className={`absolute left-4 text-xs font-medium transition-all duration-200 z-10 ${
          focused === key || formData[key as keyof typeof formData]
            ? "-top-2.5 text-cyan-400 bg-[#0f172a] px-1 rounded"
            : "top-3.5 text-slate-400"
        }`}
      >
        {label}
      </label>
      <div
        className={`flex items-center rounded-xl border bg-slate-900/50 px-4 py-3.5 transition-all duration-200 ${
          focused === key
            ? "border-cyan-500/80 shadow-lg shadow-cyan-500/5"
            : "border-white/5 hover:border-white/10"
        }`}
      >
        <input
          type={type}
          value={formData[key as keyof typeof formData]}
          onChange={(e) => updateField(key, e.target.value)}
          onFocus={() => setFocused(key)}
          onBlur={() => setFocused(null)}
          className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-transparent"
          placeholder={label}
        />
        {rightElement || (
          <span
            className={`transition-colors duration-200 ${
              focused === key ? "text-cyan-400" : "text-slate-500"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );

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
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

        {/* Logo 与 标题 */}
        <div className="mb-6 flex flex-col items-center gap-3">
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
            <h1 className="bg-gradient-to-r from-slate-100 via-white to-emerald-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              注册企业账户
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              加入数据治理开发平台，开启数据资产管理之旅
            </p>
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                step >= 1
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-slate-800 text-slate-500 border border-slate-700"
              }`}
            >
              {step > 1 ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                "1"
              )}
            </div>
            <span
              className={`text-xs ${step >= 1 ? "text-slate-300" : "text-slate-600"}`}
            >
              基本信息
            </span>
          </div>
          <div
            className={`h-px w-10 transition-all duration-500 ${step >= 2 ? "bg-gradient-to-r from-cyan-500 to-indigo-500" : "bg-slate-700"}`}
          />
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                step >= 2
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-slate-800 text-slate-500 border border-slate-700"
              }`}
            >
              2
            </div>
            <span
              className={`text-xs ${step >= 2 ? "text-slate-300" : "text-slate-600"}`}
            >
              安全设置
            </span>
          </div>
        </div>

        {/* 注册表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            /* ===== 步骤 1：基本信息 ===== */
            <div className="space-y-4 animate-fadeIn">
              {renderInput(
                "username",
                "姓名 / 花名",
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}

              {renderInput(
                "email",
                "企业邮箱",
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 5L2 7" />
                </svg>
              )}

              {renderInput(
                "phone",
                "手机号码",
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              )}

              {renderInput(
                "department",
                "部门 / 团队（选填）",
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              )}
            </div>
          ) : (
            /* ===== 步骤 2：安全设置 ===== */
            <div className="space-y-4 animate-fadeIn">
              {/* 密码输入 */}
              <div className="group relative">
                <label
                  className={`absolute left-4 text-xs font-medium transition-all duration-200 z-10 ${
                    focused === "password" || formData.password
                      ? "-top-2.5 text-cyan-400 bg-[#0f172a] px-1 rounded"
                      : "top-3.5 text-slate-400"
                  }`}
                >
                  设置安全密码
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
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
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

              {/* 密码强度指示器 */}
              {formData.password && (
                <div className="flex items-center gap-2 px-1 animate-fadeIn">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.level
                            ? strength.color
                            : "bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs ${
                      strength.level <= 1
                        ? "text-red-400"
                        : strength.level <= 2
                          ? "text-yellow-400"
                          : strength.level <= 3
                            ? "text-emerald-400"
                            : "text-cyan-400"
                    }`}
                  >
                    {strength.text}
                  </span>
                </div>
              )}

              {/* 确认密码 */}
              <div className="group relative">
                <label
                  className={`absolute left-4 text-xs font-medium transition-all duration-200 z-10 ${
                    focused === "confirmPassword" || formData.confirmPassword
                      ? "-top-2.5 text-cyan-400 bg-[#0f172a] px-1 rounded"
                      : "top-3.5 text-slate-400"
                  }`}
                >
                  确认安全密码
                </label>
                <div
                  className={`flex items-center rounded-xl border bg-slate-900/50 px-4 py-3.5 transition-all duration-200 ${
                    focused === "confirmPassword"
                      ? "border-cyan-500/80 shadow-lg shadow-cyan-500/5"
                      : formData.confirmPassword &&
                          formData.confirmPassword !== formData.password
                        ? "border-red-500/50"
                        : formData.confirmPassword &&
                            formData.confirmPassword === formData.password
                          ? "border-emerald-500/50"
                          : "border-white/5 hover:border-white/10"
                  }`}
                >
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    onFocus={() => setFocused("confirmPassword")}
                    onBlur={() => setFocused(null)}
                    className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-transparent"
                    placeholder="confirm"
                  />
                  <div className="flex items-center gap-2">
                    {formData.confirmPassword && (
                      <span className="transition-all duration-200">
                        {formData.confirmPassword === formData.password ? (
                          <svg
                            className="h-4 w-4 text-emerald-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4 text-red-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-slate-500 transition-colors hover:text-slate-300"
                    >
                      {showConfirmPassword ? (
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
              </div>

              {/* 验证码输入 */}
              <div className="group relative">
                <label
                  className={`absolute left-4 text-xs font-medium transition-all duration-200 z-10 ${
                    focused === "captcha" || formData.captcha
                      ? "-top-2.5 text-cyan-400 bg-[#0f172a] px-1 rounded"
                      : "top-3.5 text-slate-400"
                  }`}
                >
                  邮箱验证码
                </label>
                <div
                  className={`flex items-center rounded-xl border bg-slate-900/50 px-4 py-3.5 transition-all duration-200 ${
                    focused === "captcha"
                      ? "border-cyan-500/80 shadow-lg shadow-cyan-500/5"
                      : "border-white/5 hover:border-white/10"
                  }`}
                >
                  <input
                    type="text"
                    value={formData.captcha}
                    onChange={(e) => updateField("captcha", e.target.value)}
                    onFocus={() => setFocused("captcha")}
                    onBlur={() => setFocused(null)}
                    className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-transparent"
                    placeholder="captcha"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={sendCaptcha}
                    disabled={captchaSent}
                    className={`ml-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      captchaSent
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
                    }`}
                  >
                    {captchaSent ? `${countdown}s 后重发` : "获取验证码"}
                  </button>
                </div>
              </div>

              {/* 协议勾选 */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={() => setAgreed(!agreed)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <label className="text-xs text-slate-400 leading-relaxed">
                  我已阅读并同意{" "}
                  <span className="text-cyan-400/80 hover:text-cyan-300 cursor-pointer">
                    《数据治理平台服务条款》
                  </span>{" "}
                  与{" "}
                  <span className="text-cyan-400/80 hover:text-cyan-300 cursor-pointer">
                    《数据安全隐私政策》
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-1">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="group relative flex-shrink-0 overflow-hidden rounded-xl px-5 py-3 text-sm font-medium text-slate-300 transition-all duration-300 border border-white/10 hover:border-white/20 bg-slate-800/50 hover:bg-slate-800/80"
              >
                <span className="flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  上一步
                </span>
              </button>
            )}
            <button
              type="submit"
              disabled={loading || success}
              className="group relative flex-1 overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed"
            >
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
                    正在创建账户...
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
                    注册成功，即将跳转登录！
                  </>
                ) : step === 1 ? (
                  <>
                    下一步：安全设置
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
                ) : (
                  <>
                    提交注册
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
          </div>
        </form>

        {/* 分割线 */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
          <span className="text-xs text-slate-500">已有企业账户？</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
        </div>

        {/* 切换到登录 */}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full rounded-xl border border-white/5 bg-slate-800/30 py-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-cyan-500/30 hover:bg-slate-800/60 hover:text-cyan-300 flex items-center justify-center gap-2"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          返回登录
        </button>

        {/* 底部安全提示 */}
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          您的信息将通过 SSL 加密传输，符合企业数据安全规范
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;

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
  const [errorMessage, setErrorMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [captchaSent, setCaptchaSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaTarget, setCaptchaTarget] = useState("");
  const [step, setStep] = useState(1);
  const captchaTimerRef = useRef<number | null>(null);

  const clearCaptchaTimer = () => {
    if (captchaTimerRef.current !== null) {
      window.clearInterval(captchaTimerRef.current);
      captchaTimerRef.current = null;
    }
  };

  useEffect(() => clearCaptchaTimer, []);

  const triggerError = (message: string) => {
    setErrorMessage(message);
    setShake(true);
    setTimeout(() => setShake(false), 600);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

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

  const getCaptchaRecipient = () => {
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    if (email && EMAIL_PATTERN.test(email)) {
      return { value: email, label: `邮箱 ${email}` };
    }
    if (phone && PHONE_PATTERN.test(phone)) {
      return { value: phone, label: `手机 ${phone}` };
    }
    return null;
  };

  const startCaptchaCountdown = () => {
    clearCaptchaTimer();
    setCountdown(60);
    captchaTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCaptchaTimer();
          setCaptchaSent(false);
          setCaptchaCode("");
          setCaptchaTarget("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCaptcha = () => {
    const recipient = getCaptchaRecipient();
    if (!recipient) {
      triggerError("请填写有效的企业邮箱或手机号码后再获取验证码");
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setCaptchaCode(code);
    setCaptchaTarget(recipient.label);
    setCaptchaSent(true);
    updateField("captcha", "");
    startCaptchaCountdown();
  };

  const validateBasicInfo = () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.phone.trim()) {
      triggerError("请填写姓名、企业邮箱和手机号码");
      return false;
    }
    if (!EMAIL_PATTERN.test(formData.email.trim())) {
      triggerError("企业邮箱格式不正确");
      return false;
    }
    if (!PHONE_PATTERN.test(formData.phone.trim())) {
      triggerError("手机号码格式不正确");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!validateBasicInfo()) return;
      setStep(2);
      return;
    }

    if (!formData.password || !formData.confirmPassword || !formData.captcha || !agreed) {
      triggerError("请填写安全密码、验证码，并勾选服务协议");
      return;
    }
    if (strength.level < 3) {
      triggerError("密码强度不足，至少包含大小写字母、数字或特殊字符中的多类组合");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      triggerError("两次输入的密码不一致");
      return;
    }
    if (!captchaCode || formData.captcha.trim() !== captchaCode) {
      triggerError("验证码不正确，请重新核对后提交");
      return;
    }

    clearCaptchaTimer();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    }, 1200);
  };

  const renderInput = (
    key: string,
    label: string,
    icon: ReactNode,
    type = "text",
    rightElement?: ReactNode,
  ) => (
    <div className="group relative">
      <label
        className={`absolute left-4 z-10 text-xs font-medium transition-all duration-200 ${
          focused === key || formData[key as keyof typeof formData]
            ? "-top-2.5 rounded bg-[#0f172a] px-1 text-cyan-400"
            : "top-3.5 text-slate-400"
        }`}
      >
        {label}
      </label>
      <div
        className={`flex items-center rounded-xl border bg-slate-900/50 px-4 py-3.5 transition-all duration-200 ${
          focused === key ? "border-cyan-500/80 shadow-lg shadow-cyan-500/5" : "border-white/5 hover:border-white/10"
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
          <span className={`transition-colors duration-200 ${focused === key ? "text-cyan-400" : "text-slate-500"}`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative mx-auto w-full max-w-md transition-all duration-300 ${shake ? "animate-shake" : ""}`}>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

        <div className="mb-6 flex flex-col items-center gap-3">
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
            <h1 className="bg-gradient-to-r from-slate-100 via-white to-emerald-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              注册企业账户
            </h1>
            <p className="mt-1 text-xs text-slate-400">加入数据治理开发平台，开启数据资产管理之旅</p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                step >= 1 ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30" : "border border-slate-700 bg-slate-800 text-slate-500"
              }`}
            >
              {step > 1 ? (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                "1"
              )}
            </div>
            <span className={`text-xs ${step >= 1 ? "text-slate-300" : "text-slate-600"}`}>基本信息</span>
          </div>
          <div className={`h-px w-10 transition-all duration-500 ${step >= 2 ? "bg-gradient-to-r from-cyan-500 to-indigo-500" : "bg-slate-700"}`} />
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                step >= 2 ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30" : "border border-slate-700 bg-slate-800 text-slate-500"
              }`}
            >
              2
            </div>
            <span className={`text-xs ${step >= 2 ? "text-slate-300" : "text-slate-600"}`}>安全设置</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <div className="animate-fadeIn space-y-4">
              {renderInput(
                "username",
                "姓名 / 花名",
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>,
              )}
              {renderInput(
                "email",
                "企业邮箱",
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 5L2 7" />
                </svg>,
                "email",
              )}
              {renderInput(
                "phone",
                "手机号码",
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>,
                "tel",
              )}
              {renderInput(
                "department",
                "部门 / 团队（选填）",
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>,
              )}
            </div>
          ) : (
            <div className="animate-fadeIn space-y-4">
              {renderInput(
                "password",
                "设置安全密码",
                null,
                showPassword ? "text" : "password",
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 transition-colors hover:text-slate-300"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
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
                </button>,
              )}

              {formData.password && (
                <div className="flex animate-fadeIn items-center gap-2 px-1">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : "bg-slate-700"}`} />
                    ))}
                  </div>
                  <span
                    className={`text-xs ${
                      strength.level <= 1 ? "text-red-400" : strength.level <= 2 ? "text-yellow-400" : strength.level <= 3 ? "text-emerald-400" : "text-cyan-400"
                    }`}
                  >
                    {strength.text}
                  </span>
                </div>
              )}

              {renderInput(
                "confirmPassword",
                "确认安全密码",
                null,
                showConfirmPassword ? "text" : "password",
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-500 transition-colors hover:text-slate-300"
                  aria-label={showConfirmPassword ? "隐藏确认密码" : "显示确认密码"}
                >
                  {showConfirmPassword ? (
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
                </button>,
              )}

              <div>
                <div className="group relative">
                  <label
                    className={`absolute left-4 z-10 text-xs font-medium transition-all duration-200 ${
                      focused === "captcha" || formData.captcha ? "-top-2.5 rounded bg-[#0f172a] px-1 text-cyan-400" : "top-3.5 text-slate-400"
                    }`}
                  >
                    邮箱 / 手机验证码
                  </label>
                  <div
                    className={`flex items-center rounded-xl border bg-slate-900/50 px-4 py-3.5 transition-all duration-200 ${
                      focused === "captcha" ? "border-cyan-500/80 shadow-lg shadow-cyan-500/5" : "border-white/5 hover:border-white/10"
                    }`}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.captcha}
                      onChange={(e) => updateField("captcha", e.target.value.replace(/\D/g, "").slice(0, 6))}
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
                        captchaSent ? "cursor-not-allowed bg-slate-800 text-slate-500" : "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                      }`}
                    >
                      {captchaSent ? `${countdown}s 后重发` : "获取验证码"}
                    </button>
                  </div>
                </div>
                {captchaSent && (
                  <div className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                    验证码已发送至 {captchaTarget}，演示验证码：<span className="font-mono font-semibold">{captchaCode}</span>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-2 pt-1 text-xs leading-relaxed text-slate-400">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={() => setAgreed(!agreed)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span>
                  我已阅读并同意
                  <span className="cursor-pointer text-cyan-400/80 hover:text-cyan-300">《数据治理平台服务条款》</span>
                  与
                  <span className="cursor-pointer text-cyan-400/80 hover:text-cyan-300">《数据安全隐私政策》</span>
                </span>
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="group relative flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-800/50 px-5 py-3 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-white/20 hover:bg-slate-800/80"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.2} />
                      <path d="M12 3a9 9 0 019 9" />
                    </svg>
                    正在创建账户...
                  </>
                ) : success ? (
                  <>
                    <svg className="h-4 w-4 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    注册成功，即将返回登录
                  </>
                ) : step === 1 ? (
                  <>
                    下一步：安全设置
                    <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                ) : (
                  <>
                    提交注册
                    <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
          <span className="text-xs text-slate-500">已有企业账户？</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
        </div>

        <button
          type="button"
          onClick={onSwitchToLogin}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-800/30 py-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:border-cyan-500/30 hover:bg-slate-800/60 hover:text-cyan-300"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          返回登录
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/5 pt-4 text-[10px] text-slate-500">
          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

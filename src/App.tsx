import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import ParticleBackground from "./components/common/ParticleBackground";
import CapabilityPlaceholder from "./components/common/CapabilityPlaceholder";
import LoginForm from "./pages/auth/LoginForm";
import RegisterForm from "./pages/auth/RegisterForm";
import ForgotPasswordForm from "./pages/auth/ForgotPasswordForm";
import DataGovernancePanel from "./pages/dashboard/DataGovernancePanel";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { routeViews } from "./navigation/registry";

type AuthView = "login" | "register" | "forgot";
const AUTH_STORAGE_KEY = "datagov.authenticated";

function getInitialMenu() {
  const view = new URLSearchParams(window.location.search).get("view");
  return view || "home";
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "!bg-slate-800 !text-white !border !border-slate-700",
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "white",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "white",
            },
          },
        }}
      />
      <AppContent />
    </>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) === "true");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(getInitialMenu);

  const switchView = (view: AuthView) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(view);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  const handleLoginSuccess = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsLoggedIn(false);
    setCurrentView("login");
    setMobileSidebarOpen(false);
  };

  const handleMenuSelect = (menuId: string) => {
    setActiveMenu(menuId);
    setMobileSidebarOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("view", menuId);
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    const syncMenuFromUrl = () => {
      setActiveMenu(getInitialMenu());
    };
    window.addEventListener("popstate", syncMenuFromUrl);
    return () => window.removeEventListener("popstate", syncMenuFromUrl);
  }, []);

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          activeMenu={activeMenu}
          onMenuSelect={handleMenuSelect}
        />
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onLogout={handleLogout}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />
        <main
          className={`min-w-0 overflow-x-hidden pt-16 transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
          }`}
        >
          <div className="p-4 sm:p-6">
            {routeViews[activeMenu] ?? (
              <CapabilityPlaceholder
                module="平台能力"
                title="能力未配置"
                description="当前菜单已进入平台骨架，但尚未配置对应页面。请补充路由注册或占位能力定义。"
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030614]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #06b6d4, transparent 70%)",
            animation: "float1 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full opacity-10 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #4338ca, transparent 70%)",
            animation: "float2 16s ease-in-out infinite",
          }}
        />
        <div
          className={`absolute right-1/4 top-1/2 h-[400px] w-[400px] rounded-full blur-[100px] transition-opacity duration-1000 ${
            currentView === "register" ? "opacity-15" : "opacity-0"
          }`}
          style={{
            background: "radial-gradient(circle, #10b981, transparent 70%)",
            animation: "float1 14s ease-in-out infinite reverse",
          }}
        />
        <div
          className={`absolute bottom-1/3 left-1/4 h-[450px] w-[450px] rounded-full blur-[110px] transition-opacity duration-1000 ${
            currentView === "forgot" ? "opacity-15" : "opacity-0"
          }`}
          style={{
            background: "radial-gradient(circle, #f59e0b, transparent 70%)",
            animation: "float2 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <ParticleBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:justify-between lg:px-16">
        <DataGovernancePanel />

        <div className="w-full max-w-md">
          <div
            className={`transition-all duration-300 ${
              isTransitioning ? "translate-y-4 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"
            }`}
          >
            {currentView === "login" && (
              <LoginForm
                onSwitchToRegister={() => switchView("register")}
                onSwitchToForgotPassword={() => switchView("forgot")}
                onLoginSuccess={handleLoginSuccess}
              />
            )}
            {currentView === "register" && <RegisterForm onSwitchToLogin={() => switchView("login")} />}
            {currentView === "forgot" && <ForgotPasswordForm onSwitchToLogin={() => switchView("login")} />}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 select-none text-center text-[11px] text-slate-600">
        数据安全监管 © 2026 DGP DataForge Inc. 保留所有权利。
      </div>
    </div>
  );
}

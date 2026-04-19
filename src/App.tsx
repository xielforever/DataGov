import { useState } from "react";
import ParticleBackground from "./components/common/ParticleBackground";
import LoginForm from "./pages/auth/LoginForm";
import RegisterForm from "./pages/auth/RegisterForm";
import ForgotPasswordForm from "./pages/auth/ForgotPasswordForm";
import DataGovernancePanel from "./pages/dashboard/DataGovernancePanel";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/dashboard/Dashboard";
import AssetOverview from "./pages/asset/AssetOverview";
import AssetRegister from "./pages/asset/AssetRegister";
import DataCatalog from "./pages/asset/DataCatalog";
import DataMap from "./pages/asset/DataMap";
import DataLineage from "./pages/asset/DataLineage";
import DataSource from "./pages/metadata/DataSource";
import MetadataModel from "./pages/metadata/MetadataModel";
import MetadataCollect from "./pages/metadata/MetadataCollect";
import MetadataManage from "./pages/metadata/MetadataManage";
import MetadataQuery from "./pages/metadata/MetadataQuery";
import DataModeling from "./pages/development/DataModeling";
import DataSync from "./pages/development/DataSync";
import RealtimeCompute from "./pages/development/RealtimeCompute";
import ScriptDev from "./pages/development/ScriptDev";
import TaskOrchestration from "./pages/development/TaskOrchestration";
import MetricManage from "./pages/quality/MetricManage";
import DataServiceApi from "./pages/service/DataServiceApi";
import DataSharing from "./pages/service/DataSharing";
import OperationsMonitor from "./pages/quality/OperationsMonitor";
import StandardDef from "./pages/standard/StandardDef";
import StandardMap from "./pages/standard/StandardMap";
import StandardEval from "./pages/standard/StandardEval";
import DataDict from "./pages/standard/DataDict";
import CodeManage from "./pages/standard/CodeManage";
import ApprovalCenter from "./pages/approvals/ApprovalCenter";
import { Toaster } from 'react-hot-toast';

type AuthView = "login" | "register" | "forgot";

export default function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          className: '!bg-slate-800 !text-white !border !border-slate-700',
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");

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
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView("login");
  };

  // 登录后显示首页仪表盘
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeMenu={activeMenu}
          onMenuSelect={setActiveMenu}
        />
        <Header sidebarCollapsed={sidebarCollapsed} onLogout={handleLogout} />
        <main
          className={`pt-16 transition-all duration-300 ${
            sidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          <div className="p-6">
            {activeMenu === "asset-overview" ? <AssetOverview /> : 
             activeMenu === "asset-register" ? <AssetRegister /> : 
             activeMenu === "data-catalog" ? <DataCatalog /> :
             activeMenu === "data-map" ? <DataMap /> :
             activeMenu === "data-lineage" ? <DataLineage /> :
             activeMenu === "data-source" ? <DataSource /> :
             activeMenu === "metadata-model" ? <MetadataModel /> :
             activeMenu === "metadata-collect" ? <MetadataCollect /> :
             activeMenu === "metadata-manage" ? <MetadataManage /> :
             activeMenu === "metadata-query" ? <MetadataQuery /> :
             activeMenu === "data-modeling" ? <DataModeling /> :
             activeMenu === "data-sync" ? <DataSync /> :
             activeMenu === "realtime-compute" ? <RealtimeCompute /> :
             activeMenu === "script-dev" ? <ScriptDev /> :
             activeMenu === "task-orchestration" ? <TaskOrchestration /> :
             activeMenu === "metric-manage" ? <MetricManage /> :
             activeMenu === "data-service-api" ? <DataServiceApi /> :
             activeMenu === "data-sharing" ? <DataSharing /> :
             activeMenu === "ops-monitor" ? <OperationsMonitor /> :
             activeMenu === "standard-def" ? <StandardDef /> :
             activeMenu === "standard-map" ? <StandardMap /> :
             activeMenu === "standard-eval" ? <StandardEval /> :
             activeMenu === "data-dict" ? <DataDict /> :
             activeMenu === "code-manage" ? <CodeManage /> :
             activeMenu === "approvals-todos" ? <ApprovalCenter viewType="todos" /> :
             activeMenu === "approvals-applies" ? <ApprovalCenter viewType="applies" /> :
             activeMenu === "approvals-processed" ? <ApprovalCenter viewType="processed" /> :
             <Dashboard />}
          </div>
        </main>
      </div>
    );
  }

  // 登录前显示认证页面
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030614]">
      {/* 动画发光光环，主色调：青色，蓝黑色 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* 光球 1 */}
        <div
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #06b6d4, transparent 70%)",
            animation: "float1 12s ease-in-out infinite",
          }}
        />
        {/* 光球 2 */}
        <div
          className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full opacity-10 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #4338ca, transparent 70%)",
            animation: "float2 16s ease-in-out infinite",
          }}
        />
        {/* 光球 3 - 注册页面时增加一个绿色光球 */}
        <div
          className={`absolute top-1/2 right-1/4 h-[400px] w-[400px] rounded-full blur-[100px] transition-opacity duration-1000 ${
            currentView === "register" ? "opacity-15" : "opacity-0"
          }`}
          style={{
            background: "radial-gradient(circle, #10b981, transparent 70%)",
            animation: "float1 14s ease-in-out infinite reverse",
          }}
        />
        {/* 光球 4 - 忘记密码页面时显示琥珀色警示光球 */}
        <div
          className={`absolute bottom-1/3 left-1/4 h-[450px] w-[450px] rounded-full blur-[110px] transition-opacity duration-1000 ${
            currentView === "forgot" ? "opacity-15" : "opacity-0"
          }`}
          style={{
            background: "radial-gradient(circle, #f59e0b, transparent 70%)",
            animation: "float2 18s ease-in-out infinite",
          }}
        />
        {/* 背景辅助网格 */}
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

      {/* 动态粒子节点网络 */}
      <ParticleBackground />

      {/* 主界面内容：横向网格双翼布局 */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-center lg:justify-between px-4 sm:px-6 lg:px-16">
        <DataGovernancePanel />

        {/* 右侧表单区域带切换动画 */}
        <div className="w-full max-w-md">
          <div
            className={`transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 translate-y-4 scale-95"
                : "opacity-100 translate-y-0 scale-100"
            }`}
          >
            {currentView === "login" && (
              <LoginForm
                onSwitchToRegister={() => switchView("register")}
                onSwitchToForgotPassword={() => switchView("forgot")}
                onLoginSuccess={handleLoginSuccess}
              />
            )}
            {currentView === "register" && (
              <RegisterForm onSwitchToLogin={() => switchView("login")} />
            )}
            {currentView === "forgot" && (
              <ForgotPasswordForm onSwitchToLogin={() => switchView("login")} />
            )}
          </div>
        </div>
      </div>

      {/* 底部合规声明 */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-slate-600 select-none">
        数据安全监管 © 2026 DGP DataForge Inc. 保留所有权利。
      </div>
    </div>
  );
}

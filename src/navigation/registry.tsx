import type { ReactNode } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Database,
  FileText,
  Home,
  LayoutDashboard,
  Server,
  Settings,
  ShieldCheck,
} from "lucide-react";
import GovernanceHome from "../pages/home/GovernanceHome";
import Dashboard from "../pages/dashboard/Dashboard";
import AssetOverview from "../pages/asset/AssetOverview";
import BusinessDomainManage from "../pages/asset/BusinessDomainManage";
import AssetRegister from "../pages/asset/AssetRegister";
import DataCatalog from "../pages/asset/DataCatalog";
import DataMap from "../pages/asset/DataMap";
import DataLineage from "../pages/asset/DataLineage";
import DataSource from "../pages/metadata/DataSource";
import MetadataModel from "../pages/metadata/MetadataModel";
import MetadataCollect from "../pages/metadata/MetadataCollect";
import MetadataManage from "../pages/metadata/MetadataManage";
import MetadataQuery from "../pages/metadata/MetadataQuery";
import DataModeling from "../pages/development/DataModeling";
import DataSync from "../pages/development/DataSync";
import RealtimeCompute from "../pages/development/RealtimeCompute";
import ScriptDev from "../pages/development/ScriptDev";
import TaskOps from "../pages/development/TaskOps";
import TaskOrchestration from "../pages/development/TaskOrchestration";
import TaskSchedule from "../pages/development/TaskSchedule";
import QualityCheck from "../pages/quality/QualityCheck";
import QualityMonitor from "../pages/quality/QualityMonitor";
import QualityReport from "../pages/quality/QualityReport";
import QualityRules from "../pages/quality/QualityRules";
import MetricManage from "../pages/quality/MetricManage";
import DataServiceApi from "../pages/service/DataServiceApi";
import DataSharing from "../pages/service/DataSharing";
import OperationsMonitor from "../pages/quality/OperationsMonitor";
import AccessControl from "../pages/security/AccessControl";
import AuditLog from "../pages/security/AuditLog";
import DataMask from "../pages/security/DataMask";
import SecurityLevel from "../pages/security/SecurityLevel";
import SensitiveScan from "../pages/security/SensitiveScan";
import StandardDef from "../pages/standard/StandardDef";
import StandardMap from "../pages/standard/StandardMap";
import StandardEval from "../pages/standard/StandardEval";
import DataDict from "../pages/standard/DataDict";
import CodeManage from "../pages/standard/CodeManage";
import ApprovalCenter from "../pages/approvals/ApprovalCenter";
import UserManage from "../pages/system/UserManage";
import RoleManage from "../pages/system/RoleManage";
import OrgManage from "../pages/system/OrgManage";
import NotificationManage from "../pages/system/NotificationManage";
import OperationLog from "../pages/system/OperationLog";
import SystemConfig from "../pages/system/SystemConfig";

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
  requiredPermissions?: string[];
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    id: "home",
    label: "首页",
    icon: <Home className="h-5 w-5" />,
  },
  {
    id: "dashboard",
    label: "工作台",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: "data-asset",
    label: "数据资产",
    icon: <Database className="h-5 w-5" />,
    children: [
      { id: "asset-overview", label: "资产总览" },
      { id: "business-domain", label: "业务域管理" },
      { id: "asset-register", label: "资产注册" },
      { id: "data-catalog", label: "数据目录" },
      { id: "data-map", label: "数据地图" },
      { id: "data-lineage", label: "数据血缘" },
      { id: "data-source", label: "数据源管理", requiredPermissions: ["metadata:data_sources:read"] },
    ],
  },
  {
    id: "metadata",
    label: "元数据管理",
    icon: <FileText className="h-5 w-5" />,
    children: [
      { id: "metadata-model", label: "元数据模型" },
      { id: "metadata-collect", label: "元数据采集" },
      { id: "metadata-manage", label: "元数据维护" },
      { id: "metadata-query", label: "元数据查询" },
    ],
  },
  {
    id: "data-standard",
    label: "数据标准",
    icon: <ClipboardCheck className="h-5 w-5" />,
    children: [
      { id: "standard-def", label: "标准定义" },
      { id: "standard-map", label: "标准映射" },
      { id: "standard-eval", label: "标准评估" },
      { id: "data-dict", label: "数据字典" },
      { id: "code-manage", label: "码值管理" },
    ],
  },
  {
    id: "data-quality",
    label: "数据质量",
    icon: <CheckCircle2 className="h-5 w-5" />,
    badge: 3,
    children: [
      { id: "quality-rules", label: "质量规则" },
      { id: "quality-check", label: "质量核查" },
      { id: "quality-monitor", label: "质量监控" },
      { id: "quality-report", label: "质量报告" },
    ],
  },
  {
    id: "data-security",
    label: "数据安全",
    icon: <ShieldCheck className="h-5 w-5" />,
    children: [
      { id: "security-level", label: "安全分级" },
      { id: "sensitive-scan", label: "敏感数据识别" },
      { id: "data-mask", label: "数据脱敏" },
      { id: "access-control", label: "访问控制" },
      { id: "audit-log", label: "审计日志" },
    ],
  },
  {
    id: "data-develop",
    label: "数据开发",
    icon: <Code2 className="h-5 w-5" />,
    children: [
      { id: "data-modeling", label: "数据建模" },
      { id: "script-dev", label: "脚本开发", requiredPermissions: ["development:scripts:read"] },
      { id: "task-orchestration", label: "任务编排" },
      { id: "task-schedule", label: "任务调度" },
      { id: "realtime-compute", label: "实时计算" },
      { id: "data-sync", label: "数据同步" },
      { id: "task-ops", label: "任务运维" },
    ],
  },
  {
    id: "data-service",
    label: "数据服务",
    icon: <Server className="h-5 w-5" />,
    children: [
      { id: "metric-manage", label: "指标管理" },
      { id: "data-service-api", label: "数据服务" },
      { id: "data-sharing", label: "数据共享" },
    ],
  },
  {
    id: "approvals",
    label: "审批中心",
    icon: <CheckCircle2 className="h-5 w-5" />,
    requiredPermissions: ["approvals:requests:read"],
    children: [
      { id: "approvals-todos", label: "待我审批", requiredPermissions: ["approvals:requests:read"] },
      { id: "approvals-applies", label: "我发起的", requiredPermissions: ["approvals:requests:read"] },
      { id: "approvals-processed", label: "已处理", requiredPermissions: ["approvals:requests:read"] },
    ],
  },
  {
    id: "system-manage",
    label: "系统管理",
    icon: <Settings className="h-5 w-5" />,
    requiredPermissions: ["system:manage"],
    children: [
      { id: "user-manage", label: "用户管理", requiredPermissions: ["system:manage"] },
      { id: "role-manage", label: "角色管理", requiredPermissions: ["system:manage"] },
      { id: "org-manage", label: "组织管理", requiredPermissions: ["system:manage"] },
      { id: "notification", label: "消息通知", requiredPermissions: ["system:manage"] },
      { id: "operation-log", label: "操作日志", requiredPermissions: ["system:manage"] },
      { id: "ops-monitor", label: "运维监控", requiredPermissions: ["system:manage"] },
      { id: "system-config", label: "系统配置", requiredPermissions: ["system:manage"] },
    ],
  },
];

export const routeViews: Record<string, ReactNode> = {
  home: <GovernanceHome />,
  dashboard: <Dashboard />,
  "asset-overview": <AssetOverview />,
  "business-domain": <BusinessDomainManage />,
  "asset-register": <AssetRegister />,
  "data-catalog": <DataCatalog />,
  "data-map": <DataMap />,
  "data-lineage": <DataLineage />,
  "data-source": <DataSource />,
  "metadata-model": <MetadataModel />,
  "metadata-collect": <MetadataCollect />,
  "metadata-manage": <MetadataManage />,
  "metadata-query": <MetadataQuery />,
  "standard-def": <StandardDef />,
  "standard-map": <StandardMap />,
  "standard-eval": <StandardEval />,
  "data-dict": <DataDict />,
  "code-manage": <CodeManage />,
  "quality-rules": <QualityRules />,
  "quality-check": <QualityCheck />,
  "quality-monitor": <QualityMonitor />,
  "quality-report": <QualityReport />,
  "security-level": <SecurityLevel />,
  "sensitive-scan": <SensitiveScan />,
  "data-mask": <DataMask />,
  "access-control": <AccessControl />,
  "audit-log": <AuditLog />,
  "data-modeling": <DataModeling />,
  "script-dev": <ScriptDev />,
  "task-orchestration": <TaskOrchestration />,
  "task-schedule": <TaskSchedule />,
  "realtime-compute": <RealtimeCompute />,
  "data-sync": <DataSync />,
  "task-ops": <TaskOps />,
  "metric-manage": <MetricManage />,
  "data-service-api": <DataServiceApi />,
  "data-sharing": <DataSharing />,
  "approvals-todos": <ApprovalCenter viewType="todos" />,
  "approvals-applies": <ApprovalCenter viewType="applies" />,
  "approvals-processed": <ApprovalCenter viewType="processed" />,
  "user-manage": <UserManage />,
  "role-manage": <RoleManage />,
  "org-manage": <OrgManage />,
  notification: <NotificationManage />,
  "operation-log": <OperationLog />,
  "ops-monitor": <OperationsMonitor />,
  "system-config": <SystemConfig />,
};

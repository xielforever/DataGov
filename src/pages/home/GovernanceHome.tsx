import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Database,
  FileSearch,
  GitBranch,
  Layers3,
  Network,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type LifecycleDomain = "规划准入" | "治理资产" | "加工供给" | "运营闭环";

type LifecycleStage = {
  phase: string;
  title: string;
  module: string;
  flow: string;
  gate: string;
  view: string;
  icon: LucideIcon;
  tone: string;
  domain: LifecycleDomain;
};

type ControlItem = {
  name: string;
  desc: string;
  state: "正常" | "关注" | "阻断";
  view: string;
};

type WorkItem = {
  title: string;
  desc: string;
  owner: string;
  severity: "P1" | "P2" | "P3";
  view: string;
};

const lifecycleStages: LifecycleStage[] = [
  {
    phase: "01",
    title: "数据规划",
    module: "审批中心 / 组织管理",
    flow: "业务目标、用数需求 -> 数据责任、范围、申请单",
    gate: "无责任边界不启动",
    view: "approvals-todos",
    icon: ClipboardCheck,
    tone: "amber",
    domain: "规划准入",
  },
  {
    phase: "02",
    title: "来源登记",
    module: "数据源管理",
    flow: "系统、接口、文件、Topic -> 可管控数据源",
    gate: "源未登记不采集",
    view: "data-source",
    icon: Database,
    tone: "cyan",
    domain: "规划准入",
  },
  {
    phase: "03",
    title: "采集入湖",
    module: "数据同步 / 实时计算",
    flow: "批流数据、接口数据 -> ODS / 明细原始数据",
    gate: "链路、频率、失败重试可追溯",
    view: "data-sync",
    icon: RotateCcw,
    tone: "sky",
    domain: "规划准入",
  },
  {
    phase: "04",
    title: "元数据血缘",
    module: "元数据管理 / 数据血缘",
    flow: "表、字段、作业、依赖 -> 技术元数据与影响关系",
    gate: "关键链路无血缘预警",
    view: "metadata-query",
    icon: FileSearch,
    tone: "teal",
    domain: "治理资产",
  },
  {
    phase: "05",
    title: "资产编目",
    module: "数据目录 / 数据地图",
    flow: "元数据、责任边界 -> 可发现、可运营资产",
    gate: "无 Owner 不发布",
    view: "data-catalog",
    icon: Boxes,
    tone: "teal",
    domain: "治理资产",
  },
  {
    phase: "06",
    title: "标准口径",
    module: "标准定义 / 字典 / 码值",
    flow: "字段、术语、指标 -> 统一口径、码值和映射",
    gate: "核心字段必须映射",
    view: "standard-map",
    icon: ClipboardCheck,
    tone: "amber",
    domain: "治理资产",
  },
  {
    phase: "07",
    title: "可信合规",
    module: "质量核查 / 安全分级",
    flow: "资产、规则、敏感特征 -> 质量评分、安全标签、脱敏策略",
    gate: "低分或未分级阻断",
    view: "quality-check",
    icon: ShieldCheck,
    tone: "rose",
    domain: "加工供给",
  },
  {
    phase: "08",
    title: "建模加工",
    module: "数据建模 / 脚本开发",
    flow: "合规资产、加工需求 -> DWD / DWS / ADS、任务脚本",
    gate: "开发规范与环境校验",
    view: "data-modeling",
    icon: Code2,
    tone: "violet",
    domain: "加工供给",
  },
  {
    phase: "09",
    title: "编排调度",
    module: "任务编排 / 任务调度",
    flow: "模型、脚本、同步任务 -> DAG、周期、依赖、告警",
    gate: "依赖闭环后上线",
    view: "task-orchestration",
    icon: GitBranch,
    tone: "cyan",
    domain: "加工供给",
  },
  {
    phase: "10",
    title: "服务共享",
    module: "指标管理 / 数据服务 / 数据共享",
    flow: "数据产品、指标、服务申请 -> API、指标、共享数据集",
    gate: "审批授权后消费",
    view: "data-service-api",
    icon: Network,
    tone: "lime",
    domain: "运营闭环",
  },
  {
    phase: "11",
    title: "消费运营",
    module: "任务运维 / 运维监控 / 审计日志",
    flow: "访问、调用、任务、审计日志 -> SLA、热度、成本、问题单",
    gate: "异常闭环后归档",
    view: "task-ops",
    icon: AlertTriangle,
    tone: "sky",
    domain: "运营闭环",
  },
  {
    phase: "12",
    title: "归档退役",
    module: "数据地图 / 审计日志",
    flow: "低价值、过期、停用资产 -> 归档记录、下线审批、影响通知",
    gate: "血缘影响确认后退役",
    view: "data-map",
    icon: Archive,
    tone: "rose",
    domain: "运营闭环",
  },
];

const controlItems: ControlItem[] = [
  { name: "责任控制", desc: "来源、资产、服务都有 Owner 和组织边界", state: "关注", view: "org-manage" },
  { name: "质量控制", desc: "采集后、加工后、发布前三处校验", state: "关注", view: "quality-rules" },
  { name: "安全控制", desc: "分级分类、敏感识别、脱敏和访问策略", state: "阻断", view: "security-level" },
  { name: "标准控制", desc: "术语、码值、指标和字段映射统一管理", state: "关注", view: "standard-def" },
  { name: "审计控制", desc: "申请、变更、授权、消费和退役全程留痕", state: "正常", view: "audit-log" },
];

const lifecycleSignals = [
  { label: "准入缺口", value: "6", desc: "源、Owner、申请待补齐" },
  { label: "发布阻断", value: "1", desc: "安全分级未完成" },
  { label: "退役待审", value: "4", desc: "低价值资产待归档" },
];

const workItems: WorkItem[] = [
  {
    title: "补齐来源责任",
    desc: "6 个源系统缺少 Owner 或组织边界，影响采集准入。",
    owner: "组织管理员",
    severity: "P1",
    view: "org-manage",
  },
  {
    title: "安全分级阻断",
    desc: "生产域 7 张表未绑定安全级别，禁止对外共享。",
    owner: "安全管理员",
    severity: "P1",
    view: "security-level",
  },
  {
    title: "血缘完整性复核",
    desc: "关键调度链路缺少下游影响关系，退役审批需要补证据。",
    owner: "元数据管理员",
    severity: "P2",
    view: "data-lineage",
  },
  {
    title: "低价值资产退役",
    desc: "4 项低访问资产待确认归档范围和通知对象。",
    owner: "资产 Owner",
    severity: "P3",
    view: "data-map",
  },
];

const domains: LifecycleDomain[] = ["规划准入", "治理资产", "加工供给", "运营闭环"];

const toneClass: Record<string, string> = {
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  teal: "border-teal-400/30 bg-teal-400/10 text-teal-200",
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  rose: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  violet: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  lime: "border-lime-300/30 bg-lime-300/10 text-lime-200",
};

const controlStateClass: Record<ControlItem["state"], string> = {
  正常: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  关注: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  阻断: "border-rose-400/25 bg-rose-400/10 text-rose-200",
};

const severityClass: Record<WorkItem["severity"], string> = {
  P1: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  P2: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  P3: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
};

const domainClass: Record<LifecycleDomain, string> = {
  规划准入: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
  治理资产: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  加工供给: "border-violet-400/25 bg-violet-400/10 text-violet-200",
  运营闭环: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
};

const navigateTo = (view: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set("view", view);
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

function FlowArrow() {
  return (
    <div className="pointer-events-none hidden items-center justify-center lg:flex">
      <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/55 via-cyan-300/35 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.18)]" />
      <div className="-ml-2 flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/40 bg-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.22)]">
        <ArrowRight className="h-3 w-3 text-cyan-200" />
      </div>
    </div>
  );
}

function LifecycleNode({ stage }: { stage: LifecycleStage }) {
  const Icon = stage.icon;

  return (
    <button
      type="button"
      onClick={() => navigateTo(stage.view)}
      className="group min-w-0 rounded-md border border-slate-700/80 bg-slate-900/90 p-2.5 text-left shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:border-cyan-400/50 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`rounded border px-1.5 py-1 text-[11px] font-semibold ${toneClass[stage.tone]}`}>{stage.phase}</span>
          <span className={`rounded border p-1 ${toneClass[stage.tone]}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="truncate text-sm font-semibold text-white">{stage.title}</div>
        </div>
        <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-600 transition group-hover:text-cyan-300" />
      </div>

      <div className="mt-2 space-y-1 border-t border-slate-800 pt-1.5 text-[11px]">
        <div className="truncate text-cyan-100">{stage.flow}</div>
        <div className="truncate text-slate-500">
          {stage.module} / 门禁：{stage.gate}
        </div>
      </div>
    </button>
  );
}

function DomainProgress() {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/65 p-3">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)_28px_minmax(0,1fr)_28px_minmax(0,1fr)]">
        {domains.map((domain, index) => (
          <div key={domain} className="contents">
            <div className={`rounded border px-3 py-2 text-center text-xs font-medium ${domainClass[domain]}`}>{domain}</div>
            {index < domains.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>
    </div>
  );
}

function LifecycleDomainRow({ domain, stages }: { domain: LifecycleDomain; stages: LifecycleStage[] }) {
  return (
    <div className="rounded-md border border-slate-800/90 bg-slate-950/55 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded border px-2 py-0.5 text-xs font-medium ${domainClass[domain]}`}>{domain}</span>
          <span className="text-xs text-slate-500">
            {stages[0].phase}-{stages[stages.length - 1].phase}
          </span>
        </div>
        <span className="text-[11px] text-slate-500">{stages.length} 个环节</span>
      </div>

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)]">
        {stages.map((stage, index) => (
          <div key={stage.phase} className="contents">
            <LifecycleNode stage={stage} />
            {index < stages.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>
    </div>
  );
}

function GovernanceControlStrip() {
  return (
    <div className="rounded-md border border-cyan-400/20 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-200">
        <GitBranch className="h-3.5 w-3.5" />
        横向治理控制贯穿全生命周期
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {controlItems.map((control) => (
          <button
            key={control.name}
            type="button"
            onClick={() => navigateTo(control.view)}
            className="rounded border border-slate-800 bg-slate-900/70 px-2 py-1.5 text-left transition hover:border-cyan-400/35"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-slate-100">{control.name}</span>
              <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${controlStateClass[control.state]}`}>{control.state}</span>
            </div>
            <div className="mt-1 truncate text-[10px] text-slate-500">{control.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function LifecycleMap() {
  return (
    <section className="relative overflow-hidden rounded-lg border border-slate-700/70 bg-slate-950 shadow-xl shadow-slate-950/30">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.055)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="relative z-10 border-b border-slate-800/80 bg-slate-950/85 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers3 className="h-4 w-4 text-cyan-300" />
            数据全生命周期地图
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            12 环节覆盖数据全域
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-3 p-4">
        <DomainProgress />
        <GovernanceControlStrip />
        {domains.map((domain) => (
          <LifecycleDomainRow key={domain} domain={domain} stages={lifecycleStages.filter((stage) => stage.domain === domain)} />
        ))}
      </div>

      <div className="relative z-10 grid border-t border-slate-800 bg-slate-950/70 px-4 py-3 text-xs lg:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-2 text-slate-400">
          <RotateCcw className="h-4 w-4 text-cyan-300" />
          消费运营和归档退役结果会回写来源、标准、质量、安全和资产责任规则。
        </div>
        <button type="button" onClick={() => navigateTo("data-map")} className="mt-2 flex items-center gap-1 text-cyan-300 hover:text-cyan-200 lg:mt-0">
          查看数据地图 <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

function GovernanceControlPanel() {
  return (
    <aside className="flex flex-col gap-4">
      <section className="rounded-lg border border-slate-700/70 bg-slate-900/85">
        <div className="border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            待治理事项
          </div>
          <p className="mt-1 text-xs text-slate-500">聚合影响生命周期流转的异常和待办</p>
        </div>
        <div className="divide-y divide-slate-800">
          {workItems.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => navigateTo(item.view)}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 text-left transition hover:bg-slate-950/45"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">{item.title}</span>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${severityClass[item.severity]}`}>{item.severity}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{item.desc}</p>
                <div className="mt-1 text-[11px] text-slate-500">责任方：{item.owner}</div>
              </div>
              <ArrowRight className="mt-1 h-3.5 w-3.5 text-slate-600" />
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700/70 bg-slate-900/85">
        <div className="border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <CheckCircle2 className="h-4 w-4 text-cyan-300" />
            风险信号
          </div>
          <p className="mt-1 text-xs text-slate-500">只保留影响流转的风险，不重复主图环节和控制项</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-800">
          {lifecycleSignals.map((signal) => (
            <div key={signal.label} className="px-3 py-4 text-center">
              <div className="text-2xl font-semibold text-white">{signal.value}</div>
              <div className="mt-1 text-xs text-slate-300">{signal.label}</div>
              <div className="mt-1 text-[10px] leading-4 text-slate-500">{signal.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
        <div className="text-sm font-semibold text-cyan-100">处置建议</div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          优先处理 P1 阻断项，先补齐来源责任和安全分级，再复核血缘完整性，最后推进低价值资产退役。
        </p>
      </section>
    </aside>
  );
}

function GovernanceHome() {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div>
          <div className="text-xs font-medium text-cyan-300">数据治理平台首页</div>
          <h1 className="mt-2 text-2xl font-bold text-white">数据全生命周期治理总览</h1>
          <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-400">
            首页按“规划准入、治理资产、加工供给、运营闭环”组织数据从产生、入湖、资产化、治理、加工、服务、消费到归档退役的完整路径，开发只是其中一段。
          </p>
        </div>
      </header>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <LifecycleMap />
        <GovernanceControlPanel />
      </div>
    </div>
  );
}

export default GovernanceHome;

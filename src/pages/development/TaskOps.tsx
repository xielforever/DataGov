import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Cpu,
  FileText,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Square,
  TerminalSquare,
  TimerReset,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  fetchTaskOpsAlerts,
  fetchTaskOpsInstances,
  fetchTaskOpsLogs,
  fetchTaskOpsOverview,
  fetchTaskOpsQueues,
  fetchTaskOpsRecoveryPlans,
  rerunTaskInstance,
  stopTaskInstance,
  updateTaskOpsAlertStatus,
  updateTaskOpsRecoveryPlanStatus,
} from "../../services/api";

type InstanceStatus = "success" | "running" | "failed" | "waiting" | "delayed";
type Priority = "high" | "medium" | "low";
type LogLevel = "info" | "warn" | "error";
type RecoveryStatus = "open" | "reviewing" | "closed";
type AlertStatus = "enabled" | "paused";
type QueueStatus = "busy" | "normal" | "idle";

interface TaskOpsOverview {
  todayInstances: number;
  runningInstances: number;
  failedInstances: number;
  delayedInstances: number;
  avgRecoveryMinutes: number;
  queuePressure: number;
}

interface TaskInstance {
  id: string;
  taskName: string;
  instanceId: string;
  bizDate: string;
  status: InstanceStatus;
  priority: Priority;
  owner: string;
  resourceGroup: string;
  startTime: string;
  endTime: string;
  duration: string;
  retryCount: number;
  errorMessage: string;
}

interface TaskLog {
  id: string;
  instanceId: string;
  level: LogLevel;
  time: string;
  message: string;
}

interface RecoveryPlan {
  id: string;
  instanceId: string;
  taskName: string;
  planType: string;
  status: RecoveryStatus;
  owner: string;
  createdAt: string;
  impact: string;
  suggestion: string;
}

interface OpsAlert {
  id: string;
  name: string;
  condition: string;
  channels: string;
  subscribers: number;
  status: AlertStatus;
  lastTriggered: string;
}

interface ResourceQueue {
  id: string;
  name: string;
  running: number;
  waiting: number;
  capacity: number;
  status: QueueStatus;
  owner: string;
}

const statusConfig: Record<InstanceStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  success: { label: "成功", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  running: { label: "运行中", color: "text-cyan-300", bg: "bg-cyan-500/15", dot: "bg-cyan-400 animate-pulse", border: "border-cyan-500/30" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400", border: "border-red-500/30" },
  waiting: { label: "等待", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400", border: "border-slate-500/30" },
  delayed: { label: "延迟", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400", border: "border-amber-500/30" },
};

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: "高", color: "text-red-300", bg: "bg-red-500/15" },
  medium: { label: "中", color: "text-amber-300", bg: "bg-amber-500/15" },
  low: { label: "低", color: "text-slate-300", bg: "bg-slate-500/15" },
};

const logConfig: Record<LogLevel, { label: string; color: string; bg: string }> = {
  info: { label: "INFO", color: "text-cyan-200", bg: "bg-cyan-500/10" },
  warn: { label: "WARN", color: "text-amber-200", bg: "bg-amber-500/10" },
  error: { label: "ERROR", color: "text-red-200", bg: "bg-red-500/10" },
};

const recoveryConfig: Record<RecoveryStatus, { label: string; color: string; bg: string; dot: string }> = {
  open: { label: "待处理", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
  reviewing: { label: "处理中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  closed: { label: "已关闭", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
};

const queueConfig: Record<QueueStatus, { label: string; color: string; bg: string }> = {
  busy: { label: "繁忙", color: "text-amber-300", bg: "bg-amber-500/15" },
  normal: { label: "正常", color: "text-emerald-300", bg: "bg-emerald-500/15" },
  idle: { label: "空闲", color: "text-slate-300", bg: "bg-slate-500/15" },
};

export default function TaskOps() {
  const [overview, setOverview] = useState<TaskOpsOverview | null>(null);
  const [instances, setInstances] = useState<TaskInstance[]>([]);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [recoveryPlans, setRecoveryPlans] = useState<RecoveryPlan[]>([]);
  const [alerts, setAlerts] = useState<OpsAlert[]>([]);
  const [queues, setQueues] = useState<ResourceQueue[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | InstanceStatus>("all");
  const [selectedInstance, setSelectedInstance] = useState<TaskInstance | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, instanceData, logData, recoveryData, alertData, queueData] = await Promise.all([
        fetchTaskOpsOverview(),
        fetchTaskOpsInstances({ keyword, status: selectedStatus }),
        fetchTaskOpsLogs(),
        fetchTaskOpsRecoveryPlans(),
        fetchTaskOpsAlerts(),
        fetchTaskOpsQueues(),
      ]);
      setOverview(overviewData);
      setInstances(instanceData);
      setLogs(logData);
      setRecoveryPlans(recoveryData);
      setAlerts(alertData);
      setQueues(queueData);
      setSelectedInstance((current) => current ?? instanceData[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInstances = useMemo(() => {
    return instances.filter((instance) => {
      if (selectedStatus !== "all" && instance.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${instance.taskName} ${instance.instanceId} ${instance.owner} ${instance.resourceGroup}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [instances, keyword, selectedStatus]);

  const selectedLogs = useMemo(() => {
    if (!selectedInstance) return logs;
    return logs.filter((log) => log.instanceId === selectedInstance.instanceId);
  }, [logs, selectedInstance]);

  const statusSummary = useMemo(() => {
    const map = new Map<InstanceStatus, number>();
    instances.forEach((instance) => map.set(instance.status, (map.get(instance.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [instances]);

  const maxStatusCount = Math.max(...statusSummary.map((item) => item.count), 1);

  const searchInstances = async () => {
    const data = await fetchTaskOpsInstances({ keyword, status: selectedStatus });
    setInstances(data);
    setSelectedInstance(data[0] ?? null);
  };

  const rerunInstance = async (instance: TaskInstance) => {
    const updated = await rerunTaskInstance(instance.id);
    setInstances((prev) => prev.map((item) => (item.id === instance.id ? updated : item)));
    setSelectedInstance((current) => (current?.id === instance.id ? updated : current));
  };

  const stopInstance = async (instance: TaskInstance) => {
    const updated = await stopTaskInstance(instance.id);
    setInstances((prev) => prev.map((item) => (item.id === instance.id ? updated : item)));
    setSelectedInstance((current) => (current?.id === instance.id ? updated : current));
  };

  const updateRecovery = async (plan: RecoveryPlan, status: RecoveryStatus) => {
    const updated = await updateTaskOpsRecoveryPlanStatus(plan.id, status);
    setRecoveryPlans((prev) => prev.map((item) => (item.id === plan.id ? updated : item)));
  };

  const toggleAlert = async (alert: OpsAlert) => {
    const nextStatus: AlertStatus = alert.status === "enabled" ? "paused" : "enabled";
    const updated = await updateTaskOpsAlertStatus(alert.id, nextStatus);
    setAlerts((prev) => prev.map((item) => (item.id === alert.id ? updated : item)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载任务运维...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据开发" }, { label: "任务运维" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            任务运维
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              平均恢复 {overview.avgRecoveryMinutes} 分钟
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            面向运行实例、失败恢复、日志排查、资源队列和告警订阅的运维工作台，支撑调度链路稳定恢复。
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="今日实例" value={overview.todayInstances} desc={`${overview.runningInstances} 个运行中`} icon={Clock3} tone="text-cyan-300" />
        <KpiCard label="失败实例" value={overview.failedInstances} desc="需恢复或重跑" icon={AlertCircle} tone="text-red-300" />
        <KpiCard label="延迟实例" value={overview.delayedInstances} desc="超过调度窗口" icon={TimerReset} tone="text-amber-300" />
        <KpiCard label="队列压力" value={`${overview.queuePressure}%`} desc="核心资源组使用率" icon={Cpu} tone="text-blue-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <TerminalSquare className="h-4 w-4 text-cyan-300" />
                实例列表
              </h2>
              <p className="mt-1 text-xs text-slate-500">按任务实例、负责人、资源组和状态定位运行问题。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchInstances();
                  }}
                  placeholder="搜索实例、任务、资源组"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | InstanceStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="running">运行中</option>
                <option value="failed">失败</option>
                <option value="delayed">延迟</option>
                <option value="waiting">等待</option>
                <option value="success">成功</option>
              </select>
              <button onClick={searchInstances} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">筛选</button>
            </div>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {filteredInstances.map((instance) => {
              const status = statusConfig[instance.status];
              const priority = priorityConfig[instance.priority];
              const selected = selectedInstance?.id === instance.id;
              return (
                <article
                  key={instance.id}
                  onClick={() => setSelectedInstance(instance)}
                  className={`cursor-pointer rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${selected ? "border-cyan-500/60 ring-1 ring-cyan-500/20" : status.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <span className={`rounded px-2 py-1 text-xs ${priority.bg} ${priority.color}`}>{priority.label}优先级</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{instance.taskName}</h3>
                      <div className="mt-1 break-all font-mono text-xs text-cyan-100">{instance.instanceId}</div>
                    </div>
                    <div className="flex gap-1">
                      {(instance.status === "failed" || instance.status === "delayed") && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            rerunInstance(instance);
                          }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                          title="重跑"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      {instance.status === "running" && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            stopInstance(instance);
                          }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                          title="终止"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="业务日期" value={instance.bizDate} />
                    <Metric label="耗时" value={instance.duration} />
                    <Metric label="资源组" value={instance.resourceGroup} />
                    <Metric label="重试" value={instance.retryCount} />
                  </div>
                  {instance.errorMessage && <p className="mt-3 rounded-md border border-slate-800 bg-slate-900 p-2 text-xs leading-5 text-slate-400">{instance.errorMessage}</p>}
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <FileText className="h-4 w-4 text-cyan-300" />
              运行日志
            </h2>
            <p className="mt-1 text-xs text-slate-500">展示当前选中实例的关键日志片段。</p>
          </div>
          <div className="max-h-[560px] space-y-3 overflow-y-auto p-4">
            {selectedLogs.map((log) => {
              const config = logConfig[log.level];
              return (
                <article key={log.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded px-2 py-1 font-mono text-[11px] ${config.bg} ${config.color}`}>{config.label}</span>
                    <span className="text-xs text-slate-500">{log.time}</span>
                  </div>
                  <div className="mt-2 break-all font-mono text-xs text-slate-300">{log.instanceId}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{log.message}</p>
                </article>
              );
            })}
            {selectedLogs.length === 0 && <div className="py-10 text-center text-sm text-slate-500">当前实例暂无日志</div>}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              失败恢复
            </h2>
            <p className="mt-1 text-xs text-slate-500">将失败影响、恢复建议和处理状态沉淀为运维闭环。</p>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {recoveryPlans.map((plan) => {
              const status = recoveryConfig[plan.status];
              return (
                <article key={plan.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                      <h3 className="mt-2 text-sm font-medium text-white">{plan.taskName}</h3>
                      <div className="mt-1 text-xs text-slate-500">{plan.planType} · {plan.owner} · {plan.createdAt}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{plan.impact}</p>
                  <p className="mt-2 rounded-md border border-slate-800 bg-slate-900 p-2 text-xs leading-5 text-slate-400">{plan.suggestion}</p>
                  {plan.status !== "closed" && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={() => updateRecovery(plan, "reviewing")} className="rounded-md px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10">处理中</button>
                      <button onClick={() => updateRecovery(plan, "closed")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        关闭
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Cpu className="h-4 w-4 text-blue-300" />
              资源队列
            </h2>
            <p className="mt-1 text-xs text-slate-500">观察资源组运行、等待和容量压力。</p>
          </div>
          <div className="space-y-3 p-4">
            {queues.map((queue) => {
              const config = queueConfig[queue.status];
              return (
                <article key={queue.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs ${config.bg} ${config.color}`}>{config.label}</span>
                        <h3 className="text-sm font-medium text-white">{queue.name}</h3>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{queue.owner}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{queue.capacity}%</div>
                      <div className="text-[11px] text-slate-500">容量</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className={queue.capacity >= 80 ? "h-full rounded-full bg-amber-400" : "h-full rounded-full bg-cyan-400"} style={{ width: `${queue.capacity}%` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="运行" value={queue.running} />
                    <Metric label="等待" value={queue.waiting} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <Bell className="h-4 w-4 text-cyan-300" />
            告警订阅
          </h2>
          <p className="mt-1 text-xs text-slate-500">配置失败、延迟和资源压力的触达范围。</p>
        </div>
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          {alerts.map((alert) => (
            <article key={alert.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${alert.status === "enabled" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${alert.status === "enabled" ? "bg-emerald-400" : "bg-slate-400"}`} />
                    {alert.status === "enabled" ? "已启用" : "已暂停"}
                  </span>
                  <h3 className="mt-2 text-sm font-medium text-white">{alert.name}</h3>
                  <div className="mt-1 text-xs text-slate-500">{alert.channels}</div>
                </div>
                <button onClick={() => toggleAlert(alert)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
                  {alert.status === "enabled" ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">{alert.condition}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Metric label="订阅人" value={alert.subscribers} />
                <Metric label="最近触发" value={alert.lastTriggered} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <AlertCircle className="h-4 w-4 text-cyan-300" />
            实例状态分布
          </h2>
          <p className="mt-1 text-xs text-slate-500">基于当前实例池统计成功、运行、失败、等待和延迟分布。</p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
          {statusSummary.map((item) => {
            const config = statusConfig[item.status];
            return (
              <div key={item.status} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className={config.color}>{config.label}</span>
                  <span className="font-semibold text-white">{item.count}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / maxStatusCount) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  desc,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  desc: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          <div className="mt-1 text-xs text-slate-500">{desc}</div>
        </div>
        <div className={`rounded-lg border border-slate-700 bg-slate-950 p-2 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/70 p-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold text-slate-200">{value}</div>
    </div>
  );
}

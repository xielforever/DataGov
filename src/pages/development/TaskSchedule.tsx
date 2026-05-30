import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  GitBranch,
  History,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TimerReset,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  createTaskScheduleBackfill,
  fetchTaskScheduleBackfills,
  fetchTaskScheduleCalendars,
  fetchTaskScheduleDependencies,
  fetchTaskScheduleOverview,
  fetchTaskSchedules,
  runTaskSchedule,
  updateTaskScheduleStatus,
} from "../../services/api";
import ErrorFallback from '../../components/common/ErrorFallback';
import { TableSkeleton } from '../../components/common/Skeleton';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

type ScheduleStatus = "enabled" | "paused";
type RunStatus = "success" | "running" | "failed" | "waiting";
type Priority = "high" | "medium" | "low";
type DependencyStatus = "ready" | "waiting" | "failed";
type BackfillStatus = "running" | "waiting" | "success" | "failed";

interface ScheduleOverview {
  totalSchedules: number;
  runningToday: number;
  waitingInstances: number;
  failedInstances: number;
  onTimeRate: number;
  backfillTasks: number;
}

interface TaskScheduleItem {
  id: string;
  name: string;
  taskCode: string;
  taskType: string;
  owner: string;
  domain: string;
  cron: string;
  cycle: string;
  priority: Priority;
  status: ScheduleStatus;
  lastRunStatus: RunStatus;
  nextRunTime: string;
  avgDuration: string;
  resourceGroup: string;
  description: string;
}

interface ScheduleDependency {
  id: string;
  upstream: string;
  downstream: string;
  dependencyType: string;
  status: DependencyStatus;
  window: string;
  owner: string;
}

interface ScheduleCalendar {
  id: string;
  name: string;
  calendarType: string;
  boundTasks: number;
  nextHoliday: string;
  owner: string;
  status: ScheduleStatus;
}

interface BackfillTask {
  id: string;
  taskName: string;
  bizRange: string;
  status: BackfillStatus;
  progress: number;
  requester: string;
  strategy: string;
  createdAt: string;
}

const statusConfig: Record<ScheduleStatus, { label: string; color: string; bg: string; dot: string }> = {
  enabled: { label: "已启用", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  paused: { label: "已暂停", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400" },
};

const runStatusConfig: Record<RunStatus, { label: string; color: string; bg: string; dot: string }> = {
  success: { label: "成功", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  running: { label: "运行中", color: "text-cyan-300", bg: "bg-cyan-500/15", dot: "bg-cyan-400 animate-pulse" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
  waiting: { label: "等待", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400" },
};

const priorityConfig: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高优先级", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  medium: { label: "中优先级", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "低优先级", color: "text-slate-300", bg: "bg-slate-500/15", border: "border-slate-500/30" },
};

const dependencyConfig: Record<DependencyStatus, { label: string; color: string; bg: string; dot: string }> = {
  ready: { label: "已就绪", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  waiting: { label: "等待上游", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  failed: { label: "上游失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
};

const backfillConfig: Record<BackfillStatus, { label: string; color: string; bg: string; dot: string }> = {
  running: { label: "补数中", color: "text-cyan-300", bg: "bg-cyan-500/15", dot: "bg-cyan-400 animate-pulse" },
  waiting: { label: "等待中", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  success: { label: "已完成", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  failed: { label: "失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400" },
};

export default function TaskSchedule() {
  const [overview, setOverview] = useState<ScheduleOverview | null>(null);
  const [schedules, setSchedules] = useState<TaskScheduleItem[]>([]);
  const [dependencies, setDependencies] = useState<ScheduleDependency[]>([]);
  const [calendars, setCalendars] = useState<ScheduleCalendar[]>([]);
  const [backfills, setBackfills] = useState<BackfillTask[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | ScheduleStatus>("all");
  const [selectedCycle, setSelectedCycle] = useState("all");
  const [selectedSchedule, setSelectedSchedule] = useState<TaskScheduleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, scheduleData, dependencyData, calendarData, backfillData] = await Promise.all([
        fetchTaskScheduleOverview(),
        fetchTaskSchedules({ keyword, status: selectedStatus, cycle: selectedCycle }),
        fetchTaskScheduleDependencies(),
        fetchTaskScheduleCalendars(),
        fetchTaskScheduleBackfills(),
      ]);
      setOverview(overviewData);
      setSchedules(scheduleData);
      setDependencies(dependencyData);
      setCalendars(calendarData);
      setBackfills(backfillData);
      setSelectedSchedule((current) => current ?? scheduleData[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      if (selectedStatus !== "all" && schedule.status !== selectedStatus) return false;
      if (selectedCycle !== "all" && schedule.cycle !== selectedCycle) return false;
      if (keyword) {
        const text = `${schedule.name} ${schedule.taskCode} ${schedule.owner} ${schedule.domain} ${schedule.taskType}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [keyword, schedules, selectedCycle, selectedStatus]);

  const cycleSummary = useMemo(() => {
    const map = new Map<string, number>();
    schedules.forEach((schedule) => map.set(schedule.cycle, (map.get(schedule.cycle) ?? 0) + 1));
    return Array.from(map.entries()).map(([cycle, count]) => ({ cycle, count }));
  }, [schedules]);

  const maxCycleCount = Math.max(...cycleSummary.map((item) => item.count), 1);

  const searchSchedules = async () => {
    const data = await fetchTaskSchedules({ keyword, status: selectedStatus, cycle: selectedCycle });
    setSchedules(data);
    setSelectedSchedule(data[0] ?? null);
  };

  const toggleSchedule = async (schedule: TaskScheduleItem) => {
    const nextStatus: ScheduleStatus = schedule.status === "enabled" ? "paused" : "enabled";
    const updated = await updateTaskScheduleStatus(schedule.id, nextStatus);
    setSchedules((prev) => prev.map((item) => (item.id === schedule.id ? updated : item)));
    setSelectedSchedule((current) => (current?.id === schedule.id ? updated : current));
  };

  const triggerSchedule = async (schedule: TaskScheduleItem) => {
    const updated = await runTaskSchedule(schedule.id);
    setSchedules((prev) => prev.map((item) => (item.id === schedule.id ? updated : item)));
    setSelectedSchedule((current) => (current?.id === schedule.id ? updated : current));
  };

  const createBackfill = async () => {
    const base = selectedSchedule ?? schedules[0];
    const created = await createTaskScheduleBackfill({
      taskName: base?.name,
      bizRange: "2026-05-10",
      requester: base?.owner,
      strategy: base?.cycle === "每小时" ? "按小时并发补数" : "按日串行补数",
    });
    setBackfills((prev) => [created, ...prev]);
  };

  if (error) {
    return <ErrorFallback onRetry={loadData} />;
  }
  if (loading || !overview) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "数据开发" }, { label: "任务调度" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            任务调度
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              准点率 {overview.onTimeRate}%
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            管理周期调度、依赖窗口、补数策略和资源组，让离线开发、同步、质量核查任务按业务日期稳定运行。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={createBackfill} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/15">
            <RotateCcw className="h-4 w-4" />
            发起补数
          </button>
          <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="调度任务" value={overview.totalSchedules} desc="已登记周期任务" icon={CalendarClock} tone="text-cyan-300" />
        <KpiCard label="今日实例" value={overview.runningToday} desc={`${overview.waitingInstances} 个等待运行`} icon={Clock3} tone="text-blue-300" />
        <KpiCard label="失败实例" value={overview.failedInstances} desc="需运维介入处理" icon={AlertTriangle} tone="text-red-300" />
        <KpiCard label="补数任务" value={overview.backfillTasks} desc="今日补跑与重算" icon={TimerReset} tone="text-amber-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
                调度配置
              </h2>
              <p className="mt-1 text-xs text-slate-500">按任务、负责人、周期和状态检索周期调度配置。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchSchedules();
                  }}
                  placeholder="搜索任务、负责人、域"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | ScheduleStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="enabled">已启用</option>
                <option value="paused">已暂停</option>
              </select>
              <select value={selectedCycle} onChange={(event) => setSelectedCycle(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部周期</option>
                <option value="每小时">每小时</option>
                <option value="每日">每日</option>
                <option value="每周">每周</option>
              </select>
              <button onClick={searchSchedules} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">筛选</button>
            </div>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {filteredSchedules.map((schedule) => {
              const status = statusConfig[schedule.status];
              const runStatus = runStatusConfig[schedule.lastRunStatus];
              const priority = priorityConfig[schedule.priority];
              const selected = selectedSchedule?.id === schedule.id;
              return (
                <article
                  key={schedule.id}
                  onClick={() => setSelectedSchedule(schedule)}
                  className={`cursor-pointer rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${selected ? "border-cyan-500/60 ring-1 ring-cyan-500/20" : priority.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <span className={`rounded px-2 py-1 text-xs ${priority.bg} ${priority.color}`}>{priority.label}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${runStatus.bg} ${runStatus.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${runStatus.dot}`} />
                          {runStatus.label}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{schedule.name}</h3>
                      <div className="mt-1 break-all font-mono text-xs text-cyan-100">{schedule.taskCode}</div>
                      <p className="mt-2 text-xs leading-5 text-slate-400">{schedule.description}</p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSchedule(schedule);
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      {schedule.status === "enabled" ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="调度周期" value={schedule.cycle} />
                    <Metric label="下次运行" value={schedule.nextRunTime} />
                    <Metric label="资源组" value={schedule.resourceGroup} />
                    <Metric label="负责人" value={schedule.owner} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <DatabaseZap className="h-4 w-4 text-cyan-300" />
              当前任务
            </h2>
            <p className="mt-1 text-xs text-slate-500">查看调度表达式、运行耗时和手动触发入口。</p>
          </div>
          {selectedSchedule ? (
            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{selectedSchedule.name}</h3>
                    <div className="mt-1 font-mono text-xs text-cyan-100">{selectedSchedule.cron}</div>
                  </div>
                  <button onClick={() => triggerSchedule(selectedSchedule)} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                    <PlayCircle className="h-3.5 w-3.5" />
                    运行
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="任务类型" value={selectedSchedule.taskType} />
                  <Metric label="平均耗时" value={selectedSchedule.avgDuration} />
                  <Metric label="业务域" value={selectedSchedule.domain} />
                  <Metric label="状态" value={statusConfig[selectedSchedule.status].label} />
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <CalendarClock className="h-4 w-4 text-blue-300" />
                  周期分布
                </h3>
                <div className="mt-4 space-y-3">
                  {cycleSummary.map((item) => (
                    <div key={item.cycle}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{item.cycle}</span>
                        <span className="font-semibold text-white">{item.count}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(item.count / maxCycleCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">请选择一个调度任务</div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <GitBranch className="h-4 w-4 text-cyan-300" />
              依赖窗口
            </h2>
            <p className="mt-1 text-xs text-slate-500">监控上游依赖到达、失败阻塞和业务日期窗口。</p>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {dependencies.map((dependency) => {
              const status = dependencyConfig[dependency.status];
              return (
                <article key={dependency.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <span className="text-xs text-slate-500">{dependency.dependencyType}</span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <DependencyLine label="上游" value={dependency.upstream} />
                    <DependencyLine label="下游" value={dependency.downstream} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="到达窗口" value={dependency.window} />
                    <Metric label="负责人" value={dependency.owner} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <CalendarClock className="h-4 w-4 text-blue-300" />
              调度日历
            </h2>
            <p className="mt-1 text-xs text-slate-500">统一维护工作日、自然日和业务专属日历。</p>
          </div>
          <div className="space-y-3 p-4">
            {calendars.map((calendar) => (
              <article key={calendar.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-white">{calendar.name}</h3>
                    <div className="mt-1 text-xs text-slate-500">{calendar.calendarType} · {calendar.owner}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">{calendar.boundTasks}</div>
                    <div className="text-[11px] text-slate-500">任务</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">下个节假日：{calendar.nextHoliday}</div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <History className="h-4 w-4 text-amber-300" />
            补数与重跑
          </h2>
          <p className="mt-1 text-xs text-slate-500">跟踪业务日期范围、补数策略、执行进度和发起人。</p>
        </div>
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          {backfills.map((backfill) => {
            const status = backfillConfig[backfill.status];
            return (
              <article key={backfill.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <h3 className="mt-2 text-sm font-medium text-white">{backfill.taskName}</h3>
                    <div className="mt-1 text-xs text-slate-500">{backfill.requester} · {backfill.createdAt}</div>
                  </div>
                  {backfill.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{backfill.bizRange} · {backfill.strategy}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className={backfill.status === "failed" ? "h-full rounded-full bg-red-400" : backfill.status === "success" ? "h-full rounded-full bg-emerald-400" : "h-full rounded-full bg-cyan-400"} style={{ width: `${backfill.progress}%` }} />
                </div>
                <div className="mt-2 text-right text-xs text-slate-500">{backfill.progress}%</div>
              </article>
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

function DependencyLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="mt-1 break-all font-mono text-xs text-cyan-100">{value}</div>
    </div>
  );
}

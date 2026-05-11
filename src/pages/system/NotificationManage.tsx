import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Mail,
  MessageSquareText,
  RadioTower,
  RefreshCw,
  Search,
  Send,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  fetchNotificationChannels,
  fetchNotificationMessages,
  fetchNotificationOverview,
  fetchNotificationSubscriptions,
  fetchNotificationTemplates,
  updateNotificationMessageStatus,
  updateNotificationTemplateStatus,
} from "../../services/api";

type TemplateStatus = "enabled" | "disabled";
type Priority = "high" | "medium" | "low";
type ChannelStatus = "healthy" | "degraded";
type MessageStatus = "sent" | "failed" | "archived";

interface NotificationOverview {
  totalTemplates: number;
  enabledTemplates: number;
  subscriptions: number;
  channels: number;
  sentToday: number;
  failedToday: number;
}

interface NotificationTemplate {
  id: string;
  name: string;
  code: string;
  scene: string;
  channel: string;
  status: TemplateStatus;
  priority: Priority;
  owner: string;
  variables: string[];
  updatedAt: string;
  content: string;
}

interface NotificationSubscription {
  id: string;
  templateId: string;
  subscriber: string;
  scope: string;
  channels: string[];
  quietTime: string;
  status: "active" | "paused";
  hitCount: number;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: string;
  status: ChannelStatus;
  deliveryRate: number;
  latency: string;
  owner: string;
}

interface NotificationMessage {
  id: string;
  templateId: string;
  title: string;
  receiver: string;
  channel: string;
  status: MessageStatus;
  priority: Priority;
  sentAt: string;
  summary: string;
}

const templateStatusConfig: Record<TemplateStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  enabled: { label: "已启用", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  disabled: { label: "已停用", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400", border: "border-slate-700" },
};

const priorityConfig: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "高优先级", color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" },
  medium: { label: "中优先级", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  low: { label: "低优先级", color: "text-cyan-300", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
};

const channelStatusConfig: Record<ChannelStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  healthy: { label: "健康", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  degraded: { label: "降级", color: "text-amber-300", bg: "bg-amber-500/15", dot: "bg-amber-400", border: "border-amber-500/30" },
};

const messageStatusConfig: Record<MessageStatus, { label: string; color: string; bg: string; dot: string; border: string }> = {
  sent: { label: "已送达", color: "text-emerald-300", bg: "bg-emerald-500/15", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  failed: { label: "发送失败", color: "text-red-300", bg: "bg-red-500/15", dot: "bg-red-400", border: "border-red-500/30" },
  archived: { label: "已归档", color: "text-slate-300", bg: "bg-slate-500/15", dot: "bg-slate-400", border: "border-slate-700" },
};

export default function NotificationManage() {
  const [overview, setOverview] = useState<NotificationOverview | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | TemplateStatus>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, templateData, subscriptionData, channelData, messageData] = await Promise.all([
        fetchNotificationOverview(),
        fetchNotificationTemplates({ keyword, status: selectedStatus }),
        fetchNotificationSubscriptions(),
        fetchNotificationChannels(),
        fetchNotificationMessages(),
      ]);
      setOverview(overviewData);
      setTemplates(templateData);
      setSubscriptions(subscriptionData);
      setChannels(channelData);
      setMessages(messageData);
      setSelectedTemplate((current) => current ?? templateData[0] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (selectedStatus !== "all" && template.status !== selectedStatus) return false;
      if (keyword) {
        const text = `${template.name} ${template.code} ${template.scene} ${template.owner} ${template.channel}`.toLowerCase();
        if (!text.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [keyword, selectedStatus, templates]);

  const selectedSubscriptions = useMemo(
    () => subscriptions.filter((item) => item.templateId === selectedTemplate?.id),
    [selectedTemplate, subscriptions],
  );
  const selectedMessages = useMemo(
    () => messages.filter((item) => item.templateId === selectedTemplate?.id),
    [messages, selectedTemplate],
  );

  const channelMaxRate = Math.max(...channels.map((channel) => channel.deliveryRate), 1);

  const searchTemplates = async () => {
    const data = await fetchNotificationTemplates({ keyword, status: selectedStatus });
    setTemplates(data);
    setSelectedTemplate(data[0] ?? null);
  };

  const toggleTemplate = async (template: NotificationTemplate) => {
    const nextStatus: TemplateStatus = template.status === "enabled" ? "disabled" : "enabled";
    const updated = await updateNotificationTemplateStatus(template.id, nextStatus);
    setTemplates((prev) => prev.map((item) => (item.id === template.id ? updated : item)));
    setSelectedTemplate((current) => (current?.id === template.id ? updated : current));
  };

  const changeMessageStatus = async (message: NotificationMessage, status: MessageStatus) => {
    const updated = await updateNotificationMessageStatus(message.id, status);
    setMessages((prev) => prev.map((item) => (item.id === message.id ? updated : item)));
  };

  if (loading || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
          <p className="mt-3 text-sm text-slate-400">加载消息通知...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Breadcrumb items={[{ label: "系统管理" }, { label: "消息通知" }]} />
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
            消息通知
            <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
              今日失败 {overview.failedToday}
            </span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            统一管理平台通知模板、订阅规则、发送渠道和消息记录，支撑治理告警、审批待办和任务运维触达。
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label="通知模板" value={overview.totalTemplates} desc={`${overview.enabledTemplates} 个启用中`} icon={MessageSquareText} tone="text-cyan-300" />
        <KpiCard label="订阅规则" value={overview.subscriptions} desc="按角色、组织、资产范围触达" icon={Users} tone="text-blue-300" />
        <KpiCard label="发送渠道" value={overview.channels} desc="站内信、邮件、短信、企业微信" icon={RadioTower} tone="text-emerald-300" />
        <KpiCard label="今日发送" value={overview.sentToday} desc="含告警、待办和报告通知" icon={Send} tone="text-amber-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-white">
                <Bell className="h-4 w-4 text-cyan-300" />
                通知模板
              </h2>
              <p className="mt-1 text-xs text-slate-500">按场景、编码、负责人和渠道检索平台通知模板。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchTemplates();
                  }}
                  placeholder="搜索模板、编码、场景"
                  className="w-64 rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as "all" | TemplateStatus)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none">
                <option value="all">全部状态</option>
                <option value="enabled">已启用</option>
                <option value="disabled">已停用</option>
              </select>
              <button onClick={searchTemplates} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">筛选</button>
            </div>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {filteredTemplates.map((template) => {
              const status = templateStatusConfig[template.status];
              const priority = priorityConfig[template.priority];
              const selected = selectedTemplate?.id === template.id;
              return (
                <article
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`cursor-pointer rounded-lg border bg-slate-950/60 p-4 transition hover:border-slate-700 ${selected ? "border-cyan-500/60 ring-1 ring-cyan-500/20" : status.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <span className={`rounded px-2 py-1 text-xs ${priority.bg} ${priority.color}`}>{priority.label}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">{template.name}</h3>
                      <div className="mt-1 truncate font-mono text-xs text-cyan-100">{template.code}</div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{template.content}</p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleTemplate(template);
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title={template.status === "enabled" ? "停用模板" : "启用模板"}
                    >
                      {template.status === "enabled" ? <ToggleRight className="h-5 w-5 text-emerald-300" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Metric label="场景" value={template.scene} />
                    <Metric label="负责人" value={template.owner} />
                    <Metric label="渠道" value={template.channel} />
                    <Metric label="更新时间" value={template.updatedAt} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <MessageSquareText className="h-4 w-4 text-cyan-300" />
              当前模板
            </h2>
            <p className="mt-1 text-xs text-slate-500">查看选中模板的变量、渠道和最近发送结果。</p>
          </div>
          {selectedTemplate ? (
            <div className="space-y-4 p-4">
              <div className={`rounded-lg border bg-slate-950/60 p-4 ${priorityConfig[selectedTemplate.priority].border}`}>
                <h3 className="text-sm font-medium text-white">{selectedTemplate.name}</h3>
                <div className="mt-1 font-mono text-xs text-cyan-100">{selectedTemplate.code}</div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{selectedTemplate.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((item) => (
                    <span key={item} className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300">{item}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                  <Mail className="h-4 w-4 text-blue-300" />
                  发送概况
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="订阅规则" value={selectedSubscriptions.length} />
                  <Metric label="消息记录" value={selectedMessages.length} />
                  <Metric label="失败记录" value={selectedMessages.filter((item) => item.status === "failed").length} />
                  <Metric label="归档记录" value={selectedMessages.filter((item) => item.status === "archived").length} />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">请选择一个通知模板</div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <Users className="h-4 w-4 text-cyan-300" />
              订阅规则
            </h2>
            <p className="mt-1 text-xs text-slate-500">按角色、组织和值班组维护触达范围和免打扰策略。</p>
          </div>
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {selectedSubscriptions.map((subscription) => (
              <article key={subscription.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-white">{subscription.subscriber}</h3>
                    <div className="mt-1 text-xs text-slate-500">{subscription.scope}</div>
                  </div>
                  <span className={subscription.status === "active" ? "rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300" : "rounded bg-slate-500/15 px-2 py-1 text-xs text-slate-300"}>
                    {subscription.status === "active" ? "启用" : "暂停"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {subscription.channels.map((channel) => (
                    <span key={channel} className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300">{channel}</span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <Metric label="免打扰" value={subscription.quietTime} />
                  <Metric label="命中次数" value={subscription.hitCount} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 p-4">
            <h2 className="flex items-center gap-2 text-sm font-medium text-white">
              <RadioTower className="h-4 w-4 text-blue-300" />
              发送渠道
            </h2>
            <p className="mt-1 text-xs text-slate-500">监控各通知通道的送达率、延迟和健康状态。</p>
          </div>
          <div className="space-y-3 p-4">
            {channels.map((channel) => {
              const status = channelStatusConfig[channel.status];
              return (
                <article key={channel.id} className={`rounded-lg border bg-slate-950/60 p-4 ${status.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-white">{channel.name}</h3>
                      <div className="mt-1 text-xs text-slate-500">{channel.owner} · {channel.latency}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(channel.deliveryRate / channelMaxRate) * 100}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">送达率 {channel.deliveryRate}%</div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-white">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            消息记录
          </h2>
          <p className="mt-1 text-xs text-slate-500">查看模板最近发送结果，并处理失败重发或归档。</p>
        </div>
        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {selectedMessages.map((message) => {
            const status = messageStatusConfig[message.status];
            const priority = priorityConfig[message.priority];
            return (
              <article key={message.id} className={`rounded-lg border bg-slate-950/60 p-4 ${status.border}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${status.bg} ${status.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  <span className={`rounded px-2 py-1 text-xs ${priority.bg} ${priority.color}`}>{priority.label}</span>
                </div>
                <h3 className="mt-3 text-sm font-medium text-white">{message.title}</h3>
                <div className="mt-1 text-xs text-slate-500">{message.receiver} · {message.channel} · {message.sentAt}</div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{message.summary}</p>
                {message.status !== "archived" && (
                  <div className="mt-3 flex justify-end gap-2">
                    {message.status === "failed" && (
                      <button onClick={() => changeMessageStatus(message, "sent")} className="inline-flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500/20">
                        <Send className="h-3.5 w-3.5" />
                        重发
                      </button>
                    )}
                    <button onClick={() => changeMessageStatus(message, "archived")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      归档
                    </button>
                  </div>
                )}
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

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import {
  Activity,
  Archive,
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  Copy,
  History,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  Network,
  RefreshCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from 'lucide-react';
import {
  createAiConversation,
  fetchAiCapabilities,
  fetchAiConversationDetail,
  fetchAiConversations,
  fetchAiPreferences,
  fetchAiTokenUsage,
  fetchAiTools,
  previewAiContext,
  recordAiBehaviorEvent,
  regenerateAiMessage,
  sendAiConversationMessage,
  submitAiMessageFeedback,
  updateAiConversation,
  updateAiPreferences,
} from '../../services/api';
import type {
  AiAssistantContext,
  AiAssistantResponse,
  AiCapability,
  AiCapabilityType,
  AiContextPreview,
  AiConversation,
  AiConversationMessage,
  AiPreference,
  AiTokenUsageOverview,
  AiToolInfo,
} from '../../types/api';

interface AiAssistantProps {
  activeMenu: string;
  sidebarCollapsed: boolean;
}

type MessageSegment = {
  type: 'text' | 'code';
  value: string;
  language?: string;
};

const pageTitles: Record<string, string> = {
  home: '首页',
  dashboard: '工作台',
  'asset-overview': '资产总览',
  'business-domain': '业务域管理',
  'asset-register': '资产注册',
  'data-catalog': '数据目录',
  'data-map': '数据地图',
  'data-lineage': '数据血缘',
  'data-source': '数据源管理',
  'metadata-model': '元数据模型',
  'metadata-collect': '元数据采集',
  'metadata-manage': '元数据维护',
  'metadata-query': '元数据查询',
  'standard-def': '标准定义',
  'standard-map': '标准映射',
  'standard-eval': '标准评估',
  'data-dict': '数据字典',
  'code-manage': '码值管理',
  'quality-rules': '质量规则',
  'quality-check': '质量核查',
  'quality-monitor': '质量监控',
  'quality-report': '质量报告',
  'security-level': '安全分级',
  'sensitive-scan': '敏感识别',
  'data-mask': '数据脱敏',
  'access-control': '访问控制',
  'audit-log': '审计日志',
  'data-modeling': '数据建模',
  'script-dev': '脚本开发',
  'task-orchestration': '任务编排',
  'task-schedule': '任务调度',
  'realtime-compute': '实时计算',
  'data-sync': '数据同步',
  'task-ops': '任务运维',
  'metric-manage': '指标管理',
  'data-service-api': '数据服务 API',
  'data-sharing': '数据共享',
  'approvals-todos': '待我审批',
  'approvals-applies': '我发起的审批',
  'approvals-processed': '已处理审批',
  'user-manage': '用户管理',
  'role-manage': '角色管理',
  'org-manage': '组织管理',
  notification: '消息通知',
  'operation-log': '操作日志',
  'ops-monitor': '运维监控',
  'system-config': '系统配置',
};

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  sql: Code2,
  review: ShieldCheck,
  lineage: Network,
  book: BookOpen,
  quality: CheckCircle2,
  ops: Activity,
};

const accentMap: Record<string, string> = {
  cyan: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  blue: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
  violet: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  rose: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
};

const defaultPreference: AiPreference = {
  answerStyle: '专业简洁',
  sqlDialect: 'PostgreSQL',
  language: 'zh-CN',
  showTokenPreview: true,
  memoryEnabled: true,
};

const parseMessageContent = (content: string): MessageSegment[] => {
  const segments: MessageSegment[] = [];
  const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
  let cursor = 0;
  let match = codeBlockPattern.exec(content);

  while (match) {
    if (match.index > cursor) {
      segments.push({ type: 'text', value: content.slice(cursor, match.index) });
    }
    segments.push({
      type: 'code',
      language: match[1] || 'text',
      value: match[2].replace(/\n$/, ''),
    });
    cursor = match.index + match[0].length;
    match = codeBlockPattern.exec(content);
  }

  if (cursor < content.length) {
    segments.push({ type: 'text', value: content.slice(cursor) });
  }
  return segments.length > 0 ? segments : [{ type: 'text', value: content }];
};

const formatPercent = (used: number, total: number) => {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
};

const createGreeting = (pageTitle: string): AiConversationMessage => ({
  id: 'ai-greeting',
  role: 'assistant',
  capability: 'knowledge-explain',
  content: `我已经接入「${pageTitle}」页面上下文。可以帮你写 SQL、分析 SQL、解释血缘影响、生成质量规则，也会在发送前预估上下文 Token。`,
  summary: '全局 AI Copilot 已就绪',
  suggestions: ['帮我写一段订单统计 SQL', '分析当前 SQL 的性能风险', '生成质量规则草稿'],
  references: [{ label: pageTitle, type: '当前页面' }],
  createdAt: '刚刚',
  status: 'succeeded',
});

export default function AiAssistant({ activeMenu, sidebarCollapsed }: AiAssistantProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [capabilities, setCapabilities] = useState<AiCapability[]>([]);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [messages, setMessages] = useState<AiConversationMessage[]>([]);
  const [activeCapability, setActiveCapability] = useState<AiCapabilityType>('write-sql');
  const [activeConversationId, setActiveConversationId] = useState('');
  const [question, setQuestion] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const [preference, setPreference] = useState<AiPreference>(defaultPreference);
  const [contextPreview, setContextPreview] = useState<AiContextPreview | null>(null);
  const [tokenUsage, setTokenUsage] = useState<AiTokenUsageOverview | null>(null);
  const [tools, setTools] = useState<AiToolInfo[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const pageTitle = pageTitles[activeMenu] || '当前页面';
  const activeCapabilityMeta = capabilities.find((item) => item.id === activeCapability);

  const assistantContext = useMemo<AiAssistantContext>(() => ({
    viewId: activeMenu,
    viewTitle: pageTitle,
    url: typeof window === 'undefined' ? '' : window.location.href,
    dialect: preference.sqlDialect,
    blocks: [
      {
        id: 'active-page',
        type: 'page',
        title: '当前工作台位置',
        content: `用户正在 DataGov 的「${pageTitle}」页面工作，当前能力模式为「${activeCapabilityMeta?.title || 'AI 分析'}」。`,
        priority: 100,
        included: true,
      },
    ],
  }), [activeCapabilityMeta?.title, activeMenu, pageTitle, preference.sqlDialect]);

  const filteredConversations = useMemo(() => {
    const keyword = conversationSearch.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((item) => item.title.toLowerCase().includes(keyword));
  }, [conversationSearch, conversations]);

  const loadBootstrap = useCallback(async () => {
    try {
      const [capabilityData, conversationData, preferenceData, tokenData, toolData] = await Promise.all([
        fetchAiCapabilities() as Promise<AiCapability[]>,
        fetchAiConversations({ limit: 30 }),
        fetchAiPreferences().catch(() => defaultPreference),
        fetchAiTokenUsage().catch(() => null),
        fetchAiTools().catch(() => []),
      ]);
      setCapabilities(capabilityData);
      setConversations(conversationData);
      setPreference(preferenceData);
      setTokenUsage(tokenData);
      setTools(toolData);
      if (capabilityData[0]) setActiveCapability(capabilityData[0].id);
      if (!activeConversationId && messages.length === 0) {
        setMessages([createGreeting(pageTitle)]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 初始化失败');
    }
  }, [activeConversationId, messages.length, pageTitle]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open || !preference.showTokenPreview) return;
    const timer = window.setTimeout(async () => {
      try {
        const preview = await previewAiContext({
          capability: activeCapability,
          question: question || activeCapabilityMeta?.prompt || '',
          conversationId: activeConversationId || undefined,
          context: assistantContext,
        });
        setContextPreview(preview);
      } catch {
        setContextPreview(null);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [activeCapability, activeCapabilityMeta?.prompt, activeConversationId, assistantContext, open, preference.showTokenPreview, question]);

  const refreshConversations = async () => {
    const latest = await fetchAiConversations({ limit: 30 });
    setConversations(latest);
  };

  const ensureConversation = async (firstQuestion: string) => {
    if (activeConversationId) return activeConversationId;
    const conversation = await createAiConversation({
      title: firstQuestion.slice(0, 40) || `${pageTitle} AI 会话`,
      context: assistantContext,
    });
    setActiveConversationId(conversation.id);
    setConversations((prev) => [conversation, ...prev.filter((item) => item.id !== conversation.id)]);
    return conversation.id;
  };

  const handleSelectConversation = async (conversationId: string) => {
    setHistoryLoading(true);
    try {
      const detail = await fetchAiConversationDetail(conversationId);
      setActiveConversationId(conversationId);
      setMessages(detail.messages.length > 0 ? detail.messages : [createGreeting(detail.conversation.context.viewTitle || pageTitle)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '会话加载失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId('');
    setQuestion('');
    setMessages([createGreeting(pageTitle)]);
    setContextPreview(null);
  };

  const appendAssistantResponse = (response: AiAssistantResponse) => {
    const assistantMessage: AiConversationMessage = {
      id: response.id,
      role: 'assistant',
      capability: activeCapability,
      content: response.answer,
      summary: response.summary,
      suggestions: response.suggestions,
      references: response.references,
      tokenUsage: response.tokenUsage,
      createdAt: response.createdAt,
      status: 'succeeded',
    };
    setMessages((prev) => [...prev.filter((message) => message.id !== 'ai-greeting'), assistantMessage]);
    if (response.contextPreview) setContextPreview(response.contextPreview);
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: AiConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      capability: activeCapability,
      content: trimmed,
      createdAt: '刚刚',
      status: 'succeeded',
    };
    setMessages((prev) => [...prev.filter((message) => message.id !== 'ai-greeting'), userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const conversationId = await ensureConversation(trimmed);
      const response = await sendAiConversationMessage(conversationId, {
        capability: activeCapability,
        question: trimmed,
        context: assistantContext,
      });
      appendAssistantResponse(response);
      void recordAiBehaviorEvent({
        conversationId,
        messageId: response.id,
        eventType: 'message_sent',
        eventPayload: { capability: activeCapability, viewId: activeMenu },
      }).catch(() => undefined);
      await Promise.all([
        refreshConversations(),
        fetchAiTokenUsage().then(setTokenUsage).catch(() => undefined),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCapabilityClick = (capability: AiCapability) => {
    setActiveCapability(capability.id);
    setQuestion(capability.prompt);
    void recordAiBehaviorEvent({
      conversationId: activeConversationId || undefined,
      eventType: 'suggestion_clicked',
      eventPayload: { capability: capability.id, source: 'capability_card' },
    }).catch(() => undefined);
  };

  const copyMessage = async (message: AiConversationMessage, content = message.content) => {
    await navigator.clipboard.writeText(content);
    toast.success('已复制 AI 内容');
    if (message.role === 'assistant') {
      void recordAiBehaviorEvent({
        conversationId: activeConversationId || undefined,
        messageId: message.id,
        eventType: 'message_copied',
        eventPayload: { capability: message.capability },
      }).catch(() => undefined);
    }
  };

  const handleFeedback = async (message: AiConversationMessage, rating: 'up' | 'down') => {
    try {
      await submitAiMessageFeedback(message.id, { rating });
      toast.success(rating === 'up' ? '已记录有效反馈' : '已记录改进反馈');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '反馈提交失败');
    }
  };

  const handleRegenerate = async (message: AiConversationMessage) => {
    setLoading(true);
    try {
      const response = await regenerateAiMessage(message.id);
      appendAssistantResponse(response);
      void recordAiBehaviorEvent({
        conversationId: response.conversationId || activeConversationId || undefined,
        messageId: response.id,
        eventType: 'message_regenerated',
        eventPayload: { sourceMessageId: message.id },
      }).catch(() => undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '重新生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (conversation: AiConversation) => {
    try {
      const updated = await updateAiConversation(conversation.id, { favorite: !conversation.favorite });
      setConversations((prev) => prev.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新会话失败');
    }
  };

  const handleArchiveConversation = async (conversation: AiConversation) => {
    try {
      const updated = await updateAiConversation(conversation.id, { archived: true });
      setConversations((prev) => prev.map((item) => item.id === updated.id ? updated : item).filter((item) => !item.archivedAt));
      if (activeConversationId === conversation.id) handleNewConversation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '归档会话失败');
    }
  };

  const savePreference = async () => {
    try {
      const updated = await updateAiPreferences(preference);
      setPreference(updated);
      toast.success('AI 偏好已保存');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '偏好保存失败');
    }
  };

  const renderMessageContent = (message: AiConversationMessage) => {
    const segments = parseMessageContent(message.content);
    return (
      <div className="space-y-3 text-sm leading-6 text-slate-300">
        {segments.map((segment, index) => {
          const key = `${message.id}-${segment.type}-${index}`;
          if (segment.type === 'code') {
            const language = (segment.language || 'code').toUpperCase();
            return (
              <div key={key} className="overflow-hidden rounded-xl border border-cyan-400/20 bg-slate-950">
                <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-3 py-2">
                  <span className="text-[11px] font-semibold tracking-wider text-cyan-300">{language}</span>
                  <button
                    type="button"
                    onClick={() => copyMessage(message, segment.value)}
                    className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
                    aria-label={`复制 ${language} 代码块`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <pre className="custom-scrollbar overflow-x-auto px-3 py-3 text-[12px] leading-5 text-slate-200">
                  <code>{segment.value}</code>
                </pre>
              </div>
            );
          }
          const value = segment.value.trim();
          if (!value) return null;
          return <div key={key} className="whitespace-pre-wrap break-words">{value}</div>;
        })}
      </div>
    );
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full border border-cyan-400/40 bg-slate-950/95 px-4 py-3 text-sm font-medium text-cyan-100 shadow-2xl shadow-cyan-950/50 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-slate-900"
        aria-label="打开 AI 助手"
        title="AI 助手 Alt+A"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15">
          <Sparkles className="h-4 w-4 text-cyan-200" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
        </span>
        <span className="hidden sm:inline">AI 助手</span>
      </button>
    );
  }

  const tokenPercent = tokenUsage ? formatPercent(tokenUsage.usedTotalTokens, tokenUsage.quotaTokens) : 0;

  return (
    <section
      className={`fixed z-[60] flex overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950/95 text-slate-200 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all ${
        expanded
          ? `inset-3 lg:bottom-6 lg:right-6 lg:top-20 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'}`
          : 'bottom-3 left-3 right-3 top-auto h-[min(680px,calc(100vh-1.5rem))] sm:bottom-5 sm:left-auto sm:right-5 sm:top-20 sm:h-auto sm:w-[520px]'
      }`}
      aria-label="DataGov AI Copilot"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-white/10 bg-slate-900/90 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">DataGov AI Copilot</h2>
                  <p className="text-[11px] text-slate-500">上下文：{pageTitle} · Alt+A 唤起</p>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettings((value) => !value)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
                aria-label="AI 偏好设置"
              >
                <Settings2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
                aria-label={expanded ? '收起 AI 助手' : '展开 AI 助手'}
              >
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
                aria-label="关闭 AI 助手"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className={`grid min-h-0 flex-1 grid-cols-1 ${expanded ? 'lg:grid-cols-[260px_minmax(0,1fr)_280px]' : ''}`}>
          <aside className={`${expanded ? 'hidden min-h-0 border-r border-white/10 bg-slate-900/40 lg:flex lg:flex-col' : 'hidden'}`}>
            <div className="border-b border-white/10 p-3">
              <button
                type="button"
                onClick={handleNewConversation}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/15"
              >
                <Sparkles className="h-3.5 w-3.5" />
                新建 AI 会话
              </button>
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-slate-500">
                <Search className="h-3.5 w-3.5" />
                <input
                  value={conversationSearch}
                  onChange={(event) => setConversationSearch(event.target.value)}
                  placeholder="搜索会话"
                  className="min-w-0 flex-1 bg-transparent text-slate-300 outline-none placeholder:text-slate-600"
                />
              </label>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    conversation.id === activeConversationId
                      ? 'border-cyan-400/30 bg-cyan-400/10'
                      : 'border-white/10 bg-slate-950/60 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <span className="mb-1 flex items-center justify-between gap-2">
                    <span className="line-clamp-1 text-xs font-semibold text-slate-200">{conversation.title}</span>
                    {conversation.favorite && <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />}
                  </span>
                  <span className="block text-[11px] text-slate-500">{conversation.sourceViewId || 'global'} · {conversation.messageCount} 条</span>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">暂无会话</div>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="custom-scrollbar flex gap-2 overflow-x-auto border-b border-white/10 bg-slate-900/40 px-3 py-2">
              {capabilities.map((capability) => {
                const Icon = iconMap[capability.icon] || MessageSquare;
                const active = capability.id === activeCapability;
                return (
                  <button
                    key={capability.id}
                    type="button"
                    onClick={() => handleCapabilityClick(capability)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                      active
                        ? accentMap[capability.accent] || 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                        : 'border-white/10 bg-slate-950 text-slate-500 hover:text-slate-300'
                    }`}
                    title={capability.description}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {capability.title}
                  </button>
                );
              })}
            </div>

            {showSettings && (
              <div className="border-b border-white/10 bg-slate-900/70 p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="text-[11px] text-slate-500">
                    SQL 方言
                    <select
                      value={preference.sqlDialect}
                      onChange={(event) => setPreference((prev) => ({ ...prev, sqlDialect: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none"
                    >
                      {['PostgreSQL', 'MySQL', 'Hive', 'ClickHouse'].map((dialect) => <option key={dialect}>{dialect}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] text-slate-500">
                    回答风格
                    <select
                      value={preference.answerStyle}
                      onChange={(event) => setPreference((prev) => ({ ...prev, answerStyle: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none"
                    >
                      {['专业简洁', '详细解释', '教学型', '审查型'].map((style) => <option key={style}>{style}</option>)}
                    </select>
                  </label>
                  <div className="flex items-end gap-2">
                    <label className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={preference.memoryEnabled}
                        onChange={(event) => setPreference((prev) => ({ ...prev, memoryEnabled: event.target.checked }))}
                      />
                      使用长期偏好
                    </label>
                    <button type="button" onClick={savePreference} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-cyan-300">
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {historyLoading && (
                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-400">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-cyan-300" />
                  正在加载会话历史...
                </div>
              )}

              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`rounded-xl border p-3 ${
                    message.role === 'user'
                      ? 'ml-8 border-cyan-400/20 bg-cyan-400/10'
                      : 'mr-4 border-white/10 bg-slate-900/70'
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        {message.role === 'assistant' ? <Bot className="h-3.5 w-3.5 text-cyan-300" /> : <MessageSquare className="h-3.5 w-3.5 text-cyan-300" />}
                        {message.role === 'user' ? '你' : 'AI Copilot'}
                      </div>
                      {message.summary && <p className="mt-1 text-[11px] text-slate-500">{message.summary}</p>}
                    </div>
                    {message.role === 'assistant' && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => copyMessage(message)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200" aria-label="复制 AI 回复">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {message.id !== 'ai-greeting' && (
                          <>
                            <button type="button" onClick={() => handleFeedback(message, 'up')} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-emerald-300" aria-label="有帮助">
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleFeedback(message, 'down')} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-rose-300" aria-label="需改进">
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleRegenerate(message)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-cyan-300" aria-label="重新生成">
                              <RefreshCcw className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {renderMessageContent(message)}

                  {message.tokenUsage && (
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-slate-950/60 p-2 text-[11px] text-slate-500">
                      <span>输入 {message.tokenUsage.inputTokens}</span>
                      <span>输出 {message.tokenUsage.outputTokens}</span>
                      <span>耗时 {message.tokenUsage.latencyMs}ms</span>
                    </div>
                  )}

                  {message.references && message.references.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {message.references.map((reference) => (
                        <span key={`${message.id}-${reference.type}-${reference.label}`} className="rounded-full border border-white/10 bg-slate-950 px-2 py-1 text-[11px] text-slate-500">
                          {reference.type} · {reference.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={`${message.id}-${suggestion}`}
                          type="button"
                          onClick={() => {
                            setQuestion(suggestion);
                            void recordAiBehaviorEvent({
                              conversationId: activeConversationId || undefined,
                              messageId: message.id,
                              eventType: 'suggestion_clicked',
                              eventPayload: { suggestion },
                            }).catch(() => undefined);
                          }}
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1 text-[11px] text-cyan-200 transition hover:bg-cyan-400/10"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}

              {loading && (
                <div className="mr-4 rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                    AI 正在结合 {pageTitle} 上下文分析...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/10 bg-slate-900/90 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>能力：{activeCapabilityMeta?.title || 'AI 分析'} · 方言：{preference.sqlDialect}</span>
                <span>{contextPreview ? `上下文 ${contextPreview.totalTokens}/${contextPreview.budgetTokens} tokens` : '上下文预估中'}</span>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="输入问题，例如：帮我分析这段 SQL 有没有性能风险..."
                  className="custom-scrollbar min-h-20 flex-1 resize-none rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
                  onKeyDown={(event) => {
                    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                      void handleSubmit();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!question.trim() || loading}
                  className="flex w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                  aria-label="发送给 AI 助手"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>

          <aside className={`${expanded ? 'hidden min-h-0 border-l border-white/10 bg-slate-900/40 p-3 lg:block' : 'hidden'}`}>
            <div className="mb-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Zap className="h-3.5 w-3.5 text-cyan-300" />
                Token 预算
              </div>
              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${tokenPercent}%` }} />
              </div>
              <div className="text-[11px] text-slate-500">
                {tokenUsage ? `${tokenUsage.windowDescription} 已用 ${tokenUsage.usedTotalTokens.toLocaleString()} / ${tokenUsage.quotaTokens.toLocaleString()}` : '等待用量数据'}
              </div>
            </div>

            <div className="mb-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-200">
                <History className="h-3.5 w-3.5 text-cyan-300" />
                本次上下文
              </div>
              <div className="space-y-2">
                {(contextPreview?.blocks || []).map((block) => (
                  <div key={block.id} className={`rounded-lg border px-2 py-1.5 text-[11px] ${block.included ? 'border-cyan-400/20 bg-cyan-400/5 text-slate-300' : 'border-white/10 bg-slate-950 text-slate-600'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{block.title}</span>
                      <span>{block.tokenEstimate || 0}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-slate-500">{block.content}</div>
                  </div>
                ))}
                {!contextPreview && <div className="text-[11px] text-slate-500">暂无上下文预览</div>}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
                只读工具
              </div>
              <div className="space-y-2">
                {tools.slice(0, 5).map((tool) => (
                  <div key={tool.name} className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5">
                    <div className="text-[11px] font-medium text-slate-300">{tool.title}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">{tool.description}</div>
                  </div>
                ))}
                {tools.length === 0 && <div className="text-[11px] text-slate-500">工具列表加载中</div>}
              </div>
            </div>
          </aside>
        </div>

        {!expanded && activeConversationId && (
          <div className="flex shrink-0 items-center justify-between border-t border-white/10 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-500">
            <span className="line-clamp-1">当前会话：{conversations.find((item) => item.id === activeConversationId)?.title || activeConversationId}</span>
            <div className="flex items-center gap-1">
              {conversations.find((item) => item.id === activeConversationId) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const conversation = conversations.find((item) => item.id === activeConversationId);
                      if (conversation) void handleToggleFavorite(conversation);
                    }}
                    className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-amber-300"
                    aria-label="收藏会话"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const conversation = conversations.find((item) => item.id === activeConversationId);
                      if (conversation) void handleArchiveConversation(conversation);
                    }}
                    className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-slate-200"
                    aria-label="归档会话"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { fetchOpsServices, fetchOpsAlerts, resolveOpsAlert } from '../../services/api';
import Breadcrumb from '../../components/common/Breadcrumb';
import { AlertTriangle, Info, Server, Activity, Shield, Cpu, Zap } from 'lucide-react';
import ErrorFallback from '../../components/common/ErrorFallback';
import { CardSkeleton } from '../../components/common/Skeleton';

interface Service {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  cpu: number;
  memory: number;
  instances: number;
  qps: string;
  latency: string;
  version: string;
}

interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  service: string;
  message: string;
  time: string;
  resolved: boolean;
}

const sevConfig: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: '严重', icon: <AlertTriangle size={12} /> },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: '警告', icon: <AlertTriangle size={12} /> },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: '通知', icon: <Info size={12} /> },
};

export default function OperationsMonitor() {
  const [services, setServices] = useState<Service[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const loadData = useCallback(async () => {
    try {
      const [svcs, alrts] = await Promise.all([
        fetchOpsServices(),
        fetchOpsAlerts(),
      ]);
      setServices(svcs as Service[]);
      setAlerts(alrts as Alert[]);
    } catch { setError(true); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleResolve = async (id: string) => {
    try {
      await resolveOpsAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    } catch { setError(true); }
  };

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const warningCount = services.filter(s => s.status === 'warning').length;
  const errorCount = services.filter(s => s.status === 'error').length;
  const activeAlerts = alerts.filter(a => !a.resolved).length;
  const avgCpu = services.length ? (services.reduce((s, sv) => s + sv.cpu, 0) / services.length).toFixed(0) : '0';
  const avgMem = services.length ? (services.reduce((s, sv) => s + sv.memory, 0) / services.length).toFixed(0) : '0';

  const filteredAlerts = alertFilter === 'all' ? alerts : alerts.filter(a => alertFilter === 'active' ? !a.resolved : a.resolved);

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[{ label: '数据质量' }, { label: '运维监控' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">运维监控</h1>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>最后刷新: {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={loadData} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">刷新</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server size={14} className="text-cyan-400" />
            <span className="text-xs text-slate-400">服务总数</span>
          </div>
          <div className="text-3xl font-bold text-white">{services.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-400">{healthyCount}</span> 正常{' '}
            <span className="text-amber-400">{warningCount}</span> 告警{' '}
            <span className="text-red-400">{errorCount}</span> 异常
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-400">健康率</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{services.length ? ((healthyCount / services.length) * 100).toFixed(1) : 0}%</div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${services.length ? (healthyCount / services.length) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={14} className="text-cyan-400" />
            <span className="text-xs text-slate-400">CPU 平均使用率</span>
          </div>
          <div className="text-3xl font-bold text-white">{avgCpu}%</div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${avgCpu}%` }} />
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-purple-400" />
            <span className="text-xs text-slate-400">内存平均使用率</span>
          </div>
          <div className="text-3xl font-bold text-white">{avgMem}%</div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" style={{ width: `${avgMem}%` }} />
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-amber-400" />
            <span className="text-xs text-slate-400">活跃告警</span>
          </div>
          <div className="text-3xl font-bold text-amber-400">{activeAlerts}</div>
          <div className="text-xs text-slate-500 mt-1">严重 <span className="text-red-400">{alerts.filter(a => !a.resolved && a.severity === 'critical').length}</span></div>
        </div>
      </div>

      {/* Services & Alerts */}
      <div className="flex gap-4">
        {/* Services */}
        <div className="flex-1">
          <h2 className="text-sm font-medium text-slate-300 mb-3">服务状态</h2>
        {error && <ErrorFallback onRetry={loadData} />}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-2">
              {services.map(svc => {
                const statusColor = svc.status === 'healthy' ? 'emerald' : svc.status === 'warning' ? 'amber' : 'red';
                return (
                  <div key={svc.id} className="group bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-3 hover:bg-slate-800/60 transition-all flex items-center gap-4">
                    <span className={`w-2.5 h-2.5 rounded-full bg-${statusColor}-400 ${svc.status !== 'healthy' ? 'animate-pulse' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium">{svc.name}</span>
                        <span className="text-xs text-slate-600">{svc.version}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-slate-400">
                      <span>可用率 <span className="text-white">{svc.uptime}</span></span>
                      <span>CPU <span className={svc.cpu > 70 ? 'text-amber-400' : 'text-white'}>{svc.cpu}%</span></span>
                      <span>内存 <span className={svc.memory > 80 ? 'text-red-400' : 'text-white'}>{svc.memory}%</span></span>
                      <span>实例 <span className="text-white">{svc.instances}</span></span>
                      <span>QPS <span className="text-cyan-400">{svc.qps}</span></span>
                      <span>延迟 <span className="text-white">{svc.latency}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="w-96 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-300">最近告警</h2>
            <div className="flex gap-1 bg-slate-900 rounded-lg p-0.5">
              {(['all', 'active', 'resolved'] as const).map(f => (
                <button key={f} onClick={() => setAlertFilter(f)}
                  className={`px-2 py-1 text-xs rounded-md ${alertFilter === f ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                  {f === 'all' ? '全部' : f === 'active' ? '活跃' : '已恢复'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredAlerts.map(alert => {
              const sc = sevConfig[alert.severity];
              return (
                <div key={alert.id} className={`p-3 rounded-xl border ${sc.bg} ${sc.border} ${alert.resolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 text-xs rounded flex items-center gap-1 ${sc.bg} ${sc.color}`}>{sc.icon} {sc.label}</span>
                    <span className="text-sm text-white font-medium flex-1 truncate">{alert.title}</span>
                    {alert.resolved && <span className="text-xs text-slate-500">已恢复</span>}
                    {!alert.resolved && (
                      <button onClick={() => handleResolve(alert.id)}
                        className="text-xs text-cyan-400 hover:text-cyan-300">恢复</button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-1 line-clamp-2">{alert.message}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{alert.service}</span>
                    <span>{alert.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

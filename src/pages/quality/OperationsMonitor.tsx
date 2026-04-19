import { useState, useEffect } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';

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

const SERVICES: Service[] = [
  { id: 'sv1', name: 'API 网关', status: 'healthy', uptime: '99.99%', cpu: 35, memory: 48, instances: 4, qps: '125,000', latency: '3ms', version: 'v2.4.1' },
  { id: 'sv2', name: '调度中心', status: 'healthy', uptime: '99.95%', cpu: 28, memory: 52, instances: 3, qps: '2,500', latency: '8ms', version: 'v3.1.0' },
  { id: 'sv3', name: '元数据服', status: 'healthy', uptime: '99.98%', cpu: 22, memory: 45, instances: 2, qps: '5,800', latency: '12ms', version: 'v2.0.3' },
  { id: 'sv4', name: '血缘计算引', status: 'warning', uptime: '99.80%', cpu: 78, memory: 85, instances: 2, qps: '800', latency: '45ms', version: 'v1.5.2' },
  { id: 'sv5', name: '数据质量引擎', status: 'healthy', uptime: '99.97%', cpu: 42, memory: 55, instances: 3, qps: '3,200', latency: '15ms', version: 'v2.2.0' },
  { id: 'sv6', name: '实时计算集群', status: 'healthy', uptime: '99.92%', cpu: 65, memory: 72, instances: 8, qps: '85,000', latency: '25ms', version: 'v1.8.1' },
  { id: 'sv7', name: '消息队列', status: 'healthy', uptime: '99.99%', cpu: 30, memory: 40, instances: 5, qps: '250,000', latency: '2ms', version: 'v3.5.0' },
  { id: 'sv8', name: '对象存储', status: 'healthy', uptime: '99.99%', cpu: 18, memory: 35, instances: 12, qps: '45,000', latency: '5ms', version: 'v4.0.0' },
  { id: 'sv9', name: '搜索引擎', status: 'warning', uptime: '99.85%', cpu: 72, memory: 82, instances: 3, qps: '18,000', latency: '35ms', version: 'v2.3.1' },
  { id: 'sv10', name: '认证鉴权服务', status: 'healthy', uptime: '99.99%', cpu: 15, memory: 30, instances: 3, qps: '8,500', latency: '5ms', version: 'v2.1.0' },
  { id: 'sv11', name: '数据同步引擎', status: 'error', uptime: '98.50%', cpu: 90, memory: 92, instances: 4, qps: '12,000', latency: '120ms', version: 'v1.3.0' },
  { id: 'sv12', name: '监控采集', status: 'healthy', uptime: '99.98%', cpu: 25, memory: 38, instances: 2, qps: '50,000', latency: '1ms', version: 'v1.0.5' },
];

const ALERTS: Alert[] = [
  { id: 'al1', title: '数据同步引擎延迟飙升', severity: 'critical', service: '数据同步引擎', message: 'MySQL Binlog 消费延迟超过 5 分钟，当前延迟 12 分钟', time: '14:32', resolved: false },
  { id: 'al2', title: '血缘计算引擎内存告警', severity: 'warning', service: '血缘计算引擎', message: '内存使用率持续超过 85%，建议扩容', time: '13:45', resolved: false },
  { id: 'al3', title: '搜索引擎慢查询增加', severity: 'warning', service: '搜索引擎', message: '近 1 小时慢查询（>1s）数量增加 200%', time: '12:20', resolved: false },
  { id: 'al4', title: '调度中心任务超时', severity: 'warning', service: '调度中心', message: 'DAG 任务 dws_user_daily 执行超时，耗时 65 分钟', time: '08:15', resolved: true },
  { id: 'al5', title: 'API 网关 4xx 错误率上升', severity: 'info', service: 'API 网关', message: '/api/v1/lineage 返回 404 增多，已下线该接口', time: '10:30', resolved: true },
  { id: 'al6', title: '对象存储写入失败', severity: 'critical', service: '对象存储', message: '分区 bucket-trade-daily 写入失败 3 次', time: '06:00', resolved: true },
  { id: 'al7', title: '认证鉴权服务证书即将过期', severity: 'info', service: '认证鉴权服务', message: 'SSL 证书将于 2024-02-15 过期', time: '09:00', resolved: false },
  { id: 'al8', title: '消息队列积压', severity: 'warning', service: '消息队列', message: 'topic order-events 消费延迟 50,000 条', time: '14:10', resolved: false },
];

const sevConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: '严重' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: '警告' },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: '通知' },
};

export default function OperationsMonitor() {
  const [services, setServices] = useState<Service[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => { setServices(SERVICES); setAlerts(ALERTS); setLoading(false); }, 300);
  }, []);

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const healthScore = ((healthyCount / services.length) * 100).toFixed(1);
  const activeAlerts = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: '系统管理' }, { label: '运维监控' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">运维监控</h1>
        <div className="flex gap-3">
          <span className="px-3 py-2 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            🟢 系统运行'· 上次检' 1 分钟'          </span>
        </div>
      </div>

      {/* Health Score + Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 relative overflow-hidden bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={Number(healthScore) >= 95 ? '#10b981' : Number(healthScore) >= 80 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8" strokeDasharray={`${Number(healthScore) * 2.64} ${264 - Number(healthScore) * 2.64}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{healthScore}</span>
                <span className="text-xs text-slate-400">健康'</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm text-slate-300">正常服务</span>
                <span className="text-sm font-semibold text-emerald-400">{healthyCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm text-slate-300">告警服务</span>
                <span className="text-sm font-semibold text-amber-400">{services.filter(s => s.status === 'warning').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm text-slate-300">异常服务</span>
                <span className="text-sm font-semibold text-red-400">{services.filter(s => s.status === 'error').length}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-2">CPU 平均使用'</div>
          <div className="text-3xl font-bold text-white mb-1">{(services.reduce((s, sv) => s + sv.cpu, 0) / services.length).toFixed(0)}%</div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${services.reduce((s, sv) => s + sv.cpu, 0) / services.length}%` }} />
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-2">内存平均使用'</div>
          <div className="text-3xl font-bold text-white mb-1">{(services.reduce((s, sv) => s + sv.memory, 0) / services.length).toFixed(0)}%</div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" style={{ width: `${services.reduce((s, sv) => s + sv.memory, 0) / services.length}%` }} />
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-2">活跃告警</div>
          <div className="text-3xl font-bold text-amber-400 mb-1">{activeAlerts}</div>
          <div className="text-xs text-slate-500">其中严重 {alerts.filter(a => !a.resolved && a.severity === 'critical').length} '</div>
        </div>
      </div>

      {/* Services & Alerts */}
      <div className="flex gap-4">
        {/* Services */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white mb-3">服务状态</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="bg-slate-800/40 rounded-xl p-4 animate-pulse"><div className="h-5 bg-slate-700 rounded w-2/3" /></div>)}
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
                      <span>可用'<span className="text-white">{svc.uptime}</span></span>
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
          <h2 className="text-lg font-semibold text-white mb-3">最近告</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {alerts.map(alert => {
              const sc = sevConfig[alert.severity];
              return (
                <div key={alert.id} className={`p-3 rounded-xl border ${sc.bg} ${sc.border}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 text-xs rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
                    <span className="text-sm text-white font-medium flex-1 truncate">{alert.title}</span>
                    {alert.resolved && <span className="text-xs text-slate-500">已恢'</span>}
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

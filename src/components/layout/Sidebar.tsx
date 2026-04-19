import React, { useState } from 'react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  children?: MenuItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeMenu: string;
  onMenuSelect: (menuId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, activeMenu, onMenuSelect }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['data-asset']);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: '工作台',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'data-asset',
      label: '数据资产',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      children: [
        { id: 'asset-overview', label: '资产总览', icon: null },
        { id: 'asset-register', label: '资产注册', icon: null },
        { id: 'data-catalog', label: '数据目录', icon: null },
        { id: 'data-map', label: '数据地图', icon: null },
        { id: 'data-lineage', label: '数据血缘', icon: null },
        { id: 'data-source', label: '数据源管理', icon: null },
      ],
    },
    {
      id: 'metadata',
      label: '元数据管理',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      children: [
        { id: 'metadata-model', label: '元数据模型', icon: null },
        { id: 'metadata-collect', label: '元数据采集', icon: null },
        { id: 'metadata-manage', label: '元数据维护', icon: null },
        { id: 'metadata-query', label: '元数据查询', icon: null },
      ],
    },
    {
      id: 'data-standard',
      label: '数据标准',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      children: [
        { id: 'standard-def', label: '标准定义', icon: null },
        { id: 'standard-map', label: '标准映射', icon: null },
        { id: 'standard-eval', label: '标准评估', icon: null },
        { id: 'data-dict', label: '数据字典', icon: null },
        { id: 'code-manage', label: '码值管理', icon: null },
      ],
    },
    {
      id: 'data-quality',
      label: '数据质量',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: 3,
      children: [
        { id: 'quality-rules', label: '质量规则', icon: null },
        { id: 'quality-check', label: '质量核查', icon: null },
        { id: 'quality-monitor', label: '质量监控', icon: null },
        { id: 'quality-report', label: '质量报告', icon: null },
      ],
    },
    {
      id: 'data-security',
      label: '数据安全',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      children: [
        { id: 'security-level', label: '安全分级', icon: null },
        { id: 'sensitive-scan', label: '敏感数据识别', icon: null },
        { id: 'data-mask', label: '数据脱敏', icon: null },
        { id: 'access-control', label: '访问控制', icon: null },
        { id: 'audit-log', label: '审计日志', icon: null },
      ],
    },
    {
      id: 'data-develop',
      label: '数据开发',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      children: [
        { id: 'data-modeling', label: '数据建模', icon: null },
        { id: 'task-develop', label: '任务开发', icon: null },
        { id: 'script-dev', label: '脚本开发', icon: null },
        { id: 'task-orchestration', label: '任务编排', icon: null },
        { id: 'task-schedule', label: '任务调度', icon: null },
        { id: 'realtime-compute', label: '实时计算', icon: null },
        { id: 'data-sync', label: '数据同步', icon: null },
        { id: 'task-ops', label: '任务运维', icon: null },
        { id: 'resource-manage', label: '资源管理', icon: null },
      ],
    },
    {
      id: 'data-service',
      label: '数据服务',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      children: [
        { id: 'metric-manage', label: '指标管理', icon: null },
        { id: 'data-service-api', label: '数据服务', icon: null },
        { id: 'data-sharing', label: '数据共享', icon: null },
      ],
    },
    {
      id: 'approvals',
      label: '审批中心',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      children: [
        { id: 'approvals-todos', label: '待我审批', icon: null },
        { id: 'approvals-applies', label: '我发起的', icon: null },
        { id: 'approvals-processed', label: '已处理', icon: null },
      ],
    },
    {
      id: 'system-manage',
      label: '系统管理',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      children: [
        { id: 'user-manage', label: '用户管理', icon: null },
        { id: 'role-manage', label: '角色管理', icon: null },
        { id: 'org-manage', label: '组织管理', icon: null },
        { id: 'notification', label: '消息通知', icon: null },
        { id: 'operation-log', label: '操作日志', icon: null },
        { id: 'ops-monitor', label: '运维监控', icon: null },
        { id: 'system-config', label: '系统配置', icon: null },
      ],
    },
  ];

  const toggleExpand = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700 transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-lg">DataGov</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => {
                  if (item.children) {
                    toggleExpand(item.id);
                  } else {
                    onMenuSelect(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  activeMenu === item.id
                    ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className={activeMenu === item.id ? 'text-cyan-400' : ''}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.children && (
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedMenus.includes(item.id) ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </>
                )}
              </button>
              {/* Submenu */}
              {item.children && !collapsed && expandedMenus.includes(item.id) && (
                <ul className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-3">
                  {item.children.map(subItem => (
                    <li key={subItem.id}>
                      <button
                        onClick={() => onMenuSelect(subItem.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeMenu === subItem.id
                            ? 'text-cyan-400 bg-slate-800'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        {subItem.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

    </aside>
  );
};

export default Sidebar;

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
} from "lucide-react";
import { menuItems, type MenuItem } from "../../navigation/registry";
import { hasPermission } from "../../utils/permissions";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  activeMenu: string;
  onMenuSelect: (menuId: string) => void;
  permissions?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
  activeMenu,
  onMenuSelect,
  permissions = [],
}) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const visibleMenuItems = useMemo(() => filterMenuItemsByPermissions(menuItems, permissions), [permissions]);

  const toggleExpand = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId],
    );
  };

  useEffect(() => {
    const parentMenu = visibleMenuItems.find(
      (item) => item.children?.some((child) => child.id === activeMenu) || item.id === activeMenu,
    );
    if (!parentMenu || !parentMenu.children) {
      return;
    }

    setExpandedMenus((prev) =>
      prev.includes(parentMenu.id) ? prev : [...prev, parentMenu.id],
    );
  }, [activeMenu, visibleMenuItems]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="关闭侧边栏"
          onClick={onMobileClose}
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 h-full border-r border-slate-700 bg-slate-900 transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } w-72 lg:translate-x-0 ${collapsed ? "lg:w-16" : "lg:w-64"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            {!collapsed && <span className="text-lg font-semibold text-white">DataGov</span>}
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
            className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white lg:block"
          >
            {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {visibleMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.children) {
                      toggleExpand(item.id);
                    } else {
                      onMenuSelect(item.id);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                    activeMenu === item.id
                      ? "border border-cyan-500/30 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <span className={activeMenu === item.id ? "text-cyan-400" : ""}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                          {item.badge}
                        </span>
                      )}
                      {item.children && (
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedMenus.includes(item.id) ? "rotate-90" : ""
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {item.children && !collapsed && expandedMenus.includes(item.id) && (
                  <ul className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-3">
                    {item.children.map((subItem) => (
                      <li key={subItem.id}>
                        <button
                          type="button"
                          onClick={() => onMenuSelect(subItem.id)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            activeMenu === subItem.id
                              ? "bg-slate-800 text-cyan-400"
                              : "text-slate-500 hover:bg-slate-800/50 hover:text-white"
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
    </>
  );
};

export default Sidebar;

function filterMenuItemsByPermissions(items: MenuItem[], permissions: string[]): MenuItem[] {
  return items
    .map((item) => {
      const children = item.children ? filterMenuItemsByPermissions(item.children, permissions) : undefined;
      return { ...item, children };
    })
    .filter((item) => {
      const selfAllowed = hasPermission(permissions, item.requiredPermissions);
      const hasVisibleChildren = Boolean(item.children?.length);
      return selfAllowed || hasVisibleChildren;
    });
}

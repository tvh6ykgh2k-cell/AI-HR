import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessagesSquare, FileText, FileCheck2, Settings, Boxes,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: '工作台', icon: LayoutDashboard, exact: true },
  { to: '/interview/new', label: '模拟面试', icon: MessagesSquare, exact: true },
  { to: '/prep/new', label: '面试准备', icon: FileText, exact: true },
  { to: '/resume', label: '简历定制', icon: FileCheck2 },
  { to: '/settings', label: '系统设置', icon: Settings },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  const isActive = (item: NavItem): boolean => {
    if (item.exact) return pathname === item.to;
    if (item.to === '/interview/new') {
      // 面试进行中的 /interview/:id 也归属"模拟面试"
      return pathname === '/interview/new' || /^\/interview\/[^/]+$/.test(pathname);
    }
    if (item.to === '/prep/new') {
      return pathname === '/prep/new' || /^\/prep\/[^/]+$/.test(pathname);
    }
    return pathname.startsWith(item.to);
  };

  return (
    <aside className="w-52 shrink-0 h-screen sticky top-0 bg-surface border-r flex flex-col">
      {/* 品牌 */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b">
        <div className="w-7 h-7 rounded-md bg-pulse flex items-center justify-center">
          <Boxes size={16} className="text-white" />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-ink leading-tight">AI 面试助手</div>
          <div className="text-[11px] text-iron leading-tight">岗位 × 简历 定制平台</div>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5">
        {NAV.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact && item.to !== '/interview/new' && item.to !== '/prep/new'}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                active
                  ? 'bg-pulse/8 text-pulse font-medium'
                  : 'text-mist hover:bg-void hover:text-ink'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
              {active && <span className="ml-auto w-1 h-1 rounded-full bg-pulse" />}
            </NavLink>
          );
        })}
      </nav>

      {/* 底部 */}
      <div className="px-4 py-3 border-t">
        <div className="text-[11px] text-iron leading-relaxed">
          本地运行 · 数据不出本机
        </div>
      </div>
    </aside>
  );
}

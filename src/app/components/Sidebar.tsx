import logoSidebar from '@/assets/mangrove.jpg';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: 'admin' | 'worker';
}

export function Sidebar({ activeItem, onItemClick, collapsed, onToggleCollapse, userRole = 'admin' }: SidebarProps) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', roles: ['admin'] },
    { id: 'mapping', label: 'Mapping Area', roles: ['admin'] },
    { id: 'addRecord', label: 'Add Record', roles: ['admin', 'worker'] },
    { id: 'monitoring', label: 'Monitoring', roles: ['admin', 'worker'] },
    { id: 'reports', label: 'Reports', roles: ['admin', 'worker'] },
    { id: 'analytics', label: 'Analytics', roles: ['admin'] },
    { id: 'userManagement', label: 'User Management', roles: ['admin'] },
    { id: 'settings', label: 'Profile', roles: ['admin'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className={`${collapsed ? 'w-20' : 'w-20 lg:w-64'} bg-sidebar text-sidebar-foreground h-full flex flex-col overflow-x-hidden transition-all duration-300`}>
      <div className={`p-6 border-b border-sidebar-border ${collapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="size-12 flex items-center justify-center">
            <img src={logoSidebar} alt="Mangrove Logo" className="size-10 rounded-full object-cover" />
          </div>
          {!collapsed && (
            <div className="hidden lg:block">
              <div className="font-semibold">MANGROVE</div>
              <div className="text-xs text-sidebar-foreground/70">Panabo City</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`group relative w-full text-center lg:text-left py-3 rounded-r-xl transition-all duration-200 flex items-center justify-center ${
              collapsed ? 'lg:justify-center' : 'lg:justify-start lg:gap-3 lg:pl-6 lg:pr-4'
            } ${
              activeItem === item.id
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:translate-x-0.5'
            }`}
          >
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-full bg-sidebar-primary-foreground/90 transition-all duration-200 ease-out ${
                activeItem === item.id ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
              }`}
            />
            {item.id === 'dashboard' && (
              <svg className={`size-5 shrink-0 transition-all duration-200 ease-out ${activeItem === item.id ? 'scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-10h8V3h-8v8z" />
              </svg>
            )}
            {item.id === 'mapping' && (
              <svg className={`size-5 shrink-0 transition-all duration-200 ease-out ${activeItem === item.id ? 'scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            )}
            {item.id === 'monitoring' && (
              <svg className={`size-5 shrink-0 transition-all duration-200 ease-out ${activeItem === item.id ? 'scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h6M4 18h8" />
              </svg>
            )}
            {item.id === 'addRecord' && (
              <svg className={`size-5 shrink-0 transition-all duration-200 ease-out ${activeItem === item.id ? 'scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            {item.id === 'reports' && (
              <svg className={`size-5 shrink-0 transition-all duration-200 ease-out ${activeItem === item.id ? 'scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M6 6h12M6 20h12" />
              </svg>
            )}
            {item.id === 'analytics' && (
              <svg className={`size-5 shrink-0 transition-all duration-200 ease-out ${activeItem === item.id ? 'scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20V10m5 10V4m5 16v-6M4 20h16" />
              </svg>
            )}
            {item.id === 'userManagement' && (
              <svg className={`size-5 shrink-0 transition-all duration-200 ease-out ${activeItem === item.id ? 'scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            {item.id === 'settings' && (
              <svg className={`size-5 shrink-0 transition-all duration-200 ease-out ${activeItem === item.id ? 'scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            <span
              className={`leading-none transition-all duration-200 ${
                activeItem === item.id ? 'font-semibold text-sidebar-primary-foreground delay-75' : 'font-medium text-inherit delay-75'
              } ${collapsed ? 'hidden' : 'hidden lg:inline'}`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full text-center lg:text-left px-2 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors flex items-center justify-center lg:justify-start gap-2"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="hidden lg:inline">{collapsed ? 'Expand Menu' : 'Collapse Menu'}</span>
        </button>
      </div>
    </div>
  );
}

import logoSidebar from '@/assets/mangrove.jpg';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeItem, onItemClick, collapsed, onToggleCollapse }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'mapping', label: 'Mapping Area' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'addRecord', label: 'Add Record' },
    { id: 'reports', label: 'Reports' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

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
            {item.id === 'settings' && (
              <svg className={`size-5 shrink-0 transition-all duration-200 ease-out ${activeItem === item.id ? 'scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)] text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.936l1.329.528a1 1 0 001.014-.125l1.044-.83a1 1 0 011.465.232l.78 1.242a1 1 0 00.916.47l1.456-.087a1 1 0 011.058 1.058l-.087 1.456a1 1 0 00.47.916l1.242.78a1 1 0 01.232 1.465l-.83 1.044a1 1 0 00-.125 1.014l.528 1.329a1 1 0 01-.936 1.35l-1.425.06a1 1 0 00-.858.56l-.61 1.305a1 1 0 01-1.356.478l-1.284-.643a1 1 0 00-1.028.006l-1.276.66a1 1 0 01-1.362-.46l-.628-1.296a1 1 0 00-.865-.548l-1.425-.04a1 1 0 01-.954-1.337l.51-1.335a1 1 0 00-.138-1.013l-.844-1.032a1 1 0 01.213-1.468l1.232-.796a1 1 0 00.457-.922l-.106-1.455a1 1 0 011.043-1.073l1.456.067a1 1 0 00.91-.483l.764-1.252z" />
                <circle cx="12" cy="12" r="3" strokeWidth={2} />
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

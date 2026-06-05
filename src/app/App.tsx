import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { NotificationPanel, type Notification } from './components/NotificationPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PHDateTime } from './components/PHDateTime';
import { MappingAreas } from './components/MappingAreas';
import { AddMonitoringRecord } from './components';
import { SettingsPage } from './components/SettingsPage';
import { SystemStatusPage } from './components/SystemStatusPage';
import { UserManagement } from './components/UserManagement';
import { apiUrl } from '@/utils/apiBase';
import logoSidebar from '@/assets/mangrove.jpg';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './components/ui/alert-dialog';

const MAX_USERNAME_LENGTH = 18;

const AUTH_CONNECTION_ERROR =
  'Cannot reach the authentication server. From the project root run npm run dev (starts PHP on port 8787 and Vite together), or in a second terminal run: php -S 127.0.0.1:8787 -t backend/public';

const systemStatusUiAllowed =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_SYSTEM_STATUS === 'true';

type UserRole = 'admin' | 'worker';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'New report submitted',
      message: 'A new monitoring report has been submitted and is ready for review.',
      date: '2026-06-04',
      targetPage: 'reports',
      isRead: false,
      role: 'admin',
    },
    {
      id: '2',
      type: 'check',
      title: 'Mangrove status updated',
      message: 'The health status of mangrove areas in Panabo City has been updated.',
      date: '2026-06-04',
      targetPage: 'monitoring',
      isRead: false,
      role: 'worker',
    },
    {
      id: '3',
      type: 'alert',
      title: 'Critical damage alert',
      message: 'Critical damage detected in a monitored mangrove zone. Immediate attention required.',
      date: '2026-06-04',
      targetPage: 'mapping',
      isRead: false,
      role: 'admin',
    },
  ]);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const filteredNotifications = notifications.filter((notification) => 
    notification.role === 'admin' || notification.role === userRole
  );
  const unreadNotificationsCount = filteredNotifications.filter((notification) => !notification.isRead).length;
  const [systemPanelOpen, setSystemPanelOpen] = useState(
    () => typeof window !== 'undefined' && systemStatusUiAllowed && window.location.hash === '#system'
  );
  const normalizeUsername = (value: string) => value.trim().slice(0, MAX_USERNAME_LENGTH);
  const AUTH_STORAGE_KEY = 'leoworks-auth';
  const backgroundImageUrl = '/mangrove-bg.jpg';

  useEffect(() => {
    const syncHash = () => {
      if (!systemStatusUiAllowed) {
        if (window.location.hash === '#system') {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }
        setSystemPanelOpen(false);
        return;
      }
      setSystemPanelOpen(window.location.hash === '#system');
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);

    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as {
            username?: string;
            name?: string;
            profileImageUrl?: string;
            activeMenuItem?: string;
            isSidebarCollapsed?: boolean;
            userRole?: string;
          };
          if (parsed.username || parsed.name || parsed.profileImageUrl) {
            setUsername(parsed.username ?? '');
            setName(parsed.name ?? '');
            setProfileImageUrl(parsed.profileImageUrl ?? '');
            setActiveMenuItem(parsed.activeMenuItem ?? 'dashboard');
            setIsSidebarCollapsed(parsed.isSidebarCollapsed ?? false);
            setUserRole((parsed.userRole ?? 'admin') as UserRole);
            setIsAuthenticated(true);
          }
        } catch {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    }

    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isAuthenticated) {
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          username,
          name,
          profileImageUrl,
          activeMenuItem,
          isSidebarCollapsed,
          userRole,
        }),
      );
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [isAuthenticated, username, name, profileImageUrl, activeMenuItem, isSidebarCollapsed, userRole]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timerId = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);

    return () => window.clearTimeout(timerId);
  }, [isMobileSidebarOpen]);

  const getDisplayName = () => {
    if (name.trim()) return name.trim();
    return username.split('@')[0] || 'User';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (!username.trim() || !password.trim()) {
        setError('Please fill in all fields');
        return;
      }
    } else {
      if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
        setError('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    try {
      setIsSubmittingAuth(true);
      const endpoint = apiUrl(isLogin ? '/api/auth/login.php' : '/api/auth/register.php');
      const payload = isLogin
        ? { username, password }
        : { username: name, name, password, confirmPassword };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        message?: string;
        user?: { name?: string; username?: string; role?: string };
      };

      if (!response.ok) {
        setError(data.message || 'Authentication failed.');
        return;
      }

      if (data.user?.username) {
        setUsername(data.user.username);
      }
      if (data.user?.username || data.user?.name) {
        setName(normalizeUsername(data.user?.username || data.user?.name || ''));
      }
      if (data.user?.role) {
        setUserRole(data.user.role as UserRole);
      }

      setIsAuthenticated(true);
    } catch {
      setError(AUTH_CONNECTION_ERROR);
    } finally {
      setIsSubmittingAuth(false);
    }
  };



  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setProfileImageUrl('');
      setActiveMenuItem('dashboard');
      setIsLoggingOut(false);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }, 350);
  };

  const logoutButtonClass =
    'text-xs text-primary hover:underline mt-1';

  if (systemStatusUiAllowed && systemPanelOpen) {
    return (
      <SystemStatusPage
        onBack={() => {
          window.location.hash = '';
          setSystemPanelOpen(false);
        }}
      />
    );
  }

  if (isLoggingOut) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--background)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <div style={{ textAlign: 'center', opacity: 0.6 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ margin: '0 auto 8px', display: 'block', animation: 'spin 0.8s linear infinite' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Signing out...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="size-full flex bg-background max-w-full overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar
            activeItem={activeMenuItem}
            onItemClick={(item) => {
              setActiveMenuItem(item);
              setIsMobileSidebarOpen(false);
            }}
            collapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            userRole={userRole}
          />
        </div>

        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-[1200] bg-black/40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.div
                className="fixed inset-y-0 left-0 z-[1300] w-20 lg:hidden"
                initial={{ x: -80, opacity: 0.95 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -80, opacity: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              >
                <Sidebar
                  activeItem={activeMenuItem}
                  onItemClick={(item) => {
                    setActiveMenuItem(item);
                    setIsMobileSidebarOpen(false);
                  }}
                  collapsed={false}
                  onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
                  userRole={userRole}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.div
          className="flex-1 flex flex-col h-full overflow-hidden max-w-full"
          animate={{ x: isMobileSidebarOpen ? 80 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 32 }}
        >
          <header className="relative z-[1100] bg-card border-b border-border px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-hidden">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="lg:hidden"
                aria-label="Open menu"
                onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <PHDateTime />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative size-10 rounded-full border transition-all duration-200 flex items-center justify-center ${
                  showNotifications
                    ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/70 hover:border-border hover:shadow-sm'
                }`}
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              <NotificationPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={filteredNotifications}
                setNotifications={setNotifications}
                onNotificationClick={(page) => {
                  setActiveMenuItem(page);
                  setShowNotifications(false);
                }}
              />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground max-w-48 truncate">
                    {getDisplayName()}
                  </div>
                  <div className="text-xs text-muted-foreground">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className={logoutButtonClass}>
                        Log out
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm log out</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to log out? You will need to sign in again to access the dashboard.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex gap-2 pt-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>OK</AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <button
                  type="button"
                  className="size-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-all duration-200 hover:scale-[1.03] hover:shadow-md active:scale-95"
                >
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile" className="size-full rounded-full object-cover" />
                  ) : (
                    getDisplayName().charAt(0).toUpperCase()
                  )}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {activeMenuItem === 'dashboard' && <DashboardOverview onNavigate={setActiveMenuItem} />}
              {activeMenuItem === 'analytics' && <AnalyticsDashboard />}
              {activeMenuItem === 'settings' && (
                <SettingsPage
                  initialName={name || getDisplayName()}
                  onUsernameChange={(nextUsername) => setName(normalizeUsername(nextUsername))}
                  onProfileImageChange={setProfileImageUrl}
                />
              )}
              {activeMenuItem === 'addRecord' && <AddMonitoringRecord />}
              {activeMenuItem === 'userManagement' && <UserManagement />}
              {(activeMenuItem === 'mapping' || activeMenuItem === 'monitoring' || activeMenuItem === 'reports') && (
                <MappingAreas
                  initialTab={activeMenuItem === 'mapping' ? 'map' : (activeMenuItem as 'monitoring' | 'reports')}
                />
              )}
              {activeMenuItem !== 'dashboard' && activeMenuItem !== 'analytics' && activeMenuItem !== 'mapping' && activeMenuItem !== 'settings' && activeMenuItem !== 'monitoring' && activeMenuItem !== 'reports' && activeMenuItem !== 'addRecord' && activeMenuItem !== 'userManagement' && (
                <div className="text-center py-12">
                  <h2 className="text-muted-foreground">
                    {activeMenuItem.charAt(0).toUpperCase() + activeMenuItem.slice(1)} - Coming Soon
                  </h2>
                </div>
              )}
            </motion.div>
          </main>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative size-full flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-card border-b border-border px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-50">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="size-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 border border-white/15 bg-white/10">
            <img src={logoSidebar} alt="Mangrove Logo" className="size-6 rounded-full object-cover" />
          </div>
          <span className="text-xl font-semibold text-primary">Mangrove</span>
        </div>

        <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
          <button type="button" onClick={() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })} className="text-foreground hover:text-primary transition-colors font-medium text-sm">Home</button>
          <button type="button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="text-foreground hover:text-primary transition-colors font-medium text-sm">About</button>
          <button type="button" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-foreground hover:text-primary transition-colors font-medium text-sm">Features</button>
          <button type="button" onClick={() => document.getElementById('map-preview')?.scrollIntoView({ behavior: 'smooth' })} className="text-foreground hover:text-primary transition-colors font-medium text-sm">Map Preview</button>
        </div>

      </nav>

      {/* Home Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-6 py-8 pt-24 relative overflow-hidden" style={{
        backgroundImage: `url('${backgroundImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
      <div className="absolute inset-0 bg-background/30" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center lg:text-left"
        >
          <div className="mb-6">
            <h1 className="text-5xl lg:text-6xl font-semibold mb-4 text-center lg:text-left" style={{ color: '#2d6a4f', WebkitTextStroke: '1px white', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Mangrove</h1>
            <p className="text-xl lg:text-2xl text-white max-w-md mx-auto lg:mx-0 leading-relaxed" style={{ WebkitTextStroke: '1px white', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              Monitor and protect Panabo City's mangrove conservation areas with a clean, responsive control panel.
            </p>

          </div>
        </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-white/95 border border-white/70 backdrop-blur-xl rounded-[28px] shadow-2xl shadow-slate-900/10 p-8">
              <AnimatePresence mode="wait">
                {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      id="login-username"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="Username"
                    />

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="login-password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow pr-12"
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5C7 5 2.73 8.11 1 12.46c1.73 4.35 6 7.54 11 7.54s9.27-3.19 11-7.54C21.27 8.11 17 5 12 5m0 9c-1.38 0-2.5-1.12-2.5-2.5S10.62 8.5 12 8.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 11.5c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm7.31-7.31l.41.41 1.15 1.15c1.49 1.26 2.68 2.89 3.43 4.75-1.73 4.39-6 7.5-11 7.5-1.4 0-2.74-.25-3.98-.7l.41.41 2.15 2.15C10.74 16.87 11.35 17 12 17c2.76 0 5-2.24 5-5 0-.79-.2-1.53-.53-2.2l2.31 2.31c.13-.4.22-.82.22-1.27 0-2.76-2.24-5-5-5-.45 0-.87.09-1.27.22l2.15 2.15z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-destructive text-sm"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity font-semibold"
                    >
                      {isSubmittingAuth ? 'Please wait...' : 'Log in'}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        className="text-primary hover:underline text-sm"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="bg-accent hover:bg-accent/80 text-accent-foreground px-8 py-3 rounded-lg transition-colors font-semibold"
                      >
                        Create new account
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-4">
                    <h2 className="text-center mb-2">Sign Up</h2>
                    <p className="text-center text-sm text-muted-foreground">It's quick and easy.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={name}
                      onChange={(e) => setName(normalizeUsername(e.target.value))}
                      maxLength={MAX_USERNAME_LENGTH}
                      className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="Username"
                    />

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow pr-12"
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5C7 5 2.73 8.11 1 12.46c1.73 4.35 6 7.54 11 7.54s9.27-3.19 11-7.54C21.27 8.11 17 5 12 5m0 9c-1.38 0-2.5-1.12-2.5-2.5S10.62 8.5 12 8.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 11.5c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm7.31-7.31l.41.41 1.15 1.15c1.49 1.26 2.68 2.89 3.43 4.75-1.73 4.39-6 7.5-11 7.5-1.4 0-2.74-.25-3.98-.7l.41.41 2.15 2.15C10.74 16.87 11.35 17 12 17c2.76 0 5-2.24 5-5 0-.79-.2-1.53-.53-2.2l2.31 2.31c.13-.4.22-.82.22-1.27 0-2.76-2.24-5-5-5-.45 0-.87.09-1.27.22l2.15 2.15z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow pr-12"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 5C7 5 2.73 8.11 1 12.46c1.73 4.35 6 7.54 11 7.54s9.27-3.19 11-7.54C21.27 8.11 17 5 12 5m0 9c-1.38 0-2.5-1.12-2.5-2.5S10.62 8.5 12 8.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 11.5c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm7.31-7.31l.41.41 1.15 1.15c1.49 1.26 2.68 2.89 3.43 4.75-1.73 4.39-6 7.5-11 7.5-1.4 0-2.74-.25-3.98-.7l.41.41 2.15 2.15C10.74 16.87 11.35 17 12 17c2.76 0 5-2.24 5-5 0-.79-.2-1.53-.53-2.2l2.31 2.31c.13-.4.22-.82.22-1.27 0-2.76-2.24-5-5-5-.45 0-.87.09-1.27.22l2.15 2.15z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-destructive text-sm"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-xs text-muted-foreground text-center">
                      By clicking Sign Up, you agree to our Terms, Data Policy and Cookie Policy.
                    </p>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isSubmittingAuth}
                        className="flex-1 bg-accent hover:bg-accent/80 text-accent-foreground px-8 py-3 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold"
                      >
                        {isSubmittingAuth ? 'Creating account...' : 'Sign Up'}
                      </button>
                    </div>

                    <div className="text-center pt-4">
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        Already have an account?
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-background/95 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-primary">About Mangrove</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg text-foreground mb-4">
                Mangrove is a comprehensive monitoring and conservation system designed to protect and preserve mangrove ecosystems in Panabo City and surrounding areas.
              </p>
              <p className="text-muted-foreground mb-4">
                Our platform leverages cutting-edge technology to track mangrove health, monitor growth patterns, and provide actionable insights for conservation efforts.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Our Mission:</strong> To safeguard these vital coastal ecosystems through innovative technology, community engagement, and sustainable practices.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Our Vision:</strong> A future where mangrove forests thrive, supporting biodiversity, protecting coastlines, and contributing to climate resilience.
              </p>
              <p className="text-muted-foreground">
                Join us in our mission to safeguard these vital coastal ecosystems for future generations.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Hectares Monitored</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">20+</div>
                  <div className="text-sm text-muted-foreground">Species Tracked</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Real-time Monitoring</div>
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-primary">15+</div>
                  <div className="text-sm text-muted-foreground">Conservation Sites</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">20+</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-card py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
              <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-muted-foreground">Track mangrove health and growth with real-time data updates and analytics.</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
              <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Maps</h3>
              <p className="text-muted-foreground">Visualize mangrove areas with detailed mapping and location tracking.</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
              <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Detailed Reports</h3>
              <p className="text-muted-foreground">Generate comprehensive reports on mangrove status and conservation efforts.</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
              <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Alert System</h3>
              <p className="text-muted-foreground">Receive instant notifications for critical events and environmental changes.</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
              <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Access</h3>
              <p className="text-muted-foreground">Role-based access control ensures data security and user privacy.</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
              <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Data Sync</h3>
              <p className="text-muted-foreground">Automatic synchronization ensures your data is always up-to-date across devices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section id="map-preview" className="bg-background/95 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">Map Preview</h2>
          <p className="text-center text-muted-foreground mb-8">Explore Panabo City's mangrove conservation areas</p>
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
              <div className="text-center">
                <svg className="size-16 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-lg font-medium text-foreground">Interactive Map</p>
                <p className="text-sm text-muted-foreground"></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
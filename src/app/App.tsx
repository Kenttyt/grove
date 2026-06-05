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

type GoogleCredentialResponse = { credential?: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              width?: string | number;
            }
          ) => void;
        };
      };
    };
  }
}

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
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
    },
    {
      id: '2',
      type: 'check',
      title: 'Mangrove status updated',
      message: 'The health status of mangrove areas in Panabo City has been updated.',
      date: '2026-06-04',
      targetPage: 'monitoring',
      isRead: false,
    },
    {
      id: '3',
      type: 'alert',
      title: 'Critical damage alert',
      message: 'Critical damage detected in a monitored mangrove zone. Immediate attention required.',
      date: '2026-06-04',
      targetPage: 'mapping',
      isRead: false,
    },
  ]);
  const unreadNotificationsCount = notifications.filter((notification) => !notification.isRead).length;
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [systemPanelOpen, setSystemPanelOpen] = useState(
    () => typeof window !== 'undefined' && systemStatusUiAllowed && window.location.hash === '#system'
  );
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const googleClientId = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_GOOGLE_CLIENT_ID;
  const normalizeUsername = (value: string) => value.trim().slice(0, MAX_USERNAME_LENGTH);
  const AUTH_STORAGE_KEY = 'leoworks-auth';

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
            email?: string;
            name?: string;
            profileImageUrl?: string;
            activeMenuItem?: string;
            isSidebarCollapsed?: boolean;
          };
          if (parsed.email || parsed.name || parsed.profileImageUrl) {
            setEmail(parsed.email ?? '');
            setName(parsed.name ?? '');
            setProfileImageUrl(parsed.profileImageUrl ?? '');
            setActiveMenuItem(parsed.activeMenuItem ?? 'dashboard');
            setIsSidebarCollapsed(parsed.isSidebarCollapsed ?? false);
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
          email,
          name,
          profileImageUrl,
          activeMenuItem,
          isSidebarCollapsed,
        }),
      );
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [isAuthenticated, email, name, profileImageUrl, activeMenuItem, isSidebarCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timerId = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);

    return () => window.clearTimeout(timerId);
  }, [isMobileSidebarOpen]);

  const getDisplayName = () => {
    if (name.trim()) return name.trim();
    return email.split('@')[0] || 'User';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isLogin) {
      if (!name) {
        setError('Please enter your username');
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
        ? { email, password }
        : { name, email, password, confirmPassword };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        message?: string;
        user?: { name?: string; username?: string; email?: string };
      };

      if (!response.ok) {
        setError(data.message || 'Authentication failed.');
        return;
      }

      if (data.user?.email) {
        setEmail(data.user.email);
      }
      if (data.user?.username || data.user?.name) {
        setName(normalizeUsername(data.user?.username || data.user?.name || ''));
      }

      setIsAuthenticated(true);
    } catch {
      setError(AUTH_CONNECTION_ERROR);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  useEffect(() => {
    if (!isLogin || isAuthenticated) return;
    if (!googleClientId) {
      setGoogleError('Google sign-in is not configured yet.');
      return;
    }

    const initGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
          if (!response.credential) {
            setError('Google sign-in failed. Please try again.');
            return;
          }

          try {
            setIsSubmittingAuth(true);
            setError('');

            const apiResponse = await fetch(apiUrl('/api/auth/google-login.php'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            });

            const data = (await apiResponse.json()) as {
              message?: string;
              user?: { username?: string; email?: string };
            };

            if (!apiResponse.ok) {
              setError(data.message || 'Google login failed.');
              return;
            }

            setEmail(data.user?.email || '');
            setName(normalizeUsername(data.user?.username || ''));
            setIsAuthenticated(true);
          } catch {
            setError(AUTH_CONNECTION_ERROR);
          } finally {
            setIsSubmittingAuth(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 320,
      });
    };

    if (window.google) {
      initGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=en';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleButton;
    script.onerror = () => setGoogleError('Failed to load Google sign-in script.');
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [googleClientId, isAuthenticated, isLogin]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsAuthenticated(false);
      setEmail('');
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
                notifications={notifications}
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
                  <div className="text-xs text-muted-foreground">Administrator</div>
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
                  initialEmail={email}
                  onUsernameChange={(nextUsername) => setName(normalizeUsername(nextUsername))}
                  onProfileImageChange={setProfileImageUrl}
                />
              )}
              {activeMenuItem === 'addRecord' && <AddMonitoringRecord />}
              {(activeMenuItem === 'mapping' || activeMenuItem === 'monitoring' || activeMenuItem === 'reports') && (
                <MappingAreas
                  initialTab={activeMenuItem === 'mapping' ? 'map' : (activeMenuItem as 'monitoring' | 'reports')}
                />
              )}
              {activeMenuItem !== 'dashboard' && activeMenuItem !== 'analytics' && activeMenuItem !== 'mapping' && activeMenuItem !== 'settings' && activeMenuItem !== 'monitoring' && activeMenuItem !== 'reports' && activeMenuItem !== 'addRecord' && (
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
    <div className="relative size-full flex items-center justify-center px-6 py-8 overflow-hidden bg-background lg:bg-transparent">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1767917654279-dfeea8500862?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600')",
        }}
      />
      <div className="absolute inset-0 bg-background/60" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center lg:text-left"
        >
          <div className="mb-6">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="size-16 rounded-full flex items-center justify-center shadow-2xl shadow-primary/20 border border-white/15 bg-white/10">
                <img src={logoSidebar} alt="Mangrove Logo" className="size-9 rounded-full object-cover" />
              </div>
              <h1 className="text-4xl lg:text-5xl text-primary font-semibold">Mangrove</h1>
            </div>
            <p className="text-xl lg:text-2xl text-foreground/90 max-w-md mx-auto lg:mx-0 leading-relaxed">
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
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="Email address or phone number"
                    />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="Password"
                    />
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

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                    </div>

                    <div className="w-full flex justify-center mb-4">
                      <div ref={googleButtonRef} />
                    </div>
                    {googleError && (
                      <p className="text-xs text-muted-foreground text-center mb-2">{googleError}</p>
                    )}

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
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
                      value={name}
                      onChange={(e) => setName(normalizeUsername(e.target.value))}
                      maxLength={MAX_USERNAME_LENGTH}
                      className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="User Name"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="Email address"
                    />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="New password"
                    />

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                      placeholder="Confirm password"
                    />

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
    </div>
  );
}
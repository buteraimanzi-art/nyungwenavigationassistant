import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ParkHeader } from '@/components/park/ParkHeader';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, LayoutDashboard, Siren, KeyRound, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/alerts', label: 'Emergencies', icon: Siren },
  { to: '/admin/codes', label: 'Access codes', icon: KeyRound },
  { to: '/admin/hikers', label: 'Live hikers', icon: Radio },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    // Always send back to dashboard from sub-pages so the trail is predictable
    if (location.pathname === '/admin') {
      navigate('/');
    } else {
      navigate('/admin');
    }
  };

  const backLabel = location.pathname === '/admin' ? 'Back to app' : 'Back to dashboard';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ParkHeader />

      {/* Admin sub-header: back button + tabs */}
      <div className="border-b bg-card/30 backdrop-blur sticky top-16 z-30">
        <div className="container px-4 md:px-8">
          <div className="flex items-center gap-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
            <div className="h-5 w-px bg-border" />
            <nav className="flex-1 overflow-x-auto">
              <ul className="flex items-center gap-1 min-w-max">
                {TABS.map((tab) => {
                  const active =
                    tab.to === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(tab.to);
                  return (
                    <li key={tab.to}>
                      <Link
                        to={tab.to}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-smooth border-b-2 -mb-px',
                          active
                            ? 'text-primary border-primary'
                            : 'text-muted-foreground hover:text-foreground border-transparent',
                        )}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <main className="flex-1">{children}</main>
    </div>
  );
}

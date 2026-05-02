import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, User, Map, X, Smartphone, LogOut, ShieldCheck, KeyRound, Radio, LayoutDashboard, HelpCircle } from 'lucide-react';
import nyungweLogo from '@/assets/nyungwe-logo.webp';
import { useAuth } from '@/hooks/use-auth';
import { openOnboardingTour } from '@/components/OnboardingTour';

const navLinks = [
  { to: '/', label: 'Routes' },
  { to: '/planner', label: 'Planner' },
  { to: '/features', label: 'Features' },
  { to: '/updates', label: 'Updates' },
];

export function ParkHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-smooth border-b ${
        scrolled
          ? 'glass border-border/60 shadow-soft'
          : 'bg-komoot-header/95 border-transparent'
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand — left */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-full gradient-primary opacity-0 group-hover:opacity-30 blur-md transition-smooth" />
            <img
              src={nyungweLogo}
              alt="Nyungwe"
              className="relative w-10 h-10 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/40 transition-smooth"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg tracking-tight text-komoot-header-foreground">
              Nyungwe
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
              National Park
            </span>
          </div>
        </Link>

        {/* Right cluster — nav + actions */}
        <div className="flex items-center gap-2 md:gap-8">
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link-underline text-sm font-medium tracking-wide transition-smooth ${
                    active
                      ? 'active text-foreground'
                      : 'text-foreground/65 hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:block h-6 w-px bg-border/70" />

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="hidden sm:flex gap-1.5 rounded-full border-primary/40 text-primary bg-primary/5 hover:bg-primary hover:text-primary-foreground hover:border-primary px-4 font-medium transition-smooth"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex gap-1.5 rounded-full border-primary/30 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground hover:border-primary px-4 font-medium transition-smooth"
            >
              <Smartphone className="w-4 h-4" />
              App
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="rounded-full gradient-primary text-primary-foreground hover:shadow-glow px-4 font-medium border-0 transition-smooth"
                >
                  <User className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">{user ? 'Account' : 'Sign in'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 mt-2 shadow-floaty">
                {user ? (
                  <>
                    <DropdownMenuItem disabled className="opacity-100 text-xs text-muted-foreground">
                      {user.email}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem disabled className="opacity-100 text-xs text-primary">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/planner')}>
                      <Map className="w-4 h-4 mr-2" />My Trails
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <LayoutDashboard className="w-4 h-4 mr-2" />Admin dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/alerts')}>
                          <ShieldCheck className="w-4 h-4 mr-2" />Emergency portal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/codes')}>
                          <KeyRound className="w-4 h-4 mr-2" />Trail access codes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/hikers')}>
                          <Radio className="w-4 h-4 mr-2" />Live hikers
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut().then(() => navigate('/auth'))}>
                      <LogOut className="w-4 h-4 mr-2" />Sign out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => navigate('/auth')}>
                    <User className="w-4 h-4 mr-2" />Sign in / Sign up
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden glass border-t border-border/60 animate-fade-in">
          <nav className="container flex flex-col py-3 px-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-3 text-sm font-medium rounded-lg transition-smooth ${
                  location.pathname === link.to
                    ? 'text-primary-foreground gradient-primary shadow-soft'
                    : 'text-foreground/75 hover:bg-secondary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

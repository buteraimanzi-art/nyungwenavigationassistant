import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TreePine, Menu, User, Map, X, Smartphone } from 'lucide-react';

export function ParkHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-komoot-header">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo – Komoot style mountain icon */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-komoot-olive flex items-center justify-center">
            <TreePine className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline font-bold text-lg tracking-tight text-komoot-header-foreground">
            Nyungwe
          </span>
        </Link>

        {/* Desktop nav – Komoot style */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-komoot-header-foreground/80 hover:text-komoot-header-foreground transition-colors">
            Routes
          </Link>
          <span className="text-sm font-medium text-komoot-header-foreground/80 hover:text-komoot-header-foreground transition-colors cursor-pointer">
            Planner
          </span>
          <span className="text-sm font-medium text-komoot-header-foreground/80 hover:text-komoot-header-foreground transition-colors cursor-pointer">
            Features
          </span>
          <span className="text-sm font-medium text-komoot-header-foreground/80 hover:text-komoot-header-foreground transition-colors cursor-pointer">
            Updates
          </span>
        </nav>

        {/* Right side – Komoot style buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex gap-1.5 border-komoot-olive text-komoot-olive bg-transparent hover:bg-komoot-olive hover:text-primary-foreground rounded-full px-4 font-medium"
          >
            <Smartphone className="w-4 h-4" />
            App
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full bg-komoot-header-foreground text-komoot-header hover:bg-komoot-header-foreground/90 px-4 font-medium"
              >
                <User className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Login or Signup</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem><Map className="w-4 h-4 mr-2" />My Trails</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-komoot-header-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-komoot-header border-t border-komoot-header-foreground/10">
          <nav className="container flex flex-col py-3 px-4 space-y-1">
            <Link
              to="/"
              className="px-3 py-2.5 text-sm font-medium text-komoot-header-foreground rounded-md hover:bg-komoot-header-foreground/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Routes
            </Link>
            <span className="px-3 py-2.5 text-sm font-medium text-komoot-header-foreground/70 rounded-md hover:bg-komoot-header-foreground/10 cursor-pointer">
              Planner
            </span>
            <span className="px-3 py-2.5 text-sm font-medium text-komoot-header-foreground/70 rounded-md hover:bg-komoot-header-foreground/10 cursor-pointer">
              Features
            </span>
            <span className="px-3 py-2.5 text-sm font-medium text-komoot-header-foreground/70 rounded-md hover:bg-komoot-header-foreground/10 cursor-pointer">
              Updates
            </span>
          </nav>
        </div>
      )}
    </header>
  );
}

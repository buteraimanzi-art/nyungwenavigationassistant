import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TreePine, Menu, User, Settings, LogOut, Shield, Map, Info, Phone, X } from 'lucide-react';

export function ParkHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TreePine className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-foreground">Nyungwe</span>
            <span className="font-medium text-primary ml-1">Trail Tracker</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Trails</Link>
          <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">About Park</span>
          <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Safety</span>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>Emergency: +250 788 000 000</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>Trail Explorer</span>
                  <span className="text-xs font-normal text-muted-foreground">Guest</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Map className="w-4 h-4 mr-2" />My Trails</DropdownMenuItem>
              <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive"><LogOut className="w-4 h-4 mr-2" />Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container flex flex-col py-4 px-4 space-y-2">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted" onClick={() => setIsMenuOpen(false)}>
              <Map className="w-4 h-4" />Trails
            </Link>
            <span className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted cursor-pointer">
              <Info className="w-4 h-4" />About Park
            </span>
            <span className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted cursor-pointer">
              <Shield className="w-4 h-4" />Safety
            </span>
            <div className="pt-2 border-t border-border">
              <a href="tel:+250788000000" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive rounded-md hover:bg-destructive/10">
                <Phone className="w-4 h-4" />Emergency: +250 788 000 000
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

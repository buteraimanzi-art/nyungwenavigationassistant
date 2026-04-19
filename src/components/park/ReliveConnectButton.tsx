import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRelive } from '@/hooks/use-relive';
import { Loader2, LogOut, Play, User } from 'lucide-react';

export function ReliveConnectButton() {
  const { isConnected, connecting, connect, disconnect, user } = useRelive();

  if (!isConnected) {
    return (
      <Button onClick={connect} disabled={connecting} className="gap-2">
        {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        Connect Relive
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <User className="w-4 h-4" />
          {user?.display_name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuLabel>Connected to Relive</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="https://www.relive.cc" target="_blank" rel="noopener noreferrer">
            Open Relive
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

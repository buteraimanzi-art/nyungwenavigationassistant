import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

/**
 * Smart back button. Goes to `to` if provided, otherwise tries history.back(),
 * falling back to the home route.
 */
export function BackButton({ to, label = 'Back', className }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (to) {
      navigate(to);
      return;
    }
    // Use history if we have somewhere to go back to within the app
    if (window.history.length > 1 && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn('gap-1.5 text-muted-foreground hover:text-foreground -ml-2', className)}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}

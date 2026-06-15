import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ParkHeader } from '@/components/park/ParkHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldAlert, Users } from 'lucide-react';

const CEOS = [
  {
    name: 'Nzayisenga Feline',
    role: 'Co-CEO & Co-Founder',
    initials: 'NF',
    bio: 'Drives the vision and strategy behind safer, smarter exploration of Nyungwe National Park.',
  },
  {
    name: 'Niwemutoni Denyse',
    role: 'Co-CEO & Co-Founder',
    initials: 'ND',
    bio: 'Leads product and operations, focused on giving every hiker a guided, connected experience.',
  },
];

export default function AdminAbout() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <ParkHeader />
        <div className="container px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-primary" /> Admin only
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This page is restricted to park administrators.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container px-4 py-6 md:py-10 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> About us
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            The people leading the Nyungwe Navigation Assistant.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CEOS.map((c) => (
            <Card key={c.name} className="overflow-hidden">
              <CardContent className="p-6 flex items-start gap-4">
                <div
                  className="h-16 w-16 shrink-0 rounded-full flex items-center justify-center text-xl font-bold text-primary-foreground bg-primary"
                  aria-hidden
                >
                  {c.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold">{c.name}</div>
                  <div className="text-sm text-primary font-medium">{c.role}</div>
                  <p className="text-sm text-muted-foreground mt-2">{c.bio}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Our mission</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Nyungwe Navigation Assistant helps visitors discover Nyungwe National Park safely — with
            real-time trail guidance, emergency support, and tools that connect hikers to rangers
            when it matters most.
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

'use client';
import { useAuth } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User size={18} />Profile</CardTitle><CardDescription>Your account information</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">First Name</label><Input value={user?.firstName || ''} readOnly /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Last Name</label><Input value={user?.lastName || ''} readOnly /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input value={user?.email || ''} readOnly /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Role</label><div><Badge>{user?.role}</Badge></div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield size={18} />Security</CardTitle><CardDescription>Account security settings</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">JWT tokens are managed automatically. Sessions expire after 7 days.</p>
          <Button variant="destructive" onClick={logout}>Sign Out</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell size={18} />Notifications</CardTitle><CardDescription>Notification preferences</CardDescription></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Notification settings coming soon.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings size={18} />System</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>API: http://localhost:3000</p>
          <p>Swagger: <a href="http://localhost:3000/api/docs" target="_blank" className="text-primary underline">localhost:3000/api/docs</a></p>
          <p>Admin Panel: http://localhost:3001</p>
        </CardContent>
      </Card>
    </div>
  );
}

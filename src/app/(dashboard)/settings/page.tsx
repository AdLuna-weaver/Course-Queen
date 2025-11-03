import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>
            Configure your company branding and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Settings page coming soon.</p>
            <p className="text-sm mt-2">
              This will include company branding, AI preferences, and user management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

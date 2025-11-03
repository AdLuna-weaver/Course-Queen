import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Palette, Users, DollarSign } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account, company, and application preferences
        </p>
      </div>

      {/* Settings Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Company Branding</CardTitle>
                <CardDescription>Logo, colors, and style guide</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure your company's branding to be used across all generated courses.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Coming soon
            </div>
          </CardContent>
        </Card>

        {/* Team Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage users and permissions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add team members, assign roles, and manage access to courses.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Coming soon
            </div>
          </CardContent>
        </Card>

        {/* AI Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>AI Preferences</CardTitle>
                <CardDescription>Configure AI generation settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set default prompts, tone, and other AI generation preferences.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Coming soon
            </div>
          </CardContent>
        </Card>

        {/* Billing & Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Billing & Usage</CardTitle>
                <CardDescription>Track AI costs and usage</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor your AI API usage and costs across all courses.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resources</h2>
          <p className="text-muted-foreground">
            Upload and manage course resources
          </p>
        </div>
        <Button>Upload Resource</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Library</CardTitle>
          <CardDescription>
            Upload PDFs, DOCX files, and other resources to use in your courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No resources uploaded yet.</p>
            <p className="text-sm mt-2">
              Upload your first resource to get started with AI-powered course generation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

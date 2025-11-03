import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, FileType, FileSpreadsheet } from 'lucide-react';

export default function ResourcesPage() {
  // TODO: Fetch real resources from Supabase
  const resources: any[] = [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resources</h2>
          <p className="text-muted-foreground mt-1">
            Upload and manage course materials for AI-powered content generation
          </p>
        </div>
        <Button size="lg" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Resource
        </Button>
      </div>

      {/* Empty State */}
      {resources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No resources yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Upload PDFs, DOCX files, and other materials. Our AI will use them to generate relevant course content.
            </p>
            <Button size="lg" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Your First Resource
            </Button>
            
            {/* Supported File Types */}
            <div className="mt-8 grid grid-cols-3 gap-8 text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-5 w-5" />
                </div>
                <span>PDF Files</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <FileType className="h-5 w-5" />
                </div>
                <span>DOCX Files</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <span>XLSX Files</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Resources Grid - Will be shown when resources exist */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource: any) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{resource.name}</CardTitle>
                <CardDescription>{resource.type.toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

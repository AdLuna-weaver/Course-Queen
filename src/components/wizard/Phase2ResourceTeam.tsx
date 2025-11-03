'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Users, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import {
  uploadResource,
  deleteResource,
  getResources,
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
} from '@/app/(dashboard)/courses/resource-actions';
import { updateWizardPhase } from '@/app/(dashboard)/courses/actions';

interface Resource {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
  metadata: {
    size: number;
    contentType: string;
  };
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    id: string;
    email: string;
  };
}

interface Phase2ResourceTeamProps {
  courseId: string;
}

export function Phase2ResourceTeam({ courseId }: Phase2ResourceTeamProps) {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Team form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Deadline state
  const [targetCompletionDate, setTargetCompletionDate] = useState<Date | undefined>();
  const [smeReviewDate, setSmeReviewDate] = useState<Date | undefined>();
  const [finalApprovalDate, setFinalApprovalDate] = useState<Date | undefined>();

  // Load resources and team members
  useEffect(() => {
    loadData();
  }, [courseId]);

  async function loadData() {
    setLoading(true);
    try {
      const [resourcesData, teamData] = await Promise.all([
        getResources(courseId),
        getTeamMembers(courseId),
      ]);
      setResources(resourcesData);
      setTeamMembers(teamData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  // File upload with react-dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('');

    for (const file of acceptedFiles) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('courseId', courseId);
        formData.append('file', file);

        const result = await uploadResource(formData);

        if (result.success && result.resource) {
          setResources((prev) => [result.resource, ...prev]);
        } else {
          setError(result.error || 'Failed to upload file');
        }
      } catch (err) {
        setError('Failed to upload file');
        console.error(err);
      } finally {
        setUploading(false);
      }
    }
  }, [courseId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  async function handleDeleteResource(resourceId: string) {
    const result = await deleteResource(resourceId);
    if (result.success) {
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
    } else {
      setError(result.error || 'Failed to delete resource');
    }
  }

  async function handleAddTeamMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !role) return;

    setAddingMember(true);
    setError('');

    try {
      const result = await addTeamMember(courseId, email, role);

      if (result.success) {
        setEmail('');
        setRole('');
        await loadData(); // Reload team members
      } else {
        setError(result.error || 'Failed to add team member');
      }
    } catch (err) {
      setError('Failed to add team member');
      console.error(err);
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveTeamMember(userId: string) {
    const result = await removeTeamMember(courseId, userId);
    if (result.success) {
      setTeamMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } else {
      setError(result.error || 'Failed to remove team member');
    }
  }

  async function handleContinue() {
    setError('');

    // Validation: at least 1 resource
    if (resources.length === 0) {
      setError('Please upload at least one resource before continuing');
      return;
    }

    setSaving(true);
    try {
      // Update wizard phase to mark phase 2 as complete
      const result = await updateWizardPhase(
        courseId,
        2,
        {
          target_completion_date: targetCompletionDate?.toISOString(),
          sme_review_date: smeReviewDate?.toISOString(),
          final_approval_date: finalApprovalDate?.toISOString(),
        },
        true
      );

      if (!result.success) {
        setError(result.error || 'Failed to save progress');
        return;
      }

      // Navigate to Phase 3
      router.push(`/courses/${courseId}/wizard?phase=3`);
    } catch (err) {
      setError('Failed to save progress');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    router.push(`/courses/${courseId}/wizard?phase=1`);
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* SECTION A: Resource Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resource Upload
          </CardTitle>
          <CardDescription>
            Upload course materials, documents, and reference files (PDF, DOCX, XLSX, images)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} disabled={uploading} />
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            {uploading ? (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            ) : isDragActive ? (
              <p className="text-sm text-muted-foreground">Drop files here...</p>
            ) : (
              <>
                <p className="text-sm font-medium mb-1">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, XLSX, or images (max 10MB)
                </p>
              </>
            )}
          </div>

          {/* Resource List */}
          {resources.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Resources ({resources.length})</Label>
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{resource.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(resource.metadata.size)} • {formatDate(resource.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteResource(resource.id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION B: Team Assembly */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Assembly
          </CardTitle>
          <CardDescription>
            Add subject matter experts, reviewers, and collaborators to your course
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Team Member Form */}
          <form onSubmit={handleAddTeamMember} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr,auto,auto]">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={addingMember}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={addingMember}>
                  <SelectTrigger id="role" className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SME">SME (Subject Matter Expert)</SelectItem>
                    <SelectItem value="Reviewer">Reviewer</SelectItem>
                    <SelectItem value="Creator">Creator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="sm:invisible">Add</Label>
                <Button type="submit" disabled={!email || !role || addingMember}>
                  {addingMember ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Member'
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Team Member List */}
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Team Members ({teamMembers.length})</Label>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{member.profiles.email}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {member.role}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTeamMember(member.user_id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {teamMembers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No team members added yet. Add collaborators to help develop this course.
            </p>
          )}
        </CardContent>
      </Card>

      {/* SECTION C: Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Project Deadlines
          </CardTitle>
          <CardDescription>
            Set target dates for course development milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="target-completion">Target Completion</Label>
              <DatePicker
                date={targetCompletionDate}
                onDateChange={setTargetCompletionDate}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sme-review">SME Review Deadline</Label>
              <DatePicker
                date={smeReviewDate}
                onDateChange={setSmeReviewDate}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="final-approval">Final Approval</Label>
              <DatePicker
                date={finalApprovalDate}
                onDateChange={setFinalApprovalDate}
                placeholder="Select date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handleBack} disabled={saving}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={saving || resources.length === 0}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue to Branding'
          )}
        </Button>
      </div>
    </div>
  );
}

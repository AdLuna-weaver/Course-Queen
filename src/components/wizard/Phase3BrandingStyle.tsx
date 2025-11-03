'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { HexColorPicker } from 'react-colorful';
import { Upload, X, Palette, FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { uploadLogo, saveBranding, getBranding, type BrandingData } from '@/app/(dashboard)/courses/branding-actions';
import { updateWizardPhase } from '@/app/(dashboard)/courses/actions';

interface WritingStyle {
  targetAudienceLevel: string;
  industryJargon: string;
  sentenceStructure: string;
  voicePreference: string;
  examplesPreference: string[];
  formattingStyle: string;
  callToActionStyle: string;
  exampleContent: string;
}

interface Phase3BrandingStyleProps {
  courseId: string;
}

export function Phase3BrandingStyle({ courseId }: Phase3BrandingStyleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Branding state
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [headingFont, setHeadingFont] = useState('Inter');
  const [bodyFont, setBodyFont] = useState('Inter');

  // Writing style state
  const [writingStyle, setWritingStyle] = useState<WritingStyle>({
    targetAudienceLevel: '',
    industryJargon: '',
    sentenceStructure: '',
    voicePreference: '',
    examplesPreference: [],
    formattingStyle: '',
    callToActionStyle: '',
    exampleContent: '',
  });

  const systemFonts = [
    'Inter',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
    'Palatino',
    'Garamond',
  ];

  useEffect(() => {
    loadBrandingData();
  }, [courseId]);

  async function loadBrandingData() {
    setLoading(true);
    try {
      const brandingData = await getBranding(courseId);
      if (brandingData) {
        setLogoUrl(brandingData.logoUrl || '');
        setPrimaryColor(brandingData.primaryColor || '#3b82f6');
        setSecondaryColor(brandingData.secondaryColor || '#8b5cf6');
        setHeadingFont(brandingData.headingFont || 'Inter');
        setBodyFont(brandingData.bodyFont || 'Inter');
      }
    } catch (err) {
      console.error('Error loading branding:', err);
    } finally {
      setLoading(false);
    }
  }

  // Logo upload with react-dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('file', file);

      const result = await uploadLogo(formData);

      if (result.success && result.logoUrl) {
        setLogoUrl(result.logoUrl);
      } else {
        setError(result.error || 'Failed to upload logo');
      }
    } catch (err) {
      setError('Failed to upload logo');
      console.error(err);
    } finally {
      setUploading(false);
    }
  }, [courseId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
  });

  function handleRemoveLogo() {
    setLogoUrl('');
  }

  function handleExamplePreferenceChange(value: string, checked: boolean) {
    if (checked) {
      setWritingStyle({
        ...writingStyle,
        examplesPreference: [...writingStyle.examplesPreference, value],
      });
    } else {
      setWritingStyle({
        ...writingStyle,
        examplesPreference: writingStyle.examplesPreference.filter((v) => v !== value),
      });
    }
  }

  async function handleContinue() {
    setError('');
    setSaving(true);

    try {
      // Save branding data to courses.custom_branding
      const brandingData: BrandingData = {
        logoUrl,
        primaryColor,
        secondaryColor,
        headingFont,
        bodyFont,
      };

      const brandingResult = await saveBranding(courseId, brandingData);

      if (!brandingResult.success) {
        setError(brandingResult.error || 'Failed to save branding');
        return;
      }

      // Save writing style to wizard_phases
      const wizardResult = await updateWizardPhase(courseId, 3, writingStyle, true);

      if (!wizardResult.success) {
        setError(wizardResult.error || 'Failed to save writing style');
        return;
      }

      // Navigate to Phase 4
      router.push(`/courses/${courseId}/wizard?phase=4`);
    } catch (err) {
      setError('Failed to save Phase 3 data');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    router.push(`/courses/${courseId}/wizard?phase=2`);
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

      {/* SECTION A: Company Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Company Branding
          </CardTitle>
          <CardDescription>
            Customize your course appearance with your brand identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-4">
            <Label>Company Logo</Label>

            {!logoUrl ? (
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
                <ImageIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                {uploading ? (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                ) : isDragActive ? (
                  <p className="text-sm text-muted-foreground">Drop logo here...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">
                      Drag & drop your logo, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG (max 5MB)
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="relative inline-block">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img
                    src={logoUrl}
                    alt="Company logo"
                    className="max-h-32 max-w-full object-contain"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Brand Colors */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <div
                      className="h-4 w-4 rounded border"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="font-mono text-sm">{primaryColor}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <div
                      className="h-4 w-4 rounded border"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <span className="font-mono text-sm">{secondaryColor}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <HexColorPicker color={secondaryColor} onChange={setSecondaryColor} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Fonts */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="heading-font">Heading Font</Label>
              <Select value={headingFont} onValueChange={setHeadingFont}>
                <SelectTrigger id="heading-font">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {systemFonts.map((font) => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body-font">Body Font</Label>
              <Select value={bodyFont} onValueChange={setBodyFont}>
                <SelectTrigger id="body-font">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {systemFonts.map((font) => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Style Preview */}
          <div className="mt-6">
            <Label className="mb-3 block">Style Preview</Label>
            <div
              className="rounded-lg border p-6 space-y-3"
              style={{
                borderColor: primaryColor,
                backgroundColor: `${primaryColor}08`,
              }}
            >
              <h3
                className="text-xl font-bold"
                style={{
                  fontFamily: headingFont,
                  color: primaryColor,
                }}
              >
                Sample Course Heading
              </h3>
              <p
                className="text-sm"
                style={{
                  fontFamily: bodyFont,
                  color: secondaryColor,
                }}
              >
                This is how your course content will appear with the selected branding.
                The heading uses {headingFont} and the body text uses {bodyFont}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION B: Writing Style Questionnaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Writing Style Questionnaire
          </CardTitle>
          <CardDescription>
            Help our AI understand your preferred writing style for course content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question 1: Target Audience Level */}
          <div className="space-y-3">
            <Label>1. Target audience level</Label>
            <Select
              value={writingStyle.targetAudienceLevel}
              onValueChange={(value) =>
                setWritingStyle({ ...writingStyle, targetAudienceLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select audience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry-level">Entry-level reps</SelectItem>
                <SelectItem value="experienced">Experienced reps</SelectItem>
                <SelectItem value="managers">Managers</SelectItem>
                <SelectItem value="mixed">Mixed audience</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question 2: Industry Jargon */}
          <div className="space-y-3">
            <Label>2. Industry jargon</Label>
            <RadioGroup
              value={writingStyle.industryJargon}
              onValueChange={(value) =>
                setWritingStyle({ ...writingStyle, industryJargon: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="use-freely" id="jargon-freely" />
                <Label htmlFor="jargon-freely" className="font-normal cursor-pointer">
                  Use freely
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="explain-first" id="jargon-explain" />
                <Label htmlFor="jargon-explain" className="font-normal cursor-pointer">
                  Explain when first used
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="avoid" id="jargon-avoid" />
                <Label htmlFor="jargon-avoid" className="font-normal cursor-pointer">
                  Avoid completely
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question 3: Sentence Structure */}
          <div className="space-y-3">
            <Label>3. Sentence structure</Label>
            <RadioGroup
              value={writingStyle.sentenceStructure}
              onValueChange={(value) =>
                setWritingStyle({ ...writingStyle, sentenceStructure: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short-punchy" id="structure-short" />
                <Label htmlFor="structure-short" className="font-normal cursor-pointer">
                  Short and punchy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="conversational" id="structure-conversational" />
                <Label htmlFor="structure-conversational" className="font-normal cursor-pointer">
                  Conversational
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formal" id="structure-formal" />
                <Label htmlFor="structure-formal" className="font-normal cursor-pointer">
                  Academic/formal
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question 4: Voice Preference */}
          <div className="space-y-3">
            <Label>4. Voice preference</Label>
            <RadioGroup
              value={writingStyle.voicePreference}
              onValueChange={(value) =>
                setWritingStyle({ ...writingStyle, voicePreference: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="always-active" id="voice-always" />
                <Label htmlFor="voice-always" className="font-normal cursor-pointer">
                  Always active voice
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mostly-active" id="voice-mostly" />
                <Label htmlFor="voice-mostly" className="font-normal cursor-pointer">
                  Mostly active voice
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no-preference" id="voice-none" />
                <Label htmlFor="voice-none" className="font-normal cursor-pointer">
                  Doesn&apos;t matter
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question 5: Examples Preference */}
          <div className="space-y-3">
            <Label>5. Examples preference (select all that apply)</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="examples-stories"
                  checked={writingStyle.examplesPreference.includes('customer-stories')}
                  onCheckedChange={(checked) =>
                    handleExamplePreferenceChange('customer-stories', checked as boolean)
                  }
                />
                <Label htmlFor="examples-stories" className="font-normal cursor-pointer">
                  Real customer stories
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="examples-hypothetical"
                  checked={writingStyle.examplesPreference.includes('hypothetical')}
                  onCheckedChange={(checked) =>
                    handleExamplePreferenceChange('hypothetical', checked as boolean)
                  }
                />
                <Label htmlFor="examples-hypothetical" className="font-normal cursor-pointer">
                  Hypothetical scenarios
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="examples-data"
                  checked={writingStyle.examplesPreference.includes('data-driven')}
                  onCheckedChange={(checked) =>
                    handleExamplePreferenceChange('data-driven', checked as boolean)
                  }
                />
                <Label htmlFor="examples-data" className="font-normal cursor-pointer">
                  Data-driven examples
                </Label>
              </div>
            </div>
          </div>

          {/* Question 6: Formatting Style */}
          <div className="space-y-3">
            <Label>6. Formatting style</Label>
            <RadioGroup
              value={writingStyle.formattingStyle}
              onValueChange={(value) =>
                setWritingStyle({ ...writingStyle, formattingStyle: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bullet-heavy" id="format-bullets" />
                <Label htmlFor="format-bullets" className="font-normal cursor-pointer">
                  Bullet-heavy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paragraph-heavy" id="format-paragraphs" />
                <Label htmlFor="format-paragraphs" className="font-normal cursor-pointer">
                  Paragraph-heavy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="format-mixed" />
                <Label htmlFor="format-mixed" className="font-normal cursor-pointer">
                  Mixed approach
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question 7: Call-to-Action Style */}
          <div className="space-y-3">
            <Label>7. Call-to-action style</Label>
            <RadioGroup
              value={writingStyle.callToActionStyle}
              onValueChange={(value) =>
                setWritingStyle({ ...writingStyle, callToActionStyle: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="cta-direct" />
                <Label htmlFor="cta-direct" className="font-normal cursor-pointer">
                  Direct (&quot;Do this&quot;)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suggestive" id="cta-suggestive" />
                <Label htmlFor="cta-suggestive" className="font-normal cursor-pointer">
                  Suggestive (&quot;Consider this&quot;)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exploratory" id="cta-exploratory" />
                <Label htmlFor="cta-exploratory" className="font-normal cursor-pointer">
                  Exploratory (&quot;How might you...&quot;)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question 8: Example Content */}
          <div className="space-y-3">
            <Label htmlFor="example-content">
              8. Example content (optional)
            </Label>
            <p className="text-xs text-muted-foreground">
              Paste 2-3 paragraphs of your ideal writing style
            </p>
            <Textarea
              id="example-content"
              placeholder="Paste sample content here..."
              value={writingStyle.exampleContent}
              onChange={(e) => {
                const value = e.target.value.slice(0, 500);
                setWritingStyle({ ...writingStyle, exampleContent: value });
              }}
              rows={6}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {writingStyle.exampleContent.length} / 500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handleBack} disabled={saving}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save & Continue to Outline'
          )}
        </Button>
      </div>
    </div>
  );
}

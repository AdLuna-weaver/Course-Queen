import mammoth from 'mammoth';

export interface DOCXParseResult {
  text: string;
  html: string;
  wordCount: number;
  metadata: {
    hasImages: boolean;
    hasTables: boolean;
  };
}

export async function parseDOCX(buffer: Buffer): Promise<DOCXParseResult> {
  try {
    // Extract plain text
    const textResult = await mammoth.extractRawText({ buffer });

    // Extract HTML for richer formatting
    const htmlResult = await mammoth.convertToHtml({ buffer });

    const wordCount = textResult.value.split(/\s+/).filter(Boolean).length;
    const hasImages = htmlResult.value.includes('<img');
    const hasTables = htmlResult.value.includes('<table');

    return {
      text: textResult.value,
      html: htmlResult.value,
      wordCount,
      metadata: {
        hasImages,
        hasTables,
      },
    };
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

export function cleanDocxText(text: string): string {
  // Remove excessive whitespace
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

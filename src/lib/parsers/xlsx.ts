import * as XLSX from 'xlsx';

export interface XLSXParseResult {
  sheets: SheetData[];
  metadata: {
    sheetCount: number;
    totalRows: number;
    totalCells: number;
  };
}

export interface SheetData {
  name: string;
  data: any[][];
  rowCount: number;
  columnCount: number;
}

export async function parseXLSX(buffer: Buffer): Promise<XLSXParseResult> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheets: SheetData[] = [];
    let totalRows = 0;
    let totalCells = 0;

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const rowCount = data.length;
      const columnCount = Math.max(...data.map((row) => row.length));
      const cellCount = data.reduce((sum, row) => sum + row.length, 0);

      sheets.push({
        name: sheetName,
        data,
        rowCount,
        columnCount,
      });

      totalRows += rowCount;
      totalCells += cellCount;
    }

    return {
      sheets,
      metadata: {
        sheetCount: sheets.length,
        totalRows,
        totalCells,
      },
    };
  } catch (error) {
    console.error('Error parsing XLSX:', error);
    throw new Error('Failed to parse XLSX file');
  }
}

export function xlsxToText(parseResult: XLSXParseResult): string {
  let text = '';

  for (const sheet of parseResult.sheets) {
    text += `Sheet: ${sheet.name}\n\n`;

    for (const row of sheet.data) {
      text += row.join('\t') + '\n';
    }

    text += '\n';
  }

  return text;
}

export function xlsxToCSV(sheetData: SheetData): string {
  return sheetData.data
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
}

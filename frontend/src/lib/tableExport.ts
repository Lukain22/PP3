export type ExportCell = string | number | Date | null | undefined;

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => ExportCell;
  width?: number;
}

export interface ExportReportMeta {
  generatedBy: string;
  generatedAt?: Date;
}

export type ExportFormat = 'xlsx' | 'csv';

const CSV_DELIMITER = ';';
const MAX_COLUMN_WIDTH = 42;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatExportDate(value: Date) {
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
}

export function formatExportTime(value: Date) {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

export function exportFilename(base: string, format: ExportFormat, at = new Date()) {
  const stamp = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}_${pad(at.getHours())}${pad(at.getMinutes())}`;
  return `${base}_${stamp}.${format}`;
}

function cellText(value: ExportCell) {
  if (value == null) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : formatExportDate(value);
  return String(value);
}

function plainText(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvField(value: string) {
  const text = plainText(value);
  if (/["\r\n;,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function metaLines(meta: ExportReportMeta, count: number, at: Date) {
  return [
    `Generado por: ${meta.generatedBy || 'Usuario'}`,
    `Cantidad de registros: ${count}`,
    `Fecha de generación: ${formatExportDate(at)}`,
    `Hora de generación: ${formatExportTime(at)}`
  ];
}

function buildCsv<T>(columns: ExportColumn<T>[], rows: T[], meta: ExportReportMeta, at: Date) {
  const lines = [
    ...metaLines(meta, rows.length, at).map((line) => csvField(line)),
    '',
    columns.map((column) => csvField(column.header)).join(CSV_DELIMITER),
    ...rows.map((row) => columns.map((column) => csvField(cellText(column.value(row)))).join(CSV_DELIMITER))
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

function columnWidth<T>(column: ExportColumn<T>, rows: T[]) {
  const longest = rows.reduce(
    (max, row) => Math.max(max, cellText(column.value(row)).length),
    column.header.length
  );
  return Math.min(MAX_COLUMN_WIDTH, Math.max(column.width ?? 12, longest + 2, column.header.length + 2));
}

async function buildXlsx<T>(columns: ExportColumn<T>[], rows: T[], meta: ExportReportMeta, at: Date) {
  const loaded = await import('exceljs');
  const excel =
    typeof loaded.Workbook === 'function' ? loaded : (loaded as { default: typeof loaded }).default;
  const workbook = new excel.Workbook();
  workbook.creator = meta.generatedBy || 'Usuario';
  workbook.created = at;
  const sheet = workbook.addWorksheet('Reporte', {
    views: [{ state: 'frozen', ySplit: 6, showGridLines: false }]
  });

  metaLines(meta, rows.length, at).forEach((line, index) => {
    sheet.mergeCells(index + 1, 1, index + 1, Math.max(columns.length, 1));
    const cell = sheet.getCell(index + 1, 1);
    cell.value = line;
    cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF424242' } };
  });

  const headerRow = sheet.getRow(6);
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  headerRow.height = 22;

  rows.forEach((row, rowIndex) => {
    const sheetRow = sheet.getRow(7 + rowIndex);
    columns.forEach((column, index) => {
      const raw = column.value(row);
      const cell = sheetRow.getCell(index + 1);
      if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
        cell.value = raw;
        cell.numFmt = 'dd/mm/yyyy';
      } else {
        cell.value = plainText(cellText(raw));
      }
      cell.font = { name: 'Calibri', size: 11 };
      cell.alignment = { vertical: 'middle' };
    });
  });

  columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = columnWidth(column, rows);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadTableExport<T>(options: {
  filenameBase: string;
  format: ExportFormat;
  columns: ExportColumn<T>[];
  rows: T[];
  meta: ExportReportMeta;
}) {
  const at = options.meta.generatedAt ?? new Date();
  const filename = exportFilename(options.filenameBase, options.format, at);
  const blob =
    options.format === 'xlsx'
      ? await buildXlsx(options.columns, options.rows, options.meta, at)
      : new Blob([buildCsv(options.columns, options.rows, options.meta, at)], {
          type: 'text/csv;charset=utf-8'
        });
  downloadBlob(blob, filename);
  return filename;
}

import { formatExportDate, formatExportTime } from './tableExport';

export interface DashboardPdfSlice {
  name: string;
  value: number;
  color: string;
}

export interface DashboardPdfChart {
  title: string;
  data: DashboardPdfSlice[];
}

interface PdfOptions {
  charts: DashboardPdfChart[];
  subtitle: string;
  generatedBy: string;
}

const SCALE = 2;
const PAGE_W = 1100;
const MARGIN = 36;
const GAP = 20;
const HEADER = 92;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function filename(at: Date) {
  const stamp = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}_${pad(at.getHours())}${pad(at.getMinutes())}`;
  return `Tablero_${stamp}.pdf`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let next = text;
  while (next.length > 1 && ctx.measureText(`${next}…`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}…`;
}

function drawPie(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  data: DashboardPdfSlice[]
) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  let angle = -Math.PI / 2;
  data.forEach((slice) => {
    const sweep = total > 0 ? (slice.value / total) * Math.PI * 2 : 0;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    angle += sweep;
  });
}

function cardHeight(chart: DashboardPdfChart) {
  return 48 + 200 + chart.data.length * 22 + 18;
}

function drawChartCard(
  ctx: CanvasRenderingContext2D,
  chart: DashboardPdfChart,
  x: number,
  y: number,
  width: number,
  height: number
) {
  roundRect(ctx, x, y, width, height, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '600 18px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(fitText(ctx, chart.title, width - 32), x + 16, y + 16);

  const pieRadius = 78;
  const cx = x + width / 2;
  const cy = y + 48 + 100;
  drawPie(ctx, cx, cy, pieRadius, chart.data);

  const total = chart.data.reduce((sum, slice) => sum + slice.value, 0);
  let legendY = cy + pieRadius + 18;
  ctx.font = '14px Inter, sans-serif';
  chart.data.forEach((slice) => {
    const percent = total > 0 ? Math.round((slice.value / total) * 100) : 0;
    ctx.fillStyle = slice.color;
    ctx.beginPath();
    ctx.arc(x + 24, legendY + 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillText(fitText(ctx, `${slice.name}  ${slice.value} (${percent}%)`, width - 48), x + 38, legendY);
    legendY += 22;
  });
}

function paintPage(charts: DashboardPdfChart[], options: PdfOptions, at: Date, showHeader: boolean) {
  const columns = charts.length > 1 ? 2 : 1;
  const cardWidth = (PAGE_W - MARGIN * 2 - GAP * (columns - 1)) / columns;
  const rows: DashboardPdfChart[][] = [];
  for (let index = 0; index < charts.length; index += columns) {
    rows.push(charts.slice(index, index + columns));
  }
  const headerHeight = showHeader ? HEADER : 28;
  const bodyHeight = rows.reduce((sum, row) => sum + Math.max(...row.map(cardHeight)) + GAP, 0);
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W * SCALE;
  canvas.height = (headerHeight + bodyHeight + 8) * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el PDF');
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, PAGE_W, canvas.height / SCALE);

  if (showHeader) {
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 28px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Tablero', MARGIN, 24);
    ctx.fillStyle = '#475569';
    ctx.font = '15px Inter, sans-serif';
    ctx.fillText(fitText(ctx, options.subtitle, PAGE_W - MARGIN * 2), MARGIN, 58);
    ctx.fillText(
      `Generado por ${options.generatedBy || 'Usuario'} · ${formatExportDate(at)} ${formatExportTime(at)}`,
      MARGIN,
      78
    );
  }

  let y = headerHeight;
  rows.forEach((row) => {
    const height = Math.max(...row.map(cardHeight));
    row.forEach((chart, index) => {
      drawChartCard(ctx, chart, MARGIN + index * (cardWidth + GAP), y, cardWidth, height);
    });
    y += height + GAP;
  });

  return canvas;
}

function stackHeight(charts: DashboardPdfChart[], withHeader: boolean) {
  let height = withHeader ? HEADER : 28;
  for (let index = 0; index < charts.length; index += 2) {
    const row = charts.slice(index, index + 2);
    height += Math.max(...row.map(cardHeight)) + GAP;
  }
  return height;
}

function pagesFor(charts: DashboardPdfChart[]) {
  const pages: DashboardPdfChart[][] = [];
  let current: DashboardPdfChart[] = [];
  const limit = 1480;
  charts.forEach((chart) => {
    const next = [...current, chart];
    if (current.length > 0 && stackHeight(next, pages.length === 0) > limit) {
      pages.push(current);
      current = [chart];
      return;
    }
    current = next;
  });
  if (current.length) pages.push(current);
  return pages;
}

export async function downloadDashboardPdf(options: PdfOptions) {
  if (options.charts.length === 0) {
    throw new Error('No hay gráficos para exportar');
  }
  const at = new Date();
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;
  const pages = pagesFor(options.charts);

  pages.forEach((pageCharts, index) => {
    if (index > 0) pdf.addPage();
    const canvas = paintPage(pageCharts, options, at, index === 0);
    const pageHeight = pdf.internal.pageSize.getHeight();
    let drawWidth = contentWidth;
    let drawHeight = (canvas.height * contentWidth) / canvas.width;
    if (drawHeight > pageHeight - margin * 2) {
      drawHeight = pageHeight - margin * 2;
      drawWidth = (canvas.width * drawHeight) / canvas.height;
    }
    const x = margin + (contentWidth - drawWidth) / 2;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, margin, drawWidth, drawHeight);
  });

  pdf.save(filename(at));
  return filename(at);
}

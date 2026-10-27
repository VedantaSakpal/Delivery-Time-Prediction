import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format currency cleanly without unicode glyph issues in standard PDF fonts.
 * Uses "Rs." which renders reliably in all PDF viewers.
 */
function formatCurrency(val) {
  const num = Number(val || 0);
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(val) {
  return Number(val || 0).toLocaleString('en-IN');
}

/**
 * Generates and downloads a clean, professional, executive-grade PDF operations report.
 * Structured with strict column metrics, zero encoding artifacts, and clear numerical hierarchy.
 * 
 * @param {Object} reportData - Complete report payload from /api/reports/operations
 * @param {Object} meta - Optional metadata (userRole, dateRangeLabel, generatedBy)
 */
export function generateOperationsReportPDF(reportData, meta = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const entityName = reportData?.entity_name || (meta.userRole === 'admin' ? 'justwoww Fleet Platform' : 'Kitchen Partner');
  const granularity = reportData?.granularity || 'day';
  const granLabel = {
    day: 'Daily Operations & Revenue Audit',
    week: 'Weekly Operations & Revenue Audit',
    month: 'Monthly Financial & Operations Report',
    year: 'Annual Financial & Operations Audit',
  }[granularity] || 'Operations & Revenue Report';

  const summary = reportData?.summary || {};
  const periodicData = reportData?.periodic_data || [];
  const statusBreakdown = reportData?.status_breakdown || [];
  const topPerformers = reportData?.top_performers || [];
  const recentOperations = reportData?.recent_operations || [];

  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // ─── 1. Header Banner ───
  doc.setFillColor(25, 20, 17); // Dark Espresso #191411
  doc.rect(0, 0, pageWidth, 44, 'F');

  // Decorative Saffron Line
  doc.setFillColor(255, 87, 34); // #FF5722
  doc.rect(0, 44, pageWidth, 2.5, 'F');

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  // Draw justwoww Vector Logo Icon Mark on the left
  const logoX = margin;
  const logoY = 9;
  const logoSize = 25;

  // Squircle Base
  doc.setFillColor(255, 75, 43); // Electric Coral
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 6, 6, 'F');

  // Inner subtle highlight border
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(logoX + 0.8, logoY + 0.8, logoSize - 1.6, logoSize - 1.6, 5.2, 5.2, 'D');

  // Speed 'W' Monogram
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.8);
  doc.line(logoX + 5, logoY + 7.5, logoX + 9, logoY + 17.5);
  doc.line(logoX + 9, logoY + 17.5, logoX + 12.5, logoY + 9.5);
  doc.line(logoX + 12.5, logoY + 9.5, logoX + 16, logoY + 17.5);
  doc.line(logoX + 16, logoY + 17.5, logoX + 20, logoY + 7.5);

  // Joyful Accent Smile Underneath
  doc.setDrawColor(255, 224, 130);
  doc.setLineWidth(1.1);
  doc.line(logoX + 7, logoY + 20.5, logoX + 18, logoY + 20.5);

  // 4-Point 'WOW' Sparkle Star
  doc.setFillColor(255, 213, 79);
  doc.circle(logoX + 21, logoY + 5.5, 1.3, 'F');

  const textX = logoX + logoSize + 4.5;
  doc.text('JUSTWOWW ENTERPRISE', textX, 16);

  doc.setFontSize(11);
  doc.setTextColor(251, 146, 60); // Warm Amber #fb923c
  doc.text(granLabel.toUpperCase(), textX, 23);

  // Sub-header details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(214, 211, 209);
  doc.text(`Entity: ${entityName}`, textX, 30);
  doc.text(`Generated: ${timestamp}  |  Official Transaction Audit`, textX, 36);

  // Right-side badge
  doc.setFillColor(41, 37, 36);
  doc.roundedRect(pageWidth - margin - 54, 9, 54, 25, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(251, 191, 36);
  doc.text('EXECUTIVE AUDIT', pageWidth - margin - 50, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Scope: ${reportData?.scope === 'restaurant' ? 'Restaurant' : 'Platform Fleet'}`, pageWidth - margin - 50, 22);
  doc.text(`Total Orders: ${formatNumber(summary.total_orders)}`, pageWidth - margin - 50, 28);

  let currentY = 53;

  // ─── 2. Executive KPI Cards Grid ───
  const kpiCards = [
    {
      label: 'TOTAL VOLUME',
      value: `${formatNumber(summary.total_orders)} Orders`,
      sub: `${formatNumber(summary.active_orders || 0)} In-Flight / Active`,
      valColor: [25, 20, 17]
    },
    {
      label: 'GROSS REVENUE',
      value: formatCurrency(summary.total_revenue),
      sub: 'Cumulative transactions',
      valColor: [22, 101, 52] // Dark Green
    },
    {
      label: 'FULFILLMENT RATE',
      value: `${Number(summary.fulfillment_rate || 0).toFixed(1)}%`,
      sub: `${formatNumber(summary.delivered_orders || 0)} Delivered Orders`,
      valColor: [30, 64, 175] // Blue
    },
    {
      label: 'AVG ORDER VALUE',
      value: formatCurrency(summary.avg_order_value),
      sub: `Avg ETA ~${Math.round(summary.avg_delivery_time_min || 28)} mins`,
      valColor: [194, 65, 12] // Orange/Amber
    },
  ];

  const cardSpacing = 3;
  const cardWidth = (contentWidth - cardSpacing * 3) / 4;
  const cardHeight = 22;

  kpiCards.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + cardSpacing);
    doc.setFillColor(250, 247, 242);
    doc.setDrawColor(226, 218, 207);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(120, 113, 108);
    doc.text(kpi.label, cardX + 3.5, currentY + 5.5);

    // Number Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(kpi.valColor[0], kpi.valColor[1], kpi.valColor[2]);
    doc.text(kpi.value, cardX + 3.5, currentY + 12.5);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(140, 130, 120);
    doc.text(kpi.sub, cardX + 3.5, currentY + 18);
  });

  currentY += cardHeight + 8;

  // ─── 3. Primary Table: Periodic Breakdown (Day/Week/Month/Year) ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(25, 20, 17);
  doc.text(`1. ${granularity.toUpperCase()} OPERATIONAL BREAKDOWN TABLE`, margin, currentY);
  currentY += 3.5;

  const tableHead = [
    ['Period', 'Total Orders', 'Gross Revenue', 'Delivered', 'Active', 'Fulfillment', 'Avg Basket']
  ];

  const tableBody = periodicData.map(row => [
    row.period_label || row.period_key,
    formatNumber(row.total_orders),
    formatCurrency(row.revenue),
    formatNumber(row.delivered_orders),
    formatNumber(row.active_orders),
    `${Number(row.fulfillment_rate || 0).toFixed(1)}%`,
    formatCurrency(row.avg_order_value),
  ]);

  if (tableBody.length === 0) {
    tableBody.push(['No periodic records logged', '0', formatCurrency(0), '0', '0', '0.0%', formatCurrency(0)]);
  }

  // Summary row at the bottom
  tableBody.push([
    'TOTAL / FLEET SUMMARY',
    formatNumber(summary.total_orders),
    formatCurrency(summary.total_revenue),
    formatNumber(summary.delivered_orders),
    formatNumber(summary.active_orders),
    `${Number(summary.fulfillment_rate || 0).toFixed(1)}%`,
    formatCurrency(summary.avg_order_value),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [255, 87, 34],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [253, 250, 246],
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 38 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', fontStyle: 'bold', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 24 },
      6: { halign: 'right', cellWidth: 30 },
    },
    didParseCell: function (data) {
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fillColor = [245, 238, 227];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [25, 20, 17];
      }
    },
  });

  currentY = doc.lastAutoTable.finalY + 9;

  // ─── 4. Secondary Section: Status Distribution ───
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(25, 20, 17);
  doc.text('2. ORDER STATUS DISTRIBUTION & TELEMETRY', margin, currentY);
  currentY += 3.5;

  const statusHead = [['Order Status', 'Volume Count', 'Gross Revenue', 'Share of Volume']];
  const statusBody = statusBreakdown.map(s => [
    s.status ? s.status.replace('_', ' ').toUpperCase() : 'UNKNOWN',
    `${formatNumber(s.count)} orders`,
    formatCurrency(s.revenue),
    `${Number(s.share_pct || 0).toFixed(1)}%`,
  ]);

  if (statusBody.length === 0) {
    statusBody.push(['No status data available', '0', formatCurrency(0), '0.0%']);
  }

  autoTable(doc, {
    startY: currentY,
    head: statusHead,
    body: statusBody,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59], valign: 'middle' },
    headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 247, 242] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 52 },
      1: { halign: 'center', cellWidth: 38 },
      2: { halign: 'right', fontStyle: 'bold', cellWidth: 46 },
      3: { halign: 'center', cellWidth: 46 },
    },
  });

  currentY = doc.lastAutoTable.finalY + 9;

  // ─── 5. Top Performers ───
  if (topPerformers.length > 0) {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 16;
    }

    const performerTitle = reportData?.scope === 'restaurant'
      ? '3. TOP SELLING MENU ITEMS'
      : '3. TOP PERFORMING KITCHEN PARTNERS';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(25, 20, 17);
    doc.text(performerTitle, margin, currentY);
    currentY += 3.5;

    let performerHead, performerBody, colConfig;
    if (reportData?.scope === 'restaurant') {
      performerHead = [['Rank', 'Dish / Menu Item', 'Units Sold', 'Total Sales Revenue']];
      performerBody = topPerformers.map((item, i) => [
        `#${i + 1}`,
        item.name || 'Signature Item',
        `${formatNumber(item.quantity_sold)} units`,
        formatCurrency(item.total_revenue),
      ]);
      colConfig = {
        0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
        1: { fontStyle: 'bold', cellWidth: 84 },
        2: { halign: 'center', cellWidth: 40 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 40 },
      };
    } else {
      performerHead = [['Rank', 'Kitchen Partner', 'Orders Handled', 'Gross Revenue', 'Fulfillment']];
      performerBody = topPerformers.map((rest, i) => [
        `#${i + 1}`,
        rest.name || 'Kitchen Partner',
        formatNumber(rest.orders_count),
        formatCurrency(rest.total_revenue),
        `${Number(rest.fulfillment_rate || 0).toFixed(1)}%`,
      ]);
      colConfig = {
        0: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
        1: { fontStyle: 'bold', cellWidth: 68 },
        2: { halign: 'center', cellWidth: 32 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 38 },
        4: { halign: 'center', cellWidth: 28 },
      };
    }

    autoTable(doc, {
      startY: currentY,
      head: performerHead,
      body: performerBody,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59], valign: 'middle' },
      headStyles: { fillColor: [255, 87, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 247, 242] },
      columnStyles: colConfig,
    });

    currentY = doc.lastAutoTable.finalY + 9;
  }

  // ─── 6. Recent Transaction Audit Log ───
  if (recentOperations.length > 0) {
    if (currentY > pageHeight - 75) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(25, 20, 17);
    doc.text('4. RECENT TRANSACTION AUDIT LOG', margin, currentY);
    currentY += 3.5;

    const logHead = [['Order ID', 'Date & Time', 'Customer', 'Items Summary', 'Total Amount', 'Status']];
    const logBody = recentOperations.slice(0, 12).map(o => [
      `#${o.short_id || o.id.slice(0, 8)}`,
      o.formatted_time || '—',
      o.customer_name || 'Guest',
      o.items_summary || 'Order Items',
      formatCurrency(o.total_amount),
      (o.status || 'pending').toUpperCase(),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: logHead,
      body: logBody,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59], valign: 'middle' },
      headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 247, 242] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 24 },
        1: { cellWidth: 34 },
        2: { cellWidth: 30 },
        3: { cellWidth: 46 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
        5: { halign: 'center', cellWidth: 22 },
      },
    });

    currentY = doc.lastAutoTable.finalY + 9;
  }

  // ─── 7. Sign-off & Audit Certification ───
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 16;
  }

  doc.setDrawColor(214, 211, 209);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120, 113, 108);
  doc.text(
    'Audit Statement: This official operations document was compiled automatically from verified transactional databases and dispatch telemetry.',
    margin,
    currentY
  );
  currentY += 4;
  doc.text(
    'Confidentiality: Intended solely for internal leadership, management heads, restaurant partners, and operational audits.',
    margin,
    currentY
  );

  // Sign-off columns
  currentY += 10;
  const col1X = margin + 15;
  const col2X = pageWidth / 2 + 15;

  doc.setDrawColor(168, 162, 158);
  doc.line(col1X, currentY, col1X + 50, currentY);
  doc.line(col2X, currentY, col2X + 50, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(87, 83, 78);
  doc.text('Prepared by: Operations Lead', col1X, currentY + 4);
  doc.text('Approved by: Head of Operations / Director', col2X, currentY + 4);

  // ─── 8. Page Numbers in Footer ───
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 130, 120);
    doc.text(
      `justwoww Operational Telemetry  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Generate safe filename and trigger download
  const cleanEntity = entityName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `justwoww_${cleanEntity}_${granularity}_report_${dateStr}.pdf`;

  doc.save(filename);
}

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

async function exportLeadsToExcel(leads, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Leads');

  sheet.columns = [
    { header: 'Business Name', key: 'businessName', width: 32 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'City', key: 'cityName', width: 18 },
    { header: 'State', key: 'stateCode', width: 10 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Assigned To', key: 'assignedTo', width: 22 },
    { header: 'Last Contacted', key: 'lastContactedAt', width: 16 },
    { header: 'Next Follow-up', key: 'nextFollowUpDate', width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  leads.forEach((lead) => {
    sheet.addRow({
      businessName: lead.businessName,
      category: lead.categoryId?.name || '',
      cityName: lead.cityName || '',
      stateCode: lead.stateCode || '',
      phone: (lead.phones || []).join(', '),
      email: lead.email || '',
      status: lead.status,
      assignedTo: lead.assignedTo?.name || '',
      lastContactedAt: fmt(lead.lastContactedAt),
      nextFollowUpDate: fmt(lead.nextFollowUpDate),
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=leads-report.xlsx');

  await workbook.xlsx.write(res);
  res.end();
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------
const COLORS = {
  navy: '#0B1230',
  accent: '#F97316',
  text: '#111827',
  muted: '#6B7280',
  line: '#E5E7EB',
  zebra: '#F8FAFC',
};

// [pill background, pill text]
const STATUS_COLORS = {
  New: ['#F3F4F6', '#374151'],
  'Attempted Contact': ['#FEF3C7', '#92400E'],
  Contacted: ['#DBEAFE', '#1D4ED8'],
  Interested: ['#EDE9FE', '#6D28D9'],
  'Demo/Visit Scheduled': ['#E0E7FF', '#4338CA'],
  Visited: ['#CCFBF1', '#0F766E'],
  Negotiation: ['#FFEDD5', '#C2410C'],
  Converted: ['#DCFCE7', '#15803D'],
  Lost: ['#FEE2E2', '#B91C1C'],
};

const showDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

function exportLeadsToPDF(leads, res) {
  const MARGIN = 36;
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: MARGIN, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=leads-report.pdf');
  doc.pipe(res);

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const tableW = pageW - MARGIN * 2;

  // Column widths add up to the usable width (770pt on A4 landscape)
  const columns = [
    { key: 'no', label: '#', w: 26 },
    { key: 'business', label: 'BUSINESS', w: 190 },
    { key: 'city', label: 'CITY', w: 100 },
    { key: 'phone', label: 'PHONE', w: 95 },
    { key: 'status', label: 'STATUS', w: 100 },
    { key: 'assigned', label: 'ASSIGNED TO', w: 100 },
    { key: 'last', label: 'LAST CONTACTED', w: 80 },
    { key: 'next', label: 'NEXT FOLLOW-UP', w: 79 },
  ];
  const scale = tableW / columns.reduce((s, c) => s + c.w, 0);
  columns.forEach((c) => (c.w *= scale));

  const HEADER_H = 22;
  const ROW_H = 20;
  const bottomLimit = pageH - MARGIN - 14; // keep room for the footer

  // ---- Title banner ----
  doc.rect(0, 0, pageW, 64).fill(COLORS.navy);
  doc.rect(0, 64, pageW, 3).fill(COLORS.accent);
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text('Campussafar CRM', MARGIN, 16, { lineBreak: false });
  doc.font('Helvetica').fontSize(10).fillColor('#CBD5E1').text('Leads Report', MARGIN, 40, { lineBreak: false });
  doc
    .fontSize(9)
    .fillColor('#CBD5E1')
    .text(
      `Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      MARGIN,
      28,
      { width: tableW, align: 'right', lineBreak: false }
    );

  // ---- Summary line ----
  const counts = {};
  leads.forEach((l) => {
    counts[l.status] = (counts[l.status] || 0) + 1;
  });
  const summary = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([s, n]) => `${s}: ${n}`)
    .join('   |   ');

  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.text).text(`${leads.length} leads`, MARGIN, 82, { lineBreak: false });
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.muted)
    .text(summary, MARGIN + 80, 84, { width: tableW - 80, lineBreak: false, ellipsis: true });

  // ---- Table helpers ----
  const drawTableHeader = (y) => {
    doc.rect(MARGIN, y, tableW, HEADER_H).fill(COLORS.navy);
    let x = MARGIN;
    columns.forEach((c) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#FFFFFF')
        .text(c.label, x + 6, y + 7, { width: c.w - 12, lineBreak: false });
      x += c.w;
    });
  };

  const cellText = (text, x, y, w, color = COLORS.text, bold = false) => {
    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8.5)
      .fillColor(color)
      .text(String(text ?? '-'), x + 6, y + 6, { width: w - 12, height: 11, ellipsis: true });
  };

  const drawPill = (label, x, y, w) => {
    const [bg, fg] = STATUS_COLORS[label] || STATUS_COLORS.New;
    doc.font('Helvetica-Bold').fontSize(7.5);
    const textW = Math.min(doc.widthOfString(label), w - 20);
    const pillW = textW + 12;
    doc.roundedRect(x + 6, y + 4, pillW, 12, 6).fill(bg);
    doc.fillColor(fg).text(label, x + 12, y + 7.5, { width: textW + 2, height: 9, ellipsis: true });
  };

  // ---- Rows ----
  let y = 104;
  drawTableHeader(y);
  y += HEADER_H;

  leads.forEach((lead, i) => {
    if (y + ROW_H > bottomLimit) {
      doc.addPage();
      y = MARGIN;
      drawTableHeader(y);
      y += HEADER_H;
    }

    if (i % 2 === 0) doc.rect(MARGIN, y, tableW, ROW_H).fill(COLORS.zebra);
    doc.moveTo(MARGIN, y + ROW_H).lineTo(MARGIN + tableW, y + ROW_H).lineWidth(0.5).strokeColor(COLORS.line).stroke();

    const values = {
      no: i + 1,
      business: lead.businessName,
      city: [lead.cityName, lead.stateCode].filter(Boolean).join(', ') || '-',
      phone: (lead.phones || []).join(', ') || '-',
      assigned: lead.assignedTo?.name || 'Unassigned',
      last: showDate(lead.lastContactedAt),
      next: showDate(lead.nextFollowUpDate),
    };

    let x = MARGIN;
    columns.forEach((c) => {
      if (c.key === 'status') {
        drawPill(lead.status, x, y, c.w);
      } else if (c.key === 'business') {
        cellText(values.business, x, y, c.w, COLORS.text, true);
      } else if (c.key === 'assigned' && values.assigned === 'Unassigned') {
        cellText(values.assigned, x, y, c.w, COLORS.muted);
      } else if (c.key === 'no') {
        cellText(values.no, x, y, c.w, COLORS.muted);
      } else {
        cellText(values[c.key], x, y, c.w);
      }
      x += c.w;
    });

    y += ROW_H;
  });

  // ---- Footer with page numbers (added after all pages exist) ----
  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p += 1) {
    doc.switchToPage(range.start + p);
    doc.page.margins.bottom = 0; // stops the footer from creating a new page
    const fy = pageH - 26;
    doc.moveTo(MARGIN, fy - 6).lineTo(MARGIN + tableW, fy - 6).lineWidth(0.5).strokeColor(COLORS.line).stroke();
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text('Campussafar CRM  |  Confidential, for internal use only', MARGIN, fy, { lineBreak: false });
    doc.text(`Page ${p + 1} of ${range.count}`, MARGIN, fy, { width: tableW, align: 'right', lineBreak: false });
  }

  doc.end();
}

module.exports = { exportLeadsToExcel, exportLeadsToPDF };
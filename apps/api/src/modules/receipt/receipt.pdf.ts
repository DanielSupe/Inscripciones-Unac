import PDFDocument from 'pdfkit';

export interface ReceiptPdfData {
  receiptNumber: string;
  amount: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date;
  applicantName: string;
  documentType: string;
  documentNumber: string;
  programName: string;
  periodCode: string;
}

const dinero = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });

/**
 * Compone el recibo en PDF.
 *
 * Se maqueta a mano, coordenada por coordenada, porque `pdfkit` pesa poco y
 * corre en cualquier instancia. Un navegador sin cabeza daría mejor maquetación
 * a partir de HTML, pero pesa cientos de megas y no cabe en el plan donde va a
 * correr esto.
 *
 * El PDF se genera al vuelo en cada descarga y no se guarda: sus datos ya están
 * en la base de datos, así que archivarlo sería una copia más que mantener
 * sincronizada a cambio de unos milisegundos.
 */
export function renderReceiptPdf(data: ReceiptPdfData): NodeJS.ReadableStream {
  const doc = new PDFDocument({ size: 'LETTER', margin: 56 });

  const izquierda = 56;
  const derecha = 556;

  doc.fontSize(18).font('Helvetica-Bold').text('Universidad Adventista de Colombia');
  doc.fontSize(11).font('Helvetica').fillColor('#555').text('Recibo de derecho de inscripción');
  doc.fillColor('#000').moveDown(1.2);

  doc
    .moveTo(izquierda, doc.y)
    .lineTo(derecha, doc.y)
    .strokeColor('#cccccc')
    .stroke()
    .moveDown(1);

  /** Fila de etiqueta y valor, alineada en dos columnas. */
  function fila(etiqueta: string, valor: string): void {
    const y = doc.y;
    doc.fontSize(10).fillColor('#666').text(etiqueta, izquierda, y, { width: 160 });
    doc.fontSize(11).fillColor('#000').text(valor, izquierda + 170, y, { width: 330 });
    doc.moveDown(0.6);
  }

  fila('Número de recibo', data.receiptNumber);
  fila('Fecha de emisión', fecha.format(data.issuedAt));
  fila('Paga hasta', fecha.format(data.dueAt));
  doc.moveDown(0.5);

  fila('Aspirante', data.applicantName);
  fila('Documento', `${data.documentType} ${data.documentNumber}`);
  doc.moveDown(0.5);

  fila('Programa', data.programName);
  fila('Periodo académico', data.periodCode);
  fila('Concepto', 'Derecho de inscripción');

  doc.moveDown(1);
  doc.moveTo(izquierda, doc.y).lineTo(derecha, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(1);

  const yTotal = doc.y;
  doc.fontSize(12).fillColor('#666').text('Total a pagar', izquierda, yTotal);
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text(dinero.format(data.amount), izquierda + 170, yTotal - 4);

  doc.moveDown(2.5);
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#777')
    .text(
      'Presenta este recibo en el banco o en la tesorería de la universidad. ' +
        'Tu inscripción no será revisada hasta que el pago quede verificado.',
      izquierda,
      doc.y,
      { width: derecha - izquierda },
    );

  doc.end();
  return doc;
}

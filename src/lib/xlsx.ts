import ExcelJS from "exceljs";

// F-30: shared XLSX builder for the cases/runs export routes — one header
// row (bold), one sheet, plain values (exceljs infers cell type per value).

export async function buildXlsx(
  sheetName: string,
  columns: { header: string; key: string; width?: number }[],
  rows: Record<string, unknown>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

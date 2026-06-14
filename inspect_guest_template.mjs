import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "outputs/biyeflow_guest_template/BiyeFlow_Guest_Count_Stay_Template.xlsx";
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Guest Template");

const formulas = await workbook.inspect({
  kind: "table",
  range: "Guest Template!J3:L8",
  include: "values,formulas",
  tableMaxRows: 6,
  tableMaxCols: 3,
});
console.log("SUMMARY");
console.log(formulas.ndjson);

const rows = sheet.getRange("A5:H1004").values;
const formulasInRows = sheet.getRange("A5:H20").formulas;

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const colSums = {
  totalHeadCount: 0,
  receptionCount: 0,
  sangeetCount: 0,
  biyebariCount: 0,
  borjatriCount: 0,
  stayHeadCount: 0,
};
let nonEmptyRows = 0;
let rowsWithReception = 0;
let rowsWithFormulaReception = 0;
let rowsWithManualReception = 0;

for (const row of rows) {
  const hasAny = row.some((cell) => cell !== null && cell !== undefined && cell !== "");
  if (!hasAny) continue;
  nonEmptyRows += 1;
  colSums.totalHeadCount += toNumber(row[1]);
  colSums.receptionCount += toNumber(row[2]);
  colSums.sangeetCount += toNumber(row[3]);
  colSums.biyebariCount += toNumber(row[4]);
  colSums.borjatriCount += toNumber(row[5]);
  colSums.stayHeadCount += toNumber(row[7]);
  if (toNumber(row[2]) > 0) rowsWithReception += 1;
}

for (const formulaRow of formulasInRows) {
  if (formulaRow[2]) rowsWithFormulaReception += 1;
  if (!formulaRow[2]) rowsWithManualReception += 1;
}

console.log("COUNTS");
console.log(JSON.stringify({
  nonEmptyRows,
  rowsWithReception,
  colSums,
  firstRowsReceptionFormulaCount: rowsWithFormulaReception,
  firstRowsNoReceptionFormulaCount: rowsWithManualReception,
}, null, 2));

const sampleRows = rows
  .map((row, index) => ({ excelRow: index + 5, row }))
  .filter(({ row }) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""))
  .slice(0, 25);

const nonEmpty = rows
  .map((row, index) => ({ excelRow: index + 5, row }))
  .filter(({ row }) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""));

const first171Reception = nonEmpty
  .slice(0, 171)
  .reduce((sum, { row }) => sum + toNumber(row[2]), 0);
const after171 = nonEmpty.slice(171);
const after171Reception = after171.reduce((sum, { row }) => sum + toNumber(row[2]), 0);

console.log("ROW_SPLIT");
console.log(JSON.stringify({
  first171Reception,
  after171Rows: after171.length,
  after171Reception,
  after171RowsDetail: after171.map(({ excelRow, row }) => ({
    excelRow,
    guestName: row[0],
    totalHeadCount: row[1],
    receptionCount: row[2],
    sangeetCount: row[3],
    biyebariCount: row[4],
    borjatriCount: row[5],
  })),
}, null, 2));

console.log("SAMPLE_ROWS");
console.log(JSON.stringify(sampleRows, null, 2));

console.log("FIRST_FORMULAS");
console.log(JSON.stringify(formulasInRows, null, 2));

import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "C:/Users/JishnuPal/Downloads/BiyeFlow_Guest_Count_Stay_Template.xlsx";
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Guest Template");

const used = sheet.getUsedRange();
console.log("USED_RANGE");
console.log(JSON.stringify({
  address: used.address,
  rowCount: used.rowCount,
  columnCount: used.columnCount,
}, null, 2));

const headers = sheet.getRange("A4:H4").values[0];
console.log("HEADERS");
console.log(JSON.stringify(headers, null, 2));

const formulas = await workbook.inspect({
  kind: "table",
  range: "Guest Template!A4:L12",
  include: "values,formulas",
  tableMaxRows: 9,
  tableMaxCols: 12,
});
console.log("FORMULAS_AND_SUMMARY");
console.log(formulas.ndjson);

const rows = sheet.getRange("A5:H1004").values;
const dataRows = rows
  .map((row, index) => ({ rowNumber: index + 5, row }))
  .filter(({ row }) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""));

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const totals = dataRows.reduce((acc, { row }) => {
  acc.totalHead += toNumber(row[1]);
  acc.reception += toNumber(row[2]);
  acc.sangeet += toNumber(row[3]);
  acc.biyebari += toNumber(row[4]);
  acc.borjatri += toNumber(row[5]);
  acc.stayHead += toNumber(row[7]);
  if (String(row[6] || "").trim()) acc.stayStatusRows += 1;
  if (String(row[6] || "").trim().toLowerCase() === "yes") acc.stayYesRows += 1;
  return acc;
}, {
  rows: dataRows.length,
  totalHead: 0,
  reception: 0,
  sangeet: 0,
  biyebari: 0,
  borjatri: 0,
  stayHead: 0,
  stayStatusRows: 0,
  stayYesRows: 0,
});

console.log("TOTALS");
console.log(JSON.stringify(totals, null, 2));

console.log("SAMPLE");
console.log(JSON.stringify(dataRows.slice(0, 20), null, 2));

console.log("ROWS_WITH_STAY_FLAG");
console.log(JSON.stringify(
  dataRows
    .filter(({ row }) => String(row[6] || "").trim() || toNumber(row[7]) > 0)
    .slice(0, 30),
  null,
  2
));

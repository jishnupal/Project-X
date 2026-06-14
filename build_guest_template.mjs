import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "outputs/biyeflow_guest_template";
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Guest Template");

sheet.showGridLines = false;

const maxRows = 1000;
const firstDataRow = 5;
const lastDataRow = firstDataRow + maxRows - 1;

sheet.mergeCells("A1:H1");
sheet.mergeCells("A2:H2");
sheet.getRange("A1").values = [["BiyeFlow Guest Count & Stay Template"]];
sheet.getRange("A2").values = [[
  "Reception count auto-fills from Total Head Count. Enter separate counts for Sangeet, Biyebari, and Borjatri only when needed."
]];

sheet.getRange("A4:H4").values = [[
  "Guest Name",
  "Total Head Count",
  "Reception Count",
  "Sangeet Count",
  "Biyebari Count",
  "Borjatri Count",
  "Stay Needed",
  "Stay Head Count",
]];

sheet.getRange(`C${firstDataRow}`).formulas = [[
  `=IF($A${firstDataRow}="","",IF($B${firstDataRow}="","",$B${firstDataRow}))`,
]];
sheet.getRange(`C${firstDataRow}:C${lastDataRow}`).fillDown();

sheet.getRange(`H${firstDataRow}`).formulas = [[
  `=IF($A${firstDataRow}="","",IF($G${firstDataRow}="Yes",$B${firstDataRow},IF($G${firstDataRow}="No",0,"")))`,
]];
sheet.getRange(`H${firstDataRow}:H${lastDataRow}`).fillDown();

sheet.getRange(`B${firstDataRow}:F${lastDataRow}`).dataValidation = {
  rule: { type: "whole", operator: "between", formula1: 0, formula2: 99 },
};
sheet.getRange(`H${firstDataRow}:H${lastDataRow}`).dataValidation = {
  rule: { type: "whole", operator: "between", formula1: 0, formula2: 99 },
};
sheet.getRange(`G${firstDataRow}:G${lastDataRow}`).dataValidation = {
  rule: { type: "list", values: ["Yes", "No"] },
};

sheet.mergeCells("J1:L1");
sheet.getRange("J1").values = [["Automatic Summary"]];
sheet.getRange("J3:L11").values = [
  ["Metric", "Families", "Head Count"],
  ["Reception", null, null],
  ["Sangeet", null, null],
  ["Biyebari", null, null],
  ["Borjatri", null, null],
  ["Stay needed", null, null],
  ["", "", ""],
  ["Formula rule", "", ""],
  ["Count > 0 means invited for that event", "", ""],
];

sheet.getRange("K4:L8").formulas = [
  [`=COUNTIF($C$${firstDataRow}:$C$${lastDataRow},">0")`, `=SUM($C$${firstDataRow}:$C$${lastDataRow})`],
  [`=COUNTIF($D$${firstDataRow}:$D$${lastDataRow},">0")`, `=SUM($D$${firstDataRow}:$D$${lastDataRow})`],
  [`=COUNTIF($E$${firstDataRow}:$E$${lastDataRow},">0")`, `=SUM($E$${firstDataRow}:$E$${lastDataRow})`],
  [`=COUNTIF($F$${firstDataRow}:$F$${lastDataRow},">0")`, `=SUM($F$${firstDataRow}:$F$${lastDataRow})`],
  [`=COUNTIF($H$${firstDataRow}:$H$${lastDataRow},">0")`, `=SUM($H$${firstDataRow}:$H$${lastDataRow})`],
];

sheet.getRange("A1:H1").format = {
  fill: "#6D2932",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange("A2:H2").format = {
  fill: "#F7EFE8",
  font: { color: "#4E342E", italic: true },
  horizontalAlignment: "center",
};
sheet.getRange("A4:H4").format = {
  fill: "#8C4A54",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange(`A${firstDataRow}:H${lastDataRow}`).format = {
  fill: "#FFFDF9",
  font: { color: "#2C2320" },
};
sheet.getRange(`B${firstDataRow}:F${lastDataRow}`).format.numberFormat = "0";
sheet.getRange(`H${firstDataRow}:H${lastDataRow}`).format.numberFormat = "0";
sheet.getRange(`B${firstDataRow}:H${lastDataRow}`).format.horizontalAlignment = "center";

sheet.getRange("J1:L1").format = {
  fill: "#1F4E45",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
};
sheet.getRange("J3:L3").format = {
  fill: "#DDECE7",
  font: { bold: true, color: "#183B34" },
  horizontalAlignment: "center",
};
sheet.getRange("J4:L8").format = {
  fill: "#F4FAF7",
  font: { color: "#183B34" },
};
sheet.getRange("K4:L8").format.numberFormat = "0";
sheet.getRange("K4:L8").format.horizontalAlignment = "center";
sheet.getRange("J10:L11").format = {
  fill: "#FBF6EF",
  font: { color: "#5A3E35" },
};
sheet.getRange("J10").format.font = { bold: true, color: "#5A3E35" };

sheet.getRange("A:A").format.columnWidthPx = 220;
sheet.getRange("B:B").format.columnWidthPx = 115;
sheet.getRange("C:C").format.columnWidthPx = 120;
sheet.getRange("D:D").format.columnWidthPx = 110;
sheet.getRange("E:E").format.columnWidthPx = 115;
sheet.getRange("F:F").format.columnWidthPx = 115;
sheet.getRange("G:G").format.columnWidthPx = 100;
sheet.getRange("H:H").format.columnWidthPx = 120;
sheet.getRange("I:I").format.columnWidthPx = 18;
sheet.getRange("J:J").format.columnWidthPx = 170;
sheet.getRange("K:L").format.columnWidthPx = 95;
sheet.getRange("A2:H2").format.wrapText = true;
sheet.getRange("J10:L11").format.wrapText = true;

sheet.freezePanes.freezeRows(4);

const helper = workbook.worksheets.add("Import Notes");
helper.showGridLines = false;
helper.mergeCells("A1:D1");
helper.getRange("A1").values = [["How BiyeFlow reads this template"]];
helper.getRange("A3:D11").values = [
  ["Column", "Required", "Accepted values", "Meaning"],
  ["Guest Name", "Yes", "Text", "Guest/family name shown in BiyeFlow."],
  ["Total Head Count", "Yes", "Whole number", "Total people in this guest/family."],
  ["Reception Count", "Yes", "Whole number", "Auto-fills from Total Head Count. Set 0 only if not invited."],
  ["Sangeet Count", "No", "Whole number", "Number of people invited for Sangeet. Blank/0 means not invited."],
  ["Biyebari Count", "No", "Whole number", "Number of people invited for Biyebari. Blank/0 means not invited."],
  ["Borjatri Count", "No", "Whole number", "Number of people invited for Borjatri. Blank/0 means not invited."],
  ["Stay Needed", "No", "Yes / No", "Choose Yes when accommodation is needed."],
  ["Stay Head Count", "No", "Whole number", "Auto-fills from Total Head Count when Stay Needed is Yes; edit if only some people stay."],
];
helper.getRange("A13:D14").values = [
  ["Example", "Guest X", "3 total", "Reception 3, Biyebari 1, Borjatri 1"],
  ["Entry", "Guest X", "3", "Reception Count=3 | Biyebari Count=1 | Borjatri Count=1"],
];
helper.getRange("A1:D1").format = {
  fill: "#6D2932",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
};
helper.getRange("A3:D3").format = {
  fill: "#8C4A54",
  font: { bold: true, color: "#FFFFFF" },
};
helper.getRange("A4:D11").format = {
  fill: "#FFFDF9",
};
helper.getRange("A13:D14").format = {
  fill: "#FBF6EF",
  font: { color: "#5A3E35" },
};
helper.getRange("A:A").format.columnWidthPx = 145;
helper.getRange("B:B").format.columnWidthPx = 115;
helper.getRange("C:C").format.columnWidthPx = 150;
helper.getRange("D:D").format.columnWidthPx = 430;
helper.getRange("D4:D14").format.wrapText = true;
helper.freezePanes.freezeRows(3);

await fs.mkdir(outputDir, { recursive: true });

const preview = await workbook.render({
  sheetName: "Guest Template",
  range: "A1:L18",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/guest_template_preview.png`, new Uint8Array(await preview.arrayBuffer()));

const summaryInspect = await workbook.inspect({
  kind: "table",
  range: "Guest Template!A1:L12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 12,
});
console.log(summaryInspect.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/BiyeFlow_Guest_Count_Stay_Template.xlsx`);
console.log(`${outputDir}/BiyeFlow_Guest_Count_Stay_Template.xlsx`);

function doGet(e) {
  const sheetName = e.parameter.sheet || "Members";
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Sheet not found" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(
      ContentService.MimeType.JSON
    );
  }

  const headers = values[0];
  const rows = values.slice(1);

  const result = rows.map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  const sheetName = payload.sheet || "Members";
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: "Sheet not found" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  const row = headers.map((header) => payload[header] ?? "");
  sheet.appendRow(row);

  return ContentService.createTextOutput(
    JSON.stringify({ success: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doDelete(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ message: "Delete is not implemented in this demo" })
  ).setMimeType(ContentService.MimeType.JSON);
}

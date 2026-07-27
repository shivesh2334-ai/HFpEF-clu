/**
 * HFpEF Research Portal — Apps Script Webhook
 * ---------------------------------------------
 * Deploy this bound to (or given access to) the research spreadsheet created by
 * the portal's "Direct Google Sheets API" flow, or to a spreadsheet you create
 * yourself with a header row in row 1 and a "RecordID" value in column A.
 *
 * Deployment:
 *   1. In the target Google Sheet: Extensions → Apps Script.
 *   2. Delete any placeholder code and paste this file's contents.
 *   3. Deploy → New deployment → type "Web app".
 *        Execute as:    Me
 *        Who has access: Anyone
 *   4. Copy the deployment URL (ends in /exec) into the Research Portal's
 *      "Apps Script Webhook URL" field and select "Apps Script Webhook" as the
 *      sync mode.
 *
 * This script performs its own duplicate check (column A = RecordID) inside a
 * script lock, so it is the more race-condition-safe of the two sync paths
 * when multiple clinicians may submit at once.
 */

const SHEET_NAME = "Records";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const payload = JSON.parse(e.postData.contents);
    const spreadsheetId = payload.spreadsheetId;
    const recordId = String(payload.recordId || "");
    const row = payload.row || [];
    const sheetName = payload.sheetName || SHEET_NAME;

    if (!recordId) {
      return jsonResponse({ status: "error", message: "Missing recordId" });
    }

    const ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (payload.headers) sheet.appendRow(payload.headers);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow >= 1) {
      const existingIds = sheet.getRange(1, 1, lastRow, 1).getValues().flat().map(String);
      if (existingIds.includes(recordId)) {
        return jsonResponse({ status: "duplicate", recordId: recordId });
      }
    }

    sheet.appendRow(row);
    return jsonResponse({ status: "inserted", recordId: recordId });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return jsonResponse({ status: "ok", message: "HFpEF Research Portal webhook is live." });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

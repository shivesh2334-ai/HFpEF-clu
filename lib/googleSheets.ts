// Thin wrapper around the Google Sheets v4 REST API, called directly from the
// browser using the OAuth access token obtained via Firebase/Google sign-in.
// No server round-trip needed — the clinician's own token authorizes the calls.

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_BASE = "https://www.googleapis.com/drive/v3/files";
const DATA_SHEET = "Records";

async function api(url: string, accessToken: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Sheets API error (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

export type ProvisionResult = {
  spreadsheetId: string;
  spreadsheetUrl: string;
};

/** Creates a new spreadsheet titled after the study, with a formatted header row. */
export async function provisionResearchSheet(
  accessToken: string,
  studyName: string,
  headers: string[]
): Promise<ProvisionResult> {
  const created = await api(SHEETS_BASE, accessToken, {
    method: "POST",
    body: JSON.stringify({
      properties: { title: `${studyName} — HFpEF Research Data` },
      sheets: [{ properties: { title: DATA_SHEET } }],
    }),
  });

  const spreadsheetId: string = created.spreadsheetId;

  // Write header row.
  await api(
    `${SHEETS_BASE}/${spreadsheetId}/values/${DATA_SHEET}!A1:append?valueInputOption=RAW`,
    accessToken,
    { method: "POST", body: JSON.stringify({ values: [headers] }) }
  );

  // Bold header row + freeze it.
  const sheetId = created.sheets?.[0]?.properties?.sheetId ?? 0;
  await api(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.89, green: 0.95, blue: 0.94 } } },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        },
        { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: "gridProperties.frozenRowCount" } },
      ],
    }),
  });

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/** Reads column A (Record ID) to know which records are already present. */
export async function fetchExistingRecordIds(accessToken: string, spreadsheetId: string): Promise<Set<string>> {
  const data = await api(`${SHEETS_BASE}/${spreadsheetId}/values/${DATA_SHEET}!A2:A`, accessToken);
  const values: string[][] = data.values || [];
  return new Set(values.map((row) => row[0]).filter(Boolean));
}

/**
 * Appends one row, but only after confirming the Record ID isn't already present —
 * this is the client-side half of the duplicate-prevention logic. The Apps Script
 * webhook path (see /appsscript/Code.gs) performs the equivalent check server-side.
 */
export async function appendRecordIfNew(
  accessToken: string,
  spreadsheetId: string,
  recordId: string,
  row: (string | number | boolean)[]
): Promise<"inserted" | "duplicate"> {
  const existing = await fetchExistingRecordIds(accessToken, spreadsheetId);
  if (existing.has(recordId)) return "duplicate";

  await api(
    `${SHEETS_BASE}/${spreadsheetId}/values/${DATA_SHEET}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    { method: "POST", body: JSON.stringify({ values: [row] }) }
  );
  return "inserted";
}

export async function getSpreadsheetMeta(accessToken: string, spreadsheetId: string) {
  return api(`${DRIVE_BASE}/${spreadsheetId}?fields=id,name,webViewLink,owners`, accessToken);
}

export { DATA_SHEET };

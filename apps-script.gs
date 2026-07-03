/**
 * Founder Era — Google Sheet backend
 *
 * Appends one row per signup:
 *   Timestamp | Name | Date of birth | City | Journey stage | LinkedIn | Email | WhatsApp | Submissions | Last updated
 *
 * Duplicate handling: if the same email submits again, the existing row is
 * updated in place (latest answers win), its "Submissions" count goes up,
 * and "Last updated" is refreshed — no endless duplicate rows.
 *
 * Setup steps are in README.md.
 */

const SHEET_NAME = 'Signups';

const HEADERS = [
  'Timestamp', 'Name', 'Date of birth', 'City', 'Journey stage',
  'LinkedIn', 'Email', 'WhatsApp', 'Submissions', 'Last updated',
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // serialize concurrent submissions

  try {
    const data = JSON.parse(e.postData.contents);

    // minimal server-side sanity check
    const required = ['name', 'dob', 'city', 'journey', 'linkedin', 'email', 'whatsapp'];
    for (let i = 0; i < required.length; i++) {
      if (!data[required[i]] || String(data[required[i]]).trim() === '') {
        return respond({ ok: false, error: 'missing field: ' + required[i] });
      }
    }

    const sheet = getSheet();
    const email = String(data.email).trim().toLowerCase();
    const now = new Date();

    // duplicate check — email lives in column G (7)
    const lastRow = sheet.getLastRow();
    let existingRow = 0;
    if (lastRow > 1) {
      const emails = sheet.getRange(2, 7, lastRow - 1, 1).getValues();
      for (let r = 0; r < emails.length; r++) {
        if (String(emails[r][0]).trim().toLowerCase() === email) {
          existingRow = r + 2;
          break;
        }
      }
    }

    if (existingRow) {
      const count = Number(sheet.getRange(existingRow, 9).getValue()) || 1;
      sheet.getRange(existingRow, 2, 1, 7).setValues([[
        data.name, data.dob, data.city, data.journey, data.linkedin, email, data.whatsapp,
      ]]);
      sheet.getRange(existingRow, 9, 1, 2).setValues([[count + 1, now]]);
      return respond({ ok: true, duplicate: true });
    }

    sheet.appendRow([
      now, data.name, data.dob, data.city, data.journey,
      data.linkedin, email, data.whatsapp, 1, now,
    ]);
    return respond({ ok: true });

  } catch (err) {
    return respond({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you sanity-check the deployment by opening the Web App URL in a browser.
function doGet() {
  return respond({ ok: true, service: 'founder-era' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

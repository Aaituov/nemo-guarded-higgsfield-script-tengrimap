/**
 * Google Apps Script: NeMo Guarded Higgsfield Video Studio
 * Connects Google Sheets to the local/cloud NeMo + Higgsfield Gateway.
 */

const CONFIG = {
  // Update this URL with your localtunnel, Cloudflare Tunnel, or cloud endpoint
  GATEWAY_ENDPOINT: "https://your-tunnel.loca.lt/create-video",
  SHEET_NAME: "Video_Campaigns"
};

/**
 * Adds a custom menu when opening the Google Sheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎬 Video Studio")
    .addItem("Generate Video Campaign", "processVideoCampaigns")
    .addToUi();
}

/**
 * Reads pending campaigns, posts to the NeMo gateway, and writes back safety checks and video URLs.
 */
function processVideoCampaigns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert(`Sheet '${CONFIG.SHEET_NAME}' not found! Import the template CSV first.`);
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return; // Header row only

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    ss.toast("Another batch generation is currently running.", "Busy");
    return;
  }

  try {
    let processedCount = 0;

    for (let i = 1; i < data.length; i++) {
      const campaignId = data[i][0];
      const productName = data[i][1];
      const concept = data[i][2];
      const currentStatus = data[i][3];

      // Skip already processed rows or blank concepts
      if (currentStatus !== "" || !concept) continue;

      const payload = {
        product_name: String(productName),
        concept: String(concept)
      };

      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(CONFIG.GATEWAY_ENDPOINT, options);
      const statusCode = response.getResponseCode();
      const rowIndex = i + 1;

      if (statusCode !== 200) {
        sheet.getRange(rowIndex, 4).setValue("⚠️ HTTP_ERROR");
        sheet.getRange(rowIndex, 5).setValue(`Error: ${response.getContentText()}`);
        continue;
      }

      const result = JSON.parse(response.getContentText());

      if (result.status === "REJECTED") {
        sheet.getRange(rowIndex, 4).setValue("❌ REJECTED");
        sheet.getRange(rowIndex, 5).setValue(result.reason);
        sheet.getRange(rowIndex, 6).setValue("—");
      } else {
        sheet.getRange(rowIndex, 4).setValue("✅ APPROVED");
        sheet.getRange(rowIndex, 5).setValue(result.cinematic_prompt);

        if (result.video_url) {
          const formula = `=HYPERLINK("${result.video_url}", "▶️ Watch Video")`;
          sheet.getRange(rowIndex, 6).setFormula(formula);
        }
      }

      processedCount++;
      SpreadsheetApp.flush();
    }

    ss.toast(`Batch complete. Processed ${processedCount} campaigns.`, "Success");
  } catch (error) {
    console.error("Video Studio error: " + error.toString());
    SpreadsheetApp.getUi().alert("Processing error: " + error.message);
  } finally {
    lock.releaseLock();
  }
}

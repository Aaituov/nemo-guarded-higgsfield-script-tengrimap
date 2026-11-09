/**
 * Google Apps Script: NeMo Guarded Higgsfield Video Studio
 * Connects Google Sheets to the local/cloud NeMo + Higgsfield Gateway.
 */

const CONFIG = {
  // Your tunnel URL
  GATEWAY_ENDPOINT: "https://your-tunnel.loca.lt/create-video",
  SHEET_NAME: "Video_Campaigns"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎬 Video Studio")
    .addItem("Generate Video Campaign", "processVideoCampaigns")
    .addSeparator()
    .addItem("▶️ Play Selected Video in Sheet", "openVideoSidebar")
    .addToUi();
}

function processVideoCampaigns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const productName = data[i][1];
    const concept = data[i][2];
    const currentStatus = data[i][3];
    if (currentStatus !== "" || !concept) continue;

    const options = {
      method: "post",
      contentType: "application/json",
      headers: { "Bypass-Tunnel-Reminder": "true" },
      payload: JSON.stringify({ product_name: String(productName), concept: String(concept) }),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(CONFIG.GATEWAY_ENDPOINT, options);
    const result = JSON.parse(response.getContentText());
    const rowIndex = i + 1;

    if (result.status === "REJECTED") {
      sheet.getRange(rowIndex, 4).setValue("❌ REJECTED");
      sheet.getRange(rowIndex, 5).setValue(result.reason);
      sheet.getRange(rowIndex, 6).setValue("—");
    } else {
      sheet.getRange(rowIndex, 4).setValue("✅ APPROVED");
      sheet.getRange(rowIndex, 5).setValue(result.cinematic_prompt);
      sheet.getRange(rowIndex, 6).setFormula(`=HYPERLINK("${result.video_url}", "▶️ Watch Video")`);
    }
    SpreadsheetApp.flush();
  }
}

/**
 * Plays the video of the currently selected row inside Google Sheets!
 */
function openVideoSidebar() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert("Please click on an approved campaign row first!");
    return;
  }

  const formula = sheet.getRange(row, 6).getFormula();
  const match = formula.match(/HYPERLINK\("([^"]+)"/i);
  const videoUrl = match ? match[1] : sheet.getRange(row, 6).getValue();

  if (!videoUrl || videoUrl === "—") {
    SpreadsheetApp.getUi().alert("No video found for this row. Make sure it was approved.");
    return;
  }

  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: sans-serif; text-align: center; padding: 10px; background: #0f172a; color: white; border-radius: 8px;">
      <h3 style="color: #38bdf8; margin-top: 5px;">🎬 Campaign Preview</h3>
      <video width="100%" height="auto" controls autoplay loop playsinline style="border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
        <source src="${videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">Rendered with NeMo Guardrails + Higgsfield</p>
    </div>
  `).setTitle("Video Player").setWidth(340);

  SpreadsheetApp.getUi().showSidebar(html);
}

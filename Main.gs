/**
 * Main.gs
 * メイン処理とWebアプリエントリーポイント
 */

/***** Webアプリエントリーポイント *****/
function doGet(e) {
  const mode = e.parameter.mode;

  if (mode === 'data') {
    return ContentService
      .createTextOutput(JSON.stringify(getMapDataWithDuplicates()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (mode === 'stats') {
    return ContentService
      .createTextOutput(JSON.stringify(getMonthlyStats()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (mode === 'newcases') {
    return ContentService
      .createTextOutput(JSON.stringify(getNewCases()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (mode === 'insights') {
    return ContentService
      .createTextOutput(JSON.stringify(getIntelligenceInsights()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutputFromFile('MapApp')
    .setTitle('営業先マップ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/***** フォーム送信トリガー *****/
function onFormSubmit(e) {
  const sheet = getTargetSheet();
  const row = e.range.getRow();
  enrichRow(sheet, row);
  Logger.log(`フォーム送信処理完了: 行${row}`);
}

/***** セル編集トリガー *****/
function onEditInstallable(e) {
  try {
    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== CONFIG.SHEET_NAME) return;

    const row = e.range.getRow();
    const col = e.range.getColumn();

    if (row === 1) return;

    // 会社名が編集された場合
    if (col === CONFIG.COLUMNS.COMPANY) {
      const company = getCellValue(sheet, row, CONFIG.COLUMNS.COMPANY);
      if (company && company !== '会社名') {
        enrichRow(sheet, row);
      }
    }

    // 住所が編集された場合
    if (col === CONFIG.COLUMNS.ADDRESS) {
      const address = getCellValue(sheet, row, CONFIG.COLUMNS.ADDRESS);
      if (address && address !== '住所' && address !== '住所取得失敗') {
        updateCoordinatesFromAddress(sheet, row, address);
      }
    }
  } catch (err) {
    Logger.log(`onEditInstallable error: ${err}`);
  }
}

/***** メイン処理 *****/
function enrichSelection() {
  const sheet = getTargetSheet();
  const range = sheet.getActiveRange();
  const startRow = range.getRow();
  const endRow = startRow + range.getNumRows() - 1;
  processRows(sheet, startRow, endRow);
}

function enrichAll() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  processRows(sheet, 2, lastRow);
}

function processRows(sheet, startRow, endRow) {
  for (let row = startRow; row <= endRow; row++) {
    if (row === 1) continue;
    enrichRow(sheet, row);
    Utilities.sleep(CONFIG.SLEEP_MS);
  }
}

function enrichRow(sheet, row) {
  try {
    const rowData = getRowData(sheet, row);
    if (!rowData.company) return;

    const query = buildSearchQuery(rowData.company);
    let coordinates = null;
    let addressWasSet = false;

    // 住所取得
    if (!rowData.hasAddress) {
      const result = geocodeAddressWithCoords(query);
      if (result.address) {
        let finalAddress = result.address;

        // 英語住所の場合は日本語に変換
        if (!isJapaneseAddress(result.address)) {
          const japaneseResult = convertEnglishToJapaneseAddress(result.address);
          if (japaneseResult.address) {
            finalAddress = japaneseResult.address;
            if (japaneseResult.coordinates) {
              coordinates = japaneseResult.coordinates;
            }
          }
        } else {
          coordinates = result.coordinates;
        }

        updateCell(sheet, row, CONFIG.COLUMNS.ADDRESS, finalAddress);
        addressWasSet = true;
      } else {
        updateCell(sheet, row, CONFIG.COLUMNS.ADDRESS, '住所取得失敗');
      }
    }

    // 座標取得
    if (!rowData.hasCoordinates) {
      if (!coordinates && rowData.hasAddress) {
        coordinates = getCoordinatesFromAddress(rowData.address);
      }
      if (coordinates) {
        updateCell(sheet, row, CONFIG.COLUMNS.LAT, coordinates.lat);
        updateCell(sheet, row, CONFIG.COLUMNS.LNG, coordinates.lng);
      }
    }

    // Webサイト検索URL
    if (!rowData.hasWebsite) {
      updateCell(sheet, row, CONFIG.COLUMNS.WEBSITE, buildGoogleSearchUrl(rowData.company));
    }

    // 住所が設定された場合は会社名をクリーンアップ
    if (addressWasSet) {
      Utilities.sleep(100);
      cleanCompanyName(sheet, row);
    }
  } catch (err) {
    Logger.log(`enrichRow error (row ${row}): ${err}`);
  }
}

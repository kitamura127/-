/**
 * メインエントリーポイント
 * Webアプリケーションとフォーム送信のエントリーポイント
 */

/**
 * Webアプリケーションのエントリーポイント
 * @param {Object} e - リクエストパラメータ
 * @return {HtmlOutput|TextOutput} レスポンス
 */
function doGet(e) {
  const mode = e.parameter.mode;

  // データモード: マップ表示用のデータを返す
  if (mode === 'data') {
    return ContentService
      .createTextOutput(JSON.stringify(getMapData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 統計モード: 月次統計を返す
  if (mode === 'stats') {
    return ContentService
      .createTextOutput(JSON.stringify(getMonthlyStats()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 新着案件モード: 建通新聞の新着案件を返す
  if (mode === 'newcases') {
    return ContentService
      .createTextOutput(JSON.stringify(getNewCases()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // インサイトモード: 営業インテリジェンスのインサイトを返す
  if (mode === 'insights') {
    return ContentService
      .createTextOutput(JSON.stringify(getIntelligenceInsights()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // デフォルト: マップアプリを表示
  return HtmlService.createHtmlOutputFromFile('MapApp')
    .setTitle('営業先マップ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * フォーム送信時のトリガー
 * @param {Object} e - イベントオブジェクト
 */
function onFormSubmit(e) {
  const sheet = getTargetSheet();
  const row = e.range.getRow();
  enrichRow(sheet, row);
  Logger.log(`フォーム送信処理完了: 行${row}`);
}

/**
 * セル編集時のトリガー（インストール可能なトリガー用）
 * @param {Object} e - イベントオブジェクト
 */
function onEditInstallable(e) {
  try {
    const sheet = e.source.getActiveSheet();

    // 対象シートでない場合は終了
    if (sheet.getName() !== CONFIG.SHEET_NAME) return;

    const row = e.range.getRow();
    const col = e.range.getColumn();

    // ヘッダー行の場合は終了
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

/**
 * ユーティリティ関数
 * アプリケーション全体で使用する共通関数
 */

/**
 * シートのセル値を取得（文字列としてトリム）
 * @param {Sheet} sheet - 対象シート
 * @param {number} row - 行番号
 * @param {number} col - 列番号
 * @return {string} セルの値（トリム済み）
 */
function getCellValue(sheet, row, col) {
  return String(sheet.getRange(row, col).getValue() || '').trim();
}

/**
 * シートのセルに値を設定
 * @param {Sheet} sheet - 対象シート
 * @param {number} row - 行番号
 * @param {number} col - 列番号
 * @param {*} value - 設定する値
 */
function updateCell(sheet, row, col, value) {
  sheet.getRange(row, col).setValue(value);
}

/**
 * 会社名を正規化する
 * @param {string} name - 会社名
 * @return {string} 正規化された会社名
 */
function normalizeCompanyName(name) {
  let normalized = name
    .replace(/\s+/g, ' ')
    .replace(/　/g, ' ')
    .trim();

  // 文字列置換
  for (const [pattern, replacement] of Object.entries(COMPANY_NAME_REPLACEMENTS)) {
    normalized = normalized.replace(new RegExp(pattern, 'g'), replacement);
  }

  return normalized;
}

/**
 * 検索クエリに検索ヒントを追加
 * @param {string} query - 基本クエリ
 * @return {string} ヒント付きクエリ
 */
function addSearchHints(query) {
  const hints = [];

  if (!/日本/.test(query)) {
    hints.push('日本');
  }

  const industryPattern = new RegExp(
    COMPANY_NAME_KEYWORDS.INDUSTRIES.join('|')
  );

  if (!industryPattern.test(query)) {
    hints.push('建設');
  }

  return hints.length > 0 ? `${query} ${hints.join(' ')}` : query;
}

/**
 * 会社名から検索クエリを構築
 * @param {string} companyName - 会社名
 * @return {string} 検索クエリ
 */
function buildSearchQuery(companyName) {
  let query = normalizeCompanyName(companyName);
  query = addSearchHints(query);
  return query.trim();
}

/**
 * Google検索URLを生成
 * @param {string} companyName - 会社名
 * @return {string} 検索URL
 */
function buildGoogleSearchUrl(companyName) {
  return `https://www.google.com/search?q=${encodeURIComponent(companyName)}`;
}

/**
 * Sansan検索URLを生成
 * @param {string} companyName - 会社名
 * @return {string} 検索URL
 */
function buildSansanSearchUrl(companyName) {
  const normalized = normalizeCompanyName(companyName);
  return `https://ap.sansan.com/v/search?q=${encodeURIComponent(normalized)}`;
}

/**
 * 住所が日本語かどうかを判定
 * @param {string} address - 住所
 * @return {boolean} 日本語ならtrue
 */
function isJapaneseAddress(address) {
  return /[ぁ-んァ-ヶ一-龯々]/.test(address);
}

/**
 * 日本語住所をクリーンアップ（国名・郵便番号を削除）
 * @param {string} address - 住所
 * @return {string} クリーンアップされた住所
 */
function cleanJapaneseAddress(address) {
  if (!address) return '';

  let cleanedAddress = address.replace(/^日本、\s*/, '');
  cleanedAddress = cleanedAddress.replace(/〒\d{3}-\d{4}\s*/, '');

  return cleanedAddress.trim();
}

/**
 * 会社名から不要な情報を削除
 * @param {string} companyName - 会社名
 * @param {string} address - 住所（参照用）
 * @return {string} クリーンアップされた会社名
 */
function removeUnnecessaryInfo(companyName, address) {
  let cleaned = companyName;

  // すべてのキーワードを結合
  const allKeywords = [
    ...COMPANY_NAME_KEYWORDS.LOCATIONS,
    ...COMPANY_NAME_KEYWORDS.INDUSTRIES,
    ...COMPANY_NAME_KEYWORDS.OTHERS
  ];

  // キーワードを削除
  allKeywords.forEach(keyword => {
    cleaned = cleaned.replace(new RegExp(`\\s+${keyword}\\s+`, 'g'), ' ');
    cleaned = cleaned.replace(new RegExp(`\\s+${keyword}$`, 'g'), '');
    cleaned = cleaned.replace(new RegExp(`^${keyword}\\s+`, 'g'), '');
  });

  // 連続するスペースを1つにまとめる
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 空文字列になった場合は元の会社名を返す
  return cleaned === '' ? companyName : cleaned;
}

/**
 * JSON文字列を安全にパースする
 * @param {string} jsonString - JSON文字列
 * @param {*} defaultValue - パース失敗時のデフォルト値
 * @return {*} パースされたオブジェクトまたはデフォルト値
 */
function safeJsonParse(jsonString, defaultValue = null) {
  if (!jsonString) return defaultValue;

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    Logger.log(`JSON parse error: ${e.message}`);
    return defaultValue;
  }
}

/**
 * スリープ処理（API制限対策）
 * @param {number} milliseconds - ミリ秒（省略時はCONFIG.SLEEP_MS）
 */
function sleep(milliseconds = CONFIG.SLEEP_MS) {
  Utilities.sleep(milliseconds);
}

/**
 * エラーメッセージを整形
 * @param {Error} error - エラーオブジェクト
 * @return {string} 整形されたエラーメッセージ
 */
function formatErrorMessage(error) {
  if (error.toString().includes('DNS') || error.toString().includes('connection')) {
    return 'ネットワークエラー: インターネット接続を確認してください';
  }
  return error.message || error.toString();
}

/**
 * トリガー関数名でトリガーを削除
 * @param {string} functionName - 削除するトリガーの関数名
 * @return {number} 削除されたトリガー数
 */
function deleteTriggersByFunction(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  return removed;
}

/**
 * スプレッドシートのアクティブシートを取得
 * @return {Sheet} アクティブシート
 */
function getTargetSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
}

/**
 * 現在のスプレッドシートURLを取得
 * @return {string} スプレッドシートURL
 */
function getSpreadsheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}

/**
 * WebアプリのURLを取得
 * @return {string} WebアプリURL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

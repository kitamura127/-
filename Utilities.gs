/**
 * Utilities.gs
 * 共通ヘルパー関数
 */

/***** スプレッドシート操作 *****/
function getTargetSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
}

function getCellValue(sheet, row, col) {
  return String(sheet.getRange(row, col).getValue() || '').trim();
}

function updateCell(sheet, row, col, value) {
  sheet.getRange(row, col).setValue(value);
}

function getRowData(sheet, row) {
  const company = getCellValue(sheet, row, CONFIG.COLUMNS.COMPANY);
  const address = getCellValue(sheet, row, CONFIG.COLUMNS.ADDRESS);
  const website = getCellValue(sheet, row, CONFIG.COLUMNS.WEBSITE);
  const lat = getCellValue(sheet, row, CONFIG.COLUMNS.LAT);
  const lng = getCellValue(sheet, row, CONFIG.COLUMNS.LNG);
  const sansanUrl = getCellValue(sheet, row, CONFIG.COLUMNS.SANSAN_URL);

  return {
    company: company,
    address: address,
    hasAddress: address !== '',
    hasWebsite: website !== '',
    hasCoordinates: lat !== '' && lng !== '',
    hasSansanUrl: sansanUrl !== ''
  };
}

/***** 会社名処理 *****/
function normalizeCompanyName(name) {
  let normalized = name
    .replace(/\s+/g, ' ')
    .replace(/　/g, ' ');

  for (const [pattern, replacement] of Object.entries(COMPANY_PATTERNS.REPLACEMENTS)) {
    normalized = normalized.replace(new RegExp(pattern, 'g'), replacement);
  }

  return normalized;
}

function normalizeCompanyNameForDuplicate(companyName) {
  if (!companyName) return '';

  return companyName
    .replace(COMPANY_PATTERNS.LEGAL_FORMS, '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .trim();
}

function removeUnnecessaryInfo(companyName, address) {
  let cleaned = companyName;

  const allKeywords = [
    ...COMPANY_PATTERNS.LOCATION_KEYWORDS,
    ...COMPANY_PATTERNS.INDUSTRY_KEYWORDS,
    '日本', '株式会社', '有限会社', '㈱', '㈲'
  ];

  allKeywords.forEach(keyword => {
    cleaned = cleaned.replace(new RegExp(`\\s+${keyword}\\s+`, 'g'), ' ');
    cleaned = cleaned.replace(new RegExp(`\\s+${keyword}$`, 'g'), '');
    cleaned = cleaned.replace(new RegExp(`^${keyword}\\s+`, 'g'), '');
  });

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned === '' ? companyName : cleaned;
}

/***** 検索クエリ構築 *****/
function buildSearchQuery(companyName) {
  let query = normalizeCompanyName(companyName);
  query = addSearchHints(query);
  return query.trim();
}

function addSearchHints(query) {
  const hints = [];

  if (!/日本/.test(query)) {
    hints.push('日本');
  }

  const industryPattern = /(建設|工務|土木|解体|鉄筋|とび|型枠|配管|内装|足場)/;
  if (!industryPattern.test(query)) {
    hints.push('建設');
  }

  return hints.length > 0 ? `${query} ${hints.join(' ')}` : query;
}

/***** URL構築 *****/
function buildGoogleSearchUrl(companyName) {
  return `https://www.google.com/search?q=${encodeURIComponent(companyName)}`;
}

function buildSansanSearchUrl(companyName) {
  const normalized = normalizeCompanyName(companyName);
  return `https://ap.sansan.com/v/search?q=${encodeURIComponent(normalized)}`;
}

/***** 住所処理 *****/
function isJapaneseAddress(address) {
  return /[ぁ-んァ-ヶ一-龯々]/.test(address);
}

function cleanJapaneseAddress(address) {
  if (!address) return '';

  let cleanedAddress = address.replace(/^日本、\s*/, '');
  cleanedAddress = cleanedAddress.replace(/〒\d{3}-\d{4}\s*/, '');

  return cleanedAddress.trim();
}

/***** UI ヘルパー *****/
function showToast(message, title = '通知', timeoutSeconds = 5) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, title, timeoutSeconds);
  } catch (e) {
    Logger.log(`Toast: ${title} - ${message}`);
  }
}

function showAlert(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    Logger.log(`Alert: ${message}`);
  }
}

/***** プロパティストレージ *****/
function getProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function setProperty(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function deleteProperty(key) {
  PropertiesService.getScriptProperties().deleteProperty(key);
}

/***** JSON処理 *****/
function parseJsonSafe(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    Logger.log(`JSON parse error: ${e.message}`);
    return defaultValue;
  }
}

/***** トリガー管理 *****/
function removeTriggersByFunction(functionName) {
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

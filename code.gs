/***** 設定 *****/
const CONFIG = {
  SHEET_NAME: 'フォームの回答 1',
  SALESMAN_CONFIG_SHEET: '営業マン一覧',
  TEIKOKU_FOLDER_ID: '1_i2kVMGlz5JqOavSZTkWYBWBpyhJVrQD',
  COLUMNS: {
    COMPANY: 2,
    ADDRESS: 3,
    MEMO: 4,
    KUBUN: 5,
    WEBSITE: 6,
    LAT: 7,
    LNG: 8,
    VISIT_HISTORY: 9,
    SANSAN_URL: 10
  },
  SLEEP_MS: 200,
  GOOGLE_MAPS_API_KEY: 'AIzaSyAqJN_eFQZj8B2aFpHl__2xJiKFpJvUfrE'
};

const KENTSU_CONFIG = {
  EMAIL_FROM: 'media@kentsu.co.jp',
  EMAIL_SUBJECT_KEYWORD: '情報配信サービス　建通新聞',
  MIN_PRICE: 50000000,
  STORAGE_KEY: 'kentsu_pending_cases',
  CHECK_INTERVAL_MINUTES: 10
};

const INTELLIGENCE_CONFIG = {
  STORAGE_KEY: 'intelligence_insights',
  CHECK_INTERVAL_HOURS: 12,
  DAYS_TO_ANALYZE: 7
};

/***** 帝国データバンクPDF検索機能 *****/
function findTeikokyPDF(companyName) {
  try {
    const cleanName = companyName
      .replace(/株式会社|有限会社|㈱|㈲|合同会社|合資会社|合名会社/g, '')
      .replace(/\s+/g, '')
      .trim();

    let files;
    if (CONFIG.TEIKOKU_FOLDER_ID) {
      const folder = DriveApp.getFolderById(CONFIG.TEIKOKU_FOLDER_ID);
      files = folder.searchFiles(`title contains "${cleanName}"`);
    } else {
      files = DriveApp.searchFiles(`mimeType = "application/pdf" and title contains "${cleanName}"`);
    }

    if (files.hasNext()) {
      const file = files.next();
      const fileId = file.getId();
      return {
        found: true,
        url: `https://drive.google.com/file/d/${fileId}/view`,
        fileName: file.getName(),
        fileId: fileId
      };
    }

    return { found: false };
  } catch (error) {
    Logger.log(`findTeikokyPDF error: ${error}`);
    return { found: false, error: error.message };
  }
}

/***** テスト用関数 *****/
function testDriveAccessSimple() {
  try {
    const folder = DriveApp.getFolderById(CONFIG.TEIKOKU_FOLDER_ID);
    const files = folder.getFilesByType(MimeType.PDF);
    let count = 0;

    Logger.log(`フォルダ名: ${folder.getName()}`);
    while (files.hasNext()) {
      const file = files.next();
      count++;
      Logger.log(`${count}. ${file.getName()}`);
    }

    Logger.log(`合計: ${count}件のPDFファイル`);
    return `成功: ${count}件のPDFファイルが見つかりました`;
  } catch (error) {
    Logger.log(`エラー: ${error.message}`);
    throw error;
  }
}

function testListPDFsInFolder() {
  try {
    const folder = DriveApp.getFolderById(CONFIG.TEIKOKU_FOLDER_ID);
    const files = folder.getFilesByType(MimeType.PDF);
    let count = 0;

    while (files.hasNext()) {
      files.next();
      count++;
    }

    showAlert(
      `✅ テスト完了\n\n` +
      `フォルダ名: ${folder.getName()}\n` +
      `PDFファイル数: ${count}件\n\n` +
      `詳細は「拡張機能」→「Apps Script」→「実行数」で確認してください。`
    );
  } catch (error) {
    Logger.log(`エラー: ${error}`);
    showAlert(`❌ エラー:\n${error.message}`);
    throw error;
  }
}

function testSearchPDF() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'PDF検索テスト',
    '検索する会社名を入力してください:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const companyName = response.getResponseText();
    const result = findTeikokyPDF(companyName);

    const message = result.found
      ? `✅ PDF見つかりました!\n\nファイル名: ${result.fileName}\nURL: ${result.url}`
      : `❌ PDFが見つかりませんでした\n\n会社名: ${companyName}`;

    ui.alert(message);
  }
}

function setupTeikokyFolder() {
  const ui = SpreadsheetApp.getUi();
  const currentFolderId = CONFIG.TEIKOKU_FOLDER_ID;

  const response = ui.prompt(
    '帝国データバンクフォルダ設定',
    'フォルダURLまたはフォルダIDを入力してください:\n\n' +
    (currentFolderId ? `現在の設定: ${currentFolderId}` : '※未設定の場合はGoogleドライブ全体を検索します'),
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    let input = response.getResponseText().trim();
    if (input) {
      const folderIdMatch = input.match(/folders\/([a-zA-Z0-9_-]+)/);
      const folderId = folderIdMatch ? folderIdMatch[1] : input;

      try {
        const folder = DriveApp.getFolderById(folderId);
        ui.alert(
          `✅ フォルダを設定しました!\n\nフォルダ名: ${folder.getName()}\n` +
          `※この設定を永続化するには、code.gs の CONFIG.TEIKOKU_FOLDER_ID を編集してください。`
        );
        PropertiesService.getScriptProperties().setProperty('TEIKOKU_FOLDER_ID', folderId);
      } catch (e) {
        ui.alert('❌ エラー: フォルダが見つかりません。');
      }
    }
  }
}

/***** ウェブアプリのエントリーポイント *****/
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

/***** メイン処理 *****/
function onFormSubmit(e) {
  const sheet = getTargetSheet();
  const row = e.range.getRow();
  enrichRow(sheet, row);
}

function enrichSelection() {
  processRowsInRange(false);
}

function enrichAll() {
  processRowsInRange(true);
}

function convertAddressesToJapanese() {
  processAddressConversion(false);
}

function convertAllAddressesToJapanese() {
  processAddressConversion(true);
}

function processAddressConversion(isAll) {
  const sheet = getTargetSheet();
  let startRow, endRow;

  if (isAll) {
    startRow = 2;
    endRow = sheet.getLastRow();
  } else {
    const range = sheet.getActiveRange();
    startRow = range.getRow();
    endRow = startRow + range.getNumRows() - 1;
  }

  let converted = 0, skipped = 0, failed = 0;

  for (let row = startRow; row <= endRow; row++) {
    if (row === 1) continue;
    const result = convertAddressToJapanese(sheet, row);
    if (result === 'converted') converted++;
    else if (result === 'skipped') skipped++;
    else if (result === 'failed') failed++;
    Utilities.sleep(CONFIG.SLEEP_MS);
  }

  showAlert(
    `${isAll ? '全住所' : '住所'}の日本語化が完了しました\n\n` +
    `変換成功: ${converted}件\n` +
    `スキップ(既に日本語): ${skipped}件\n` +
    `変換失敗: ${failed}件`
  );
}

function openMapApp() {
  const html = HtmlService.createHtmlOutputFromFile('MapApp')
    .setWidth(1200)
    .setHeight(800)
    .setTitle('営業先マップ');
  SpreadsheetApp.getUi().showModalDialog(html, '営業先マップ');
}

function showMapUrl() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(`
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #667eea;">📍 営業先マップURL</h2>
      <p style="margin: 15px 0;">以下のURLをブックマークすると、いつでもマップにアクセスできます:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <a href="${url}" target="_blank" style="color: #667eea; word-break: break-all;">${url}</a>
      </div>
      <button onclick="navigator.clipboard.writeText('${url}').then(() => alert('URLをコピーしました!'))"
              style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
        URLをコピー
      </button>
      <button onclick="window.open('${url}', '_blank')"
              style="background: #764ba2; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">
        マップを開く
      </button>
    </div>
  `).setWidth(600).setHeight(350);

  SpreadsheetApp.getUi().showModalDialog(html, 'マップURL取得');
}

function addMapButtonToSheet() {
  const sheet = getTargetSheet();
  const url = ScriptApp.getService().getUrl();

  const richText = SpreadsheetApp.newRichTextValue()
    .setText('🗺️ 営業先マップを開く')
    .setLinkUrl(url)
    .build();

  const cell = sheet.getRange('A1');
  cell.setRichTextValue(richText);
  cell.setBackground('#667eea');
  cell.setFontColor('#ffffff');
  cell.setFontSize(14);
  cell.setFontWeight('bold');
  cell.setHorizontalAlignment('center');
  cell.setVerticalAlignment('middle');

  showAlert(`マップボタンを追加しました!\n\nA1セルのリンクをクリックすると、営業先マップが開きます。`);
}

/***** セル編集時の自動処理 *****/
function onEditInstallable(e) {
  try {
    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== CONFIG.SHEET_NAME) return;

    const row = e.range.getRow();
    const col = e.range.getColumn();

    if (row === 1) return;

    if (col === CONFIG.COLUMNS.COMPANY) {
      const company = getCellValue(sheet, row, CONFIG.COLUMNS.COMPANY);
      if (company && company !== '会社名') {
        enrichRow(sheet, row);
      }
    }

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

function updateCoordinatesFromAddress(sheet, row, address) {
  const lat = getCellValue(sheet, row, CONFIG.COLUMNS.LAT);
  const lng = getCellValue(sheet, row, CONFIG.COLUMNS.LNG);

  if (lat && lng) return;

  const coordinates = getCoordinatesFromAddress(address);
  if (coordinates) {
    updateCell(sheet, row, CONFIG.COLUMNS.LAT, coordinates.lat);
    updateCell(sheet, row, CONFIG.COLUMNS.LNG, coordinates.lng);
  }
}

/***** トリガー管理の共通関数 *****/
function manageTrigger(functionName, setup, intervalType, intervalValue) {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  if (setup) {
    const trigger = ScriptApp.newTrigger(functionName);
    if (intervalType === 'edit') {
      trigger.forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
    } else if (intervalType === 'hours') {
      trigger.timeBased().everyHours(intervalValue).create();
    } else if (intervalType === 'minutes') {
      trigger.timeBased().everyMinutes(intervalValue).create();
    }
  }

  return triggers.filter(t => t.getHandlerFunction() === functionName).length;
}

function setupAutoAddressTrigger() {
  manageTrigger('onEditInstallable', true, 'edit');
  showAlert(
    '✅ 住所自動取得を有効化しました!\n\n' +
    '会社名(B列)を入力すると、自動的に住所が取得されます。'
  );
}

function removeAutoAddressTrigger() {
  const removed = manageTrigger('onEditInstallable', false);
  showAlert(removed > 0 ? '✅ 住所自動取得を無効化しました' : 'ℹ️ 住所自動取得は設定されていません');
}

/***** 訪問履歴関連 *****/
function addVisitRecord(row, visitDate, note) {
  const sheet = getTargetSheet();
  const visitHistoryCell = sheet.getRange(row, CONFIG.COLUMNS.VISIT_HISTORY);
  const currentHistory = visitHistoryCell.getValue();

  let history = [];
  if (currentHistory) {
    try {
      history = JSON.parse(currentHistory);
    } catch (e) {
      history = [];
    }
  }

  history.push({
    date: visitDate,
    note: note,
    timestamp: new Date().toISOString()
  });

  visitHistoryCell.setValue(JSON.stringify(history));
  return history;
}

function updateKubun(row, newKubun) {
  const sheet = getTargetSheet();
  updateCell(sheet, row, CONFIG.COLUMNS.KUBUN, newKubun);
  return newKubun;
}

/***** マップデータ取得 *****/
function getMapData() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  const data = [];

  for (let row = 2; row <= lastRow; row++) {
    const company = getCellValue(sheet, row, CONFIG.COLUMNS.COMPANY);
    const lat = getCellValue(sheet, row, CONFIG.COLUMNS.LAT);
    const lng = getCellValue(sheet, row, CONFIG.COLUMNS.LNG);

    if (company && lat && lng) {
      const visitHistoryStr = getCellValue(sheet, row, CONFIG.COLUMNS.VISIT_HISTORY);
      let visitHistory = [];
      if (visitHistoryStr) {
        try {
          visitHistory = JSON.parse(visitHistoryStr);
        } catch (e) {
          visitHistory = [];
        }
      }

      data.push({
        company: company,
        address: getCellValue(sheet, row, CONFIG.COLUMNS.ADDRESS),
        memo: getCellValue(sheet, row, CONFIG.COLUMNS.MEMO),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        website: getCellValue(sheet, row, CONFIG.COLUMNS.WEBSITE),
        kubun: getCellValue(sheet, row, CONFIG.COLUMNS.KUBUN),
        visitHistory: visitHistory,
        sansanUrl: getCellValue(sheet, row, CONFIG.COLUMNS.SANSAN_URL),
        row: row
      });
    }
  }

  return data;
}

/***** 月次統計取得 *****/
function getMonthlyStats() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let totalStrategyCount = 0;
  let visitedThisMonth = 0;
  let notVisitedCount = 0;

  for (let row = 2; row <= lastRow; row++) {
    const kubun = getCellValue(sheet, row, CONFIG.COLUMNS.KUBUN);

    if (kubun === '戦略予材') {
      totalStrategyCount++;

      const visitHistoryStr = getCellValue(sheet, row, CONFIG.COLUMNS.VISIT_HISTORY);
      let hasVisitThisMonth = false;

      if (visitHistoryStr) {
        try {
          const visitHistory = JSON.parse(visitHistoryStr);
          hasVisitThisMonth = visitHistory.some(visit => {
            const visitDate = new Date(visit.date);
            return visitDate.getFullYear() === currentYear &&
                   visitDate.getMonth() + 1 === currentMonth;
          });

          if (hasVisitThisMonth) {
            visitedThisMonth++;
          } else if (visitHistory.length === 0) {
            notVisitedCount++;
          }
        } catch (e) {
          notVisitedCount++;
        }
      } else {
        notVisitedCount++;
      }
    }
  }

  return {
    totalStrategyCount: totalStrategyCount,
    visitedThisMonth: visitedThisMonth,
    notVisitedCount: notVisitedCount,
    currentYear: currentYear,
    currentMonth: currentMonth,
    targetGoal: getMonthlyTargetGoal()
  };
}

function setMonthlyTargetGoal(goal) {
  const properties = PropertiesService.getScriptProperties();
  const now = new Date();
  const key = `target_${now.getFullYear()}_${now.getMonth() + 1}`;
  properties.setProperty(key, goal.toString());
  return goal;
}

function getMonthlyTargetGoal() {
  const properties = PropertiesService.getScriptProperties();
  const now = new Date();
  const key = `target_${now.getFullYear()}_${now.getMonth() + 1}`;
  const value = properties.getProperty(key);
  return value ? parseInt(value) : 0;
}

function getSpreadsheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}

/***** 営業マン一覧取得 *****/
function getSalesmanList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SALESMAN_CONFIG_SHEET);

  const salesmen = [{
    name: '自分',
    url: ScriptApp.getService().getUrl(),
    isSelf: true
  }];

  if (!sheet) return salesmen;

  const lastRow = sheet.getLastRow();
  for (let row = 2; row <= lastRow; row++) {
    const name = sheet.getRange(row, 1).getValue();
    const url = sheet.getRange(row, 2).getValue();

    if (name && url) {
      salesmen.push({
        name: name,
        url: url,
        isSelf: false
      });
    }
  }

  return salesmen;
}

/***** メニュー構築 *****/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('営業リスト')
    .addItem('選択範囲を補完', 'enrichSelection')
    .addItem('全行を補完(一括)', 'enrichAll')
    .addSeparator()
    .addItem('選択範囲の住所を日本語化', 'convertAddressesToJapanese')
    .addItem('全住所を日本語化', 'convertAllAddressesToJapanese')
    .addSeparator()
    .addItem('📍 マップで確認(ダイアログ)', 'openMapApp')
    .addItem('🔗 マップURLを取得', 'showMapUrl')
    .addItem('➕ シートにマップボタン追加', 'addMapButtonToSheet')
    .addSeparator()
    .addItem('🧹 会社名をクリーンアップ(選択範囲)', 'cleanCompanyNamesSelection')
    .addItem('🧹 会社名をクリーンアップ(全行)', 'cleanAllCompanyNames')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('📬 建通新聞')
      .addItem('✅ 監視開始', 'setupKentsuEmailTrigger')
      .addItem('⏹️ 監視停止', 'removeKentsuEmailTrigger')
      .addItem('🧪 テスト', 'testKentsuEmailParsing')
      .addItem('➕ テストデータ追加', 'addTestCase')
      .addItem('🗑️ クリア', 'clearAllCases'))
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('🧠 営業インテリジェンス')
      .addItem('⚙️ API設定', 'setupGeminiApiKey')
      .addItem('📊 インサイトを表示', 'showIntelligenceInsights')
      .addItem('🔄 今すぐ分析', 'runIntelligenceAnalysis')
      .addItem('🔧 利用可能なモデル確認', 'checkAvailableGeminiModels')
      .addItem('🧹 キャッシュクリア', 'clearIntelligenceCache')
      .addItem('⏰ 自動分析開始(12時間ごと)', 'setupIntelligenceTrigger')
      .addItem('⏹️ 自動分析停止', 'removeIntelligenceTrigger'))
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('🏢 帝国データバンク')
      .addItem('📁 PDFフォルダ設定', 'setupTeikokyFolder')
      .addItem('📋 フォルダ内PDF一覧', 'testListPDFsInFolder')
      .addItem('🔍 会社名でPDF検索テスト', 'testSearchPDF'))
    .addSeparator()
    .addItem('✅ 住所自動取得を有効化', 'setupAutoAddressTrigger')
    .addItem('⏹️ 住所自動取得を無効化', 'removeAutoAddressTrigger')
    .addToUi();
}

/***** 会社名クリーンアップ機能 *****/
function cleanCompanyNamesSelection() {
  processCompanyCleanup(false);
}

function cleanAllCompanyNames() {
  processCompanyCleanup(true);
}

function processCompanyCleanup(isAll) {
  const sheet = getTargetSheet();
  let startRow, endRow;

  if (isAll) {
    startRow = 2;
    endRow = sheet.getLastRow();
  } else {
    const range = sheet.getActiveRange();
    startRow = range.getRow();
    endRow = startRow + range.getNumRows() - 1;
  }

  let cleaned = 0, skipped = 0;

  for (let row = startRow; row <= endRow; row++) {
    if (row === 1) continue;
    const result = cleanCompanyName(sheet, row);
    if (result === 'cleaned') cleaned++;
    else if (result === 'skipped') skipped++;
  }

  showAlert(
    `${isAll ? '全会社名' : '会社名'}のクリーンアップが完了しました\n\n` +
    `クリーンアップ: ${cleaned}件\n` +
    `スキップ(変更なし): ${skipped}件`
  );
}

function cleanCompanyName(sheet, row) {
  try {
    const companyCell = sheet.getRange(row, CONFIG.COLUMNS.COMPANY);
    const currentCompany = String(companyCell.getValue() || '').trim();
    const address = getCellValue(sheet, row, CONFIG.COLUMNS.ADDRESS);

    if (!currentCompany || !address || address === '住所取得失敗' || address === '住所') {
      return 'skipped';
    }

    const cleanedCompany = removeUnnecessaryInfo(currentCompany, address);

    if (cleanedCompany !== currentCompany) {
      companyCell.setValue(cleanedCompany);
      return 'cleaned';
    }

    return 'skipped';
  } catch (err) {
    Logger.log(`cleanCompanyName error (row ${row}): ${err}`);
    return 'error';
  }
}

function removeUnnecessaryInfo(companyName, address) {
  const locationKeywords = [
    '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
    '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
    '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜',
    '静岡', '愛知', '三重', '滋賀', '京都', '大阪', '兵庫',
    '奈良', '和歌山', '鳥取', '島根', '岡山', '広島', '山口',
    '徳島', '香川', '愛媛', '高知', '福岡', '佐賀', '長崎',
    '熊本', '大分', '宮崎', '鹿児島', '沖縄',
    '区', '市', '町', '村', '県', '都', '府', '郡'
  ];

  const industryKeywords = [
    '建設', '工務', '土木', '解体', '鉄筋', 'とび', '型枠',
    '配管', '内装', '足場', '電気', '設備', '塗装', '防水',
    '左官', '大工', '板金', '屋根', '外構', '造園', '舗装',
    'リフォーム', '建築', '住宅', '工事', '施工'
  ];

  const otherKeywords = ['日本', '株式会社', '有限会社', '合同会社', '㈱', '㈲'];

  const allKeywords = [...locationKeywords, ...industryKeywords, ...otherKeywords];

  let cleaned = companyName;
  allKeywords.forEach(keyword => {
    cleaned = cleaned.replace(new RegExp(`\\s+${keyword}\\s+`, 'g'), ' ');
    cleaned = cleaned.replace(new RegExp(`\\s+${keyword}$`, 'g'), '');
    cleaned = cleaned.replace(new RegExp(`^${keyword}\\s+`, 'g'), '');
  });

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned === '' ? companyName : cleaned;
}

/***** Gemini API設定 *****/
function setupGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();
  const currentKey = properties.getProperty('GEMINI_API_KEY');

  const response = ui.prompt(
    'Gemini API設定',
    'Gemini API キーを入力してください:\n' +
    '(取得方法: https://makersuite.google.com/app/apikey)\n\n' +
    (currentKey ? '※既に設定済みです。' : ''),
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const apiKey = response.getResponseText().trim();
    if (apiKey) {
      properties.setProperty('GEMINI_API_KEY', apiKey);
      ui.alert('✅ APIキーを設定しました!');
    }
  }
}

/***** 営業インテリジェンス - データ収集 *****/
function collectAllSalesmenData() {
  const salesmenList = getSalesmanList();
  const allData = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - INTELLIGENCE_CONFIG.DAYS_TO_ANALYZE);

  const selfData = collectOwnData(cutoffDate);
  allData.push({ salesman: '自分', data: selfData });

  salesmenList.forEach(salesman => {
    if (!salesman.isSelf && salesman.url) {
      try {
        const data = collectOtherSalesmanData(salesman.url, cutoffDate);
        if (data.length > 0) {
          allData.push({ salesman: salesman.name, data: data });
        }
      } catch (error) {
        Logger.log(`${salesman.name}のデータ収集エラー: ${error.message}`);
      }
    }
  });

  return allData;
}

function collectOwnData(cutoffDate) {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  const recentUpdates = [];

  for (let row = 2; row <= lastRow; row++) {
    const company = getCellValue(sheet, row, CONFIG.COLUMNS.COMPANY);
    const memo = getCellValue(sheet, row, CONFIG.COLUMNS.MEMO);
    const visitHistoryStr = getCellValue(sheet, row, CONFIG.COLUMNS.VISIT_HISTORY);
    const kubun = getCellValue(sheet, row, CONFIG.COLUMNS.KUBUN);

    if (visitHistoryStr) {
      try {
        const visitHistory = JSON.parse(visitHistoryStr);
        visitHistory.forEach(visit => {
          const visitDate = new Date(visit.date);
          if (visitDate >= cutoffDate && visit.note) {
            recentUpdates.push({
              company: company,
              date: visit.date,
              note: visit.note,
              kubun: kubun,
              memo: memo
            });
          }
        });
      } catch (e) {}
    }
  }

  return recentUpdates;
}

function collectOtherSalesmanData(url, cutoffDate) {
  try {
    if (!url) return [];

    const fullUrl = url + '?mode=data';
    const response = UrlFetchApp.fetch(fullUrl, {
      muteHttpExceptions: true,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (response.getResponseCode() !== 200) return [];

    const data = JSON.parse(response.getContentText());
    const recentUpdates = [];

    data.forEach(loc => {
      if (loc.visitHistory && loc.visitHistory.length > 0) {
        loc.visitHistory.forEach(visit => {
          const visitDate = new Date(visit.date);
          if (visitDate >= cutoffDate && visit.note) {
            recentUpdates.push({
              company: loc.company,
              date: visit.date,
              note: visit.note,
              kubun: loc.kubun,
              memo: loc.memo
            });
          }
        });
      }
    });

    return recentUpdates;
  } catch (error) {
    Logger.log(`データ取得エラー: ${error.toString()}`);
    return [];
  }
}

/***** Gemini API分析 *****/
function analyzeWithGemini(allSalesmenData) {
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。「営業インテリジェンス」→「API設定」から設定してください。');
  }

  let analysisText = '';
  let recordCount = 0;
  const maxRecords = 200;

  for (const salesmanData of allSalesmenData) {
    if (salesmanData.data.length > 0) {
      analysisText += `【${salesmanData.salesman}の記録】\n`;
      for (const record of salesmanData.data) {
        if (recordCount >= maxRecords) break;
        const dateStr = record.date.substring(0, 10);
        const note = record.note.substring(0, 100);
        analysisText += `${record.company}(${dateStr}): ${note}\n`;
        recordCount++;
      }
      analysisText += '\n';
      if (recordCount >= maxRecords) break;
    }
  }

  if (analysisText.trim() === '') {
    return { urgent_opportunities: [] };
  }

  const prompt = `あなたは作業員派遣会社の営業分析AIです。
以下の営業記録から、ビジネスチャンスを5件以内で抽出してください。

${analysisText}

以下の情報を優先:
- 「忙しい」「人手不足」「急募」などの繁忙情報
- 着工予定、新規物件の情報
- 見積もり依頼、商談中の案件

**重要**:
- "source_company"には、情報を聞いた会社名（訪問先の会社名）を入れてください
- "detail"には、どこが忙しいか、何の情報かなどの具体的な内容を入れてください

必ず以下のJSON形式のみで回答してください:

{
  "urgent_opportunities": [
    {
      "type": "繁忙情報",
      "source_company": "訪問先の会社名",
      "summary": "20文字以内の要約",
      "detail": "50文字以内の詳細",
      "source_salesman": "営業マン名",
      "date": "2025-11-06",
      "priority": "高"
    }
  ]
}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 1024
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      throw new Error(`APIエラー (${responseCode})`);
    }

    const result = JSON.parse(response.getContentText());

    if (result.error || !result.candidates || result.candidates.length === 0) {
      throw new Error('AIからの応答がありません');
    }

    const candidate = result.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('AIの応答内容が空です');
    }

    let aiResponseText = candidate.content.parts[0].text.trim();
    aiResponseText = aiResponseText.replace(/```json\n?/gi, '').replace(/```\n?/g, '');

    const jsonStart = aiResponseText.indexOf('{');
    const jsonEnd = aiResponseText.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1) {
      aiResponseText = aiResponseText.substring(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(aiResponseText);
    return parsed.urgent_opportunities && Array.isArray(parsed.urgent_opportunities)
      ? parsed
      : { urgent_opportunities: [] };

  } catch (error) {
    Logger.log(`Error: ${error.toString()}`);
    throw error;
  }
}

/***** インサイト保存・取得 *****/
function saveIntelligenceInsights(insights) {
  const data = {
    insights: insights,
    timestamp: new Date().toISOString()
  };
  PropertiesService.getScriptProperties().setProperty(
    INTELLIGENCE_CONFIG.STORAGE_KEY,
    JSON.stringify(data)
  );
}

function getIntelligenceInsights() {
  const data = PropertiesService.getScriptProperties().getProperty(INTELLIGENCE_CONFIG.STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

/***** 自動分析実行 *****/
function runIntelligenceAnalysis() {
  try {
    const allData = collectAllSalesmenData();

    if (allData.every(d => d.data.length === 0)) {
      Logger.log('分析対象データなし');
      return;
    }

    const insights = analyzeWithGemini(allData);
    saveIntelligenceInsights(insights);

    if (insights.urgent_opportunities && insights.urgent_opportunities.length > 0) {
      const highPriorityCount = insights.urgent_opportunities.filter(opp => opp.priority === '高').length;

      if (highPriorityCount > 0) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `優先度【高】が${highPriorityCount}件見つかりました！`,
          '🔥 重要な営業情報を検出',
          15
        );
      }
    }
  } catch (error) {
    Logger.log(`自動分析エラー: ${error.toString()}`);
  }
}

function showIntelligenceInsights() {
  const data = getIntelligenceInsights();

  if (!data) {
    showAlert('ℹ️ まだ分析結果がありません\n\nマップを開くと自動的に分析が実行されます。');
    return;
  }

  const insights = data.insights;
  const timestamp = new Date(data.timestamp);

  let html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #667eea;">🧠 営業インテリジェンス</h2>
      <p style="color: #999; font-size: 12px;">最終更新: ${timestamp.toLocaleString('ja-JP')}</p>
      <h3 style="color: #333;">⚡ 重要な更新情報</h3>
  `;

  if (insights.urgent_opportunities && insights.urgent_opportunities.length > 0) {
    insights.urgent_opportunities.forEach((opp, index) => {
      const priorityColor = opp.priority === '高' ? '#f44336' :
                            opp.priority === '中' ? '#ff9800' : '#4caf50';
      const typeEmoji = opp.type.includes('繁忙') ? '🔥' :
                        opp.type.includes('物件') ? '📅' : '💰';

      const displayCompany = opp.source_company || opp.company || '不明';

      html += `
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid ${priorityColor};">
          <h4 style="margin: 0; font-size: 14px;">${typeEmoji} ${displayCompany}</h4>
          <p style="margin: 5px 0; color: #666; font-weight: 600;">${opp.summary}</p>
          <p style="margin: 5px 0; color: #555; font-size: 12px;">${opp.detail}</p>
          <p style="margin: 8px 0 0 0; color: #999; font-size: 11px;">📝 ${opp.source_salesman} (${opp.date})</p>
        </div>
      `;
    });
  } else {
    html += '<p style="color: #999; text-align: center; padding: 20px;">現在、重要な更新情報はありません。</p>';
  }

  html += `
      <div style="margin-top: 30px; text-align: center;">
        <button onclick="google.script.host.close()"
                style="background: #667eea; color: white; border: none; padding: 10px 30px; border-radius: 5px; cursor: pointer;">
          閉じる
        </button>
      </div>
    </div>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(850)
    .setHeight(600)
    .setTitle('営業インテリジェンス');

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '営業インテリジェンス');
}

function setupIntelligenceTrigger() {
  manageTrigger('runIntelligenceAnalysis', true, 'hours', INTELLIGENCE_CONFIG.CHECK_INTERVAL_HOURS);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    '12時間ごとに自動で営業情報を分析します。',
    '✅ 自動分析を設定しました',
    8
  );
}

function removeIntelligenceTrigger() {
  const removed = manageTrigger('runIntelligenceAnalysis', false);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    removed > 0 ? '自動分析を停止しました' : '自動分析は設定されていません',
    removed > 0 ? '✅ 停止完了' : 'ℹ️ 情報',
    5
  );
}

function checkAvailableGeminiModels() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    showAlert('❌ APIキーが設定されていません。');
    return;
  }

  try {
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: 'get', muteHttpExceptions: true }
    );

    const data = JSON.parse(response.getContentText());

    if (data.models && data.models.length > 0) {
      let modelList = '利用可能なGeminiモデル:\n\n';
      data.models.forEach(model => {
        if (model.name && model.name.includes('gemini')) {
          modelList += `✓ ${model.name}\n`;
        }
      });
      showAlert(modelList);
    }
  } catch (error) {
    showAlert(`❌ エラー:\n${error.message}`);
  }
}

function clearIntelligenceCache() {
  PropertiesService.getScriptProperties().deleteProperty(INTELLIGENCE_CONFIG.STORAGE_KEY);
  SpreadsheetApp.getActiveSpreadsheet().toast('キャッシュをクリアしました', '✅ 完了', 5);
}

/***** ヘルパー関数 *****/
function getTargetSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
}

function processRowsInRange(isAll) {
  const sheet = getTargetSheet();
  let startRow, endRow;

  if (isAll) {
    startRow = 2;
    endRow = sheet.getLastRow();
  } else {
    const range = sheet.getActiveRange();
    startRow = range.getRow();
    endRow = startRow + range.getNumRows() - 1;
  }

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

    if (!rowData.hasAddress) {
      const result = geocodeAddress(query, true);
      if (result.address) {
        let finalAddress = result.address;
        if (!isJapaneseAddress(result.address)) {
          const japaneseResult = convertToJapanese(result.address);
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

    if (!rowData.hasCoordinates) {
      if (!coordinates && rowData.hasAddress) {
        coordinates = getCoordinatesFromAddress(rowData.address);
      }
      if (coordinates) {
        updateCell(sheet, row, CONFIG.COLUMNS.LAT, coordinates.lat);
        updateCell(sheet, row, CONFIG.COLUMNS.LNG, coordinates.lng);
      }
    }

    if (!rowData.hasWebsite) {
      updateCell(sheet, row, CONFIG.COLUMNS.WEBSITE, buildGoogleSearchUrl(rowData.company));
    }

    if (addressWasSet) {
      Utilities.sleep(100);
      cleanCompanyName(sheet, row);
    }
  } catch (err) {
    Logger.log(`enrichRow error (row ${row}): ${err}`);
  }
}

function convertAddressToJapanese(sheet, row) {
  try {
    const addressCell = sheet.getRange(row, CONFIG.COLUMNS.ADDRESS);
    const currentAddress = String(addressCell.getValue() || '').trim();

    if (!currentAddress || currentAddress === '住所取得失敗') return 'empty';
    if (isJapaneseAddress(currentAddress)) return 'skipped';

    const result = convertToJapanese(currentAddress);

    if (result.address && result.address !== currentAddress) {
      addressCell.setValue(result.address);
      if (result.coordinates) {
        updateCell(sheet, row, CONFIG.COLUMNS.LAT, result.coordinates.lat);
        updateCell(sheet, row, CONFIG.COLUMNS.LNG, result.coordinates.lng);
      }

      Utilities.sleep(100);
      cleanCompanyName(sheet, row);
      return 'converted';
    }

    return 'failed';
  } catch (err) {
    Logger.log(`convertAddressToJapanese error (row ${row}): ${err}`);
    return 'error';
  }
}

function isJapaneseAddress(address) {
  return /[ぁ-んァ-ヶ一-龯々]/.test(address);
}

function geocodeAddress(query, includeCoords) {
  try {
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&language=ja&key=${apiKey}`;

    const response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    const result = JSON.parse(response.getContentText());

    if (result.status === 'OK' && result.results?.length > 0) {
      const bestResult = selectBestAddressCandidate(result.results);
      const address = cleanJapaneseAddress(bestResult.formatted_address);

      if (includeCoords) {
        return {
          address: address,
          coordinates: {
            lat: bestResult.geometry.location.lat,
            lng: bestResult.geometry.location.lng
          }
        };
      }
      return { address: address };
    }
  } catch (err) {
    Logger.log(`geocodeAddress error: ${err}`);
  }
  return { address: '', coordinates: null };
}

function getCoordinatesFromAddress(address) {
  const result = geocodeAddress(address, true);
  return result.coordinates;
}

function convertToJapanese(englishAddress) {
  try {
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(englishAddress)}&key=${apiKey}`;

    const geocodeResponse = UrlFetchApp.fetch(geocodeUrl, {muteHttpExceptions: true});
    const geocodeResult = JSON.parse(geocodeResponse.getContentText());

    if (geocodeResult.status !== 'OK' || !geocodeResult.results?.length) {
      return { address: '', coordinates: null };
    }

    const location = geocodeResult.results[0].geometry.location;
    const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&language=ja&key=${apiKey}`;

    const reverseResponse = UrlFetchApp.fetch(reverseUrl, {muteHttpExceptions: true});
    const reverseResult = JSON.parse(reverseResponse.getContentText());

    if (reverseResult.status === 'OK' && reverseResult.results?.length > 0) {
      return {
        address: cleanJapaneseAddress(reverseResult.results[0].formatted_address),
        coordinates: { lat: location.lat, lng: location.lng }
      };
    }
  } catch (err) {
    Logger.log(`convertToJapanese error: ${err}`);
  }
  return { address: '', coordinates: null };
}

function cleanJapaneseAddress(address) {
  if (!address) return '';
  return address.replace(/^日本、\s*/, '').replace(/〒\d{3}-\d{4}\s*/, '').trim();
}

function selectBestAddressCandidate(results) {
  const PREFERRED_TYPES = ['street_address', 'premise', 'subpremise', 'establishment'];
  const preferredResult = results.find(result =>
    (result.types || []).some(type => PREFERRED_TYPES.includes(type))
  );
  return preferredResult || results[0];
}

function getRowData(sheet, row) {
  const company = getCellValue(sheet, row, CONFIG.COLUMNS.COMPANY);
  const address = getCellValue(sheet, row, CONFIG.COLUMNS.ADDRESS);
  const website = getCellValue(sheet, row, CONFIG.COLUMNS.WEBSITE);
  const lat = getCellValue(sheet, row, CONFIG.COLUMNS.LAT);
  const lng = getCellValue(sheet, row, CONFIG.COLUMNS.LNG);

  return {
    company: company,
    address: address,
    hasAddress: address !== '',
    hasWebsite: website !== '',
    hasCoordinates: lat !== '' && lng !== ''
  };
}

function getCellValue(sheet, row, col) {
  return String(sheet.getRange(row, col).getValue() || '').trim();
}

function updateCell(sheet, row, col, value) {
  sheet.getRange(row, col).setValue(value);
}

function buildSearchQuery(companyName) {
  let query = normalizeCompanyName(companyName);

  if (!/日本/.test(query)) query += ' 日本';
  if (!/建設|工務|土木|解体|鉄筋|とび|型枠|配管|内装|足場/.test(query)) query += ' 建設';

  return query.trim();
}

function normalizeCompanyName(name) {
  const REPLACEMENTS = {
    '㈱': '株式会社',
    '(株)': '株式会社',
    'Ⅰ': '1',
    'Ⅱ': '2',
    'Ⅲ': '3'
  };

  let normalized = name.replace(/\s+/g, ' ').replace(/　/g, ' ');

  for (const [pattern, replacement] of Object.entries(REPLACEMENTS)) {
    normalized = normalized.replace(new RegExp(pattern, 'g'), replacement);
  }

  return normalized;
}

function buildGoogleSearchUrl(companyName) {
  return `https://www.google.com/search?q=${encodeURIComponent(companyName)}`;
}

function showAlert(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    Logger.log(message);
  }
}

/***** 建通新聞メール監視 *****/
function setupKentsuEmailTrigger() {
  manageTrigger('checkKentsuEmails', true, 'minutes', KENTSU_CONFIG.CHECK_INTERVAL_MINUTES);
  showAlert('✅ メール監視を開始しました!');
}

function removeKentsuEmailTrigger() {
  const removed = manageTrigger('checkKentsuEmails', false);
  showAlert(removed > 0 ? '✅ 監視を停止しました' : 'ℹ️ 監視は設定されていません');
}

function checkKentsuEmails() {
  try {
    const lastCheck = PropertiesService.getScriptProperties().getProperty('kentsu_last_check') ||
                      Math.floor((Date.now() - 86400000) / 1000);
    const threads = GmailApp.search(
      `from:${KENTSU_CONFIG.EMAIL_FROM} subject:"${KENTSU_CONFIG.EMAIL_SUBJECT_KEYWORD}" after:${lastCheck}`,
      0, 10
    );

    if (threads.length === 0) return;

    const cases = getPendingCases();
    threads.forEach(thread => {
      thread.getMessages().forEach(message => {
        parseKentsuEmail(message).forEach(c => {
          if (!cases.some(ex => ex.projectName === c.projectName && ex.address === c.address)) {
            cases.push(c);
          }
        });
      });
    });

    savePendingCases(cases);
    PropertiesService.getScriptProperties().setProperty('kentsu_last_check', Math.floor(Date.now() / 1000).toString());
  } catch (error) {
    Logger.log(`Error: ${error}`);
  }
}

function parseKentsuEmail(message) {
  const body = message.getPlainBody();
  const lines = body.split('\n');
  const cases = [];
  let current = null;

  lines.forEach(line => {
    line = line.trim();

    if (line.startsWith('●')) {
      if (current && current.price >= KENTSU_CONFIG.MIN_PRICE) cases.push(current);
      current = {
        client: line.substring(1).trim(),
        projectName: '',
        address: '',
        price: 0,
        contractor: '',
        url: '',
        emailDate: message.getDate()
      };
    } else if (line.startsWith('▽') && current) {
      const match = line.match(/（([^）]+)）/);
      if (match) current.address = match[1].trim();
      const nameMatch = line.match(/^▽([^（]+)/);
      if (nameMatch && !current.projectName) current.projectName = nameMatch[1].trim();
    } else if ((line.includes('落札') || line.includes('受注') || line.includes('施工')) && current && !current.contractor) {
      const contractorMatch = line.match(/(?:落札|受注|施工)[：:]\s*(.+)/);
      if (contractorMatch) {
        current.contractor = contractorMatch[1].trim();
      } else {
        current.contractor = line;
      }
    } else if (line.includes('予定') && (line.includes('万円') || line.includes('億円')) && current) {
      const numbers = line.match(/[\d,，]+/g);
      if (numbers) {
        numbers.forEach(n => {
          const num = parseInt(n.replace(/[,，]/g, ''));
          if (!isNaN(num)) {
            const price = line.includes('億円') ? num * 100000000 : num * 10000;
            if (price > current.price) current.price = price;
          }
        });
      }
    } else if ((line.startsWith('http://') || line.startsWith('https://')) && current && !current.url) {
      current.url = line.trim();
    }
  });

  if (current && current.price >= KENTSU_CONFIG.MIN_PRICE) cases.push(current);
  return cases;
}

function getPendingCases() {
  const data = PropertiesService.getScriptProperties().getProperty(KENTSU_CONFIG.STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function savePendingCases(cases) {
  PropertiesService.getScriptProperties().setProperty(KENTSU_CONFIG.STORAGE_KEY, JSON.stringify(cases));
}

function getNewCases() {
  return getPendingCases();
}

function registerCase(index) {
  const cases = getPendingCases();
  if (index < 0 || index >= cases.length) throw new Error('無効なインデックス');

  const c = cases[index];
  const sheet = getTargetSheet();
  const row = sheet.getLastRow() + 1;

  updateCell(sheet, row, CONFIG.COLUMNS.COMPANY, c.projectName);
  updateCell(sheet, row, CONFIG.COLUMNS.ADDRESS, c.address);
  updateCell(sheet, row, CONFIG.COLUMNS.MEMO, `発注者: ${c.client}\n落札価格: ${c.price.toLocaleString()}円`);
  updateCell(sheet, row, CONFIG.COLUMNS.KUBUN, '現場');

  const coords = getCoordinatesFromAddress(c.address);
  if (coords) {
    updateCell(sheet, row, CONFIG.COLUMNS.LAT, coords.lat);
    updateCell(sheet, row, CONFIG.COLUMNS.LNG, coords.lng);
  }

  cases.splice(index, 1);
  savePendingCases(cases);
  return { success: true, row: row, remaining: cases.length };
}

function addTestCase() {
  const cases = getPendingCases();
  cases.push({
    client: "東京都",
    projectName: "新島羽伏浦園地休憩舎改修工事",
    address: "東京都新島村",
    price: 67900000,
    contractor: "株式会社テスト建設",
    url: "https://www.kentsu.co.jp/example",
    emailDate: new Date()
  });
  savePendingCases(cases);
  showAlert('テストデータを追加しました!');
}

function clearAllCases() {
  savePendingCases([]);
  showAlert('新着案件を全てクリアしました');
  return { success: true };
}

function testKentsuEmailParsing() {
  const threads = GmailApp.search(`from:${KENTSU_CONFIG.EMAIL_FROM}`, 0, 1);
  if (threads.length === 0) {
    showAlert('メールが見つかりません');
    return;
  }
  const cases = parseKentsuEmail(threads[0].getMessages()[0]);
  showAlert(`${cases.length}件の案件を抽出しました`);
}

/***** 削除機能 *****/
function deleteLocation(row) {
  try {
    const sheet = getTargetSheet();
    if (!sheet) throw new Error('シートが見つかりません');
    if (row < 2) throw new Error('ヘッダー行は削除できません');
    if (row > sheet.getLastRow()) throw new Error('指定された行が存在しません');

    sheet.deleteRow(row);
    return { success: true, message: '削除しました' };
  } catch (error) {
    Logger.log('削除エラー:', error);
    return { success: false, message: 'エラー: ' + error.message };
  }
}

/***** 重複会社チェック機能 *****/
function getMapDataWithDuplicates() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  const data = [];
  const companyMap = {};

  for (let row = 2; row <= lastRow; row++) {
    const company = getCellValue(sheet, row, CONFIG.COLUMNS.COMPANY);
    const lat = getCellValue(sheet, row, CONFIG.COLUMNS.LAT);
    const lng = getCellValue(sheet, row, CONFIG.COLUMNS.LNG);

    if (company && lat && lng) {
      const visitHistoryStr = getCellValue(sheet, row, CONFIG.COLUMNS.VISIT_HISTORY);
      let visitHistory = [];
      if (visitHistoryStr) {
        try {
          visitHistory = JSON.parse(visitHistoryStr);
        } catch (e) {
          visitHistory = [];
        }
      }

      const locationData = {
        company: company,
        address: getCellValue(sheet, row, CONFIG.COLUMNS.ADDRESS),
        memo: getCellValue(sheet, row, CONFIG.COLUMNS.MEMO),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        website: getCellValue(sheet, row, CONFIG.COLUMNS.WEBSITE),
        kubun: getCellValue(sheet, row, CONFIG.COLUMNS.KUBUN),
        visitHistory: visitHistory,
        sansanUrl: getCellValue(sheet, row, CONFIG.COLUMNS.SANSAN_URL),
        row: row,
        registeredBy: '自分',
        duplicates: []
      };

      data.push(locationData);

      const normalizedCompany = normalizeCompanyForDuplicate(company);
      if (!companyMap[normalizedCompany]) {
        companyMap[normalizedCompany] = [];
      }
      companyMap[normalizedCompany].push({
        salesman: '自分',
        data: locationData
      });
    }
  }

  const salesmanList = getSalesmanList();
  salesmanList.forEach(salesman => {
    if (!salesman.isSelf && salesman.url) {
      try {
        const otherData = fetchOtherSalesmanCompanies(salesman.url);
        otherData.forEach(otherCompany => {
          const normalizedCompany = normalizeCompanyForDuplicate(otherCompany.company);
          if (!companyMap[normalizedCompany]) {
            companyMap[normalizedCompany] = [];
          }
          companyMap[normalizedCompany].push({
            salesman: salesman.name,
            data: otherCompany
          });
        });
      } catch (error) {
        Logger.log(`${salesman.name}のデータ取得エラー: ${error.message}`);
      }
    }
  });

  data.forEach(loc => {
    const normalizedCompany = normalizeCompanyForDuplicate(loc.company);
    const duplicateEntries = companyMap[normalizedCompany] || [];

    if (duplicateEntries.length > 1) {
      loc.duplicates = duplicateEntries
        .filter(entry => entry.salesman !== '自分')
        .map(entry => entry.salesman);
    }
  });

  return data;
}

function normalizeCompanyForDuplicate(companyName) {
  if (!companyName) return '';

  return companyName
    .replace(/株式会社|有限会社|㈱|㈲|合同会社|合資会社|合名会社/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .trim();
}

function fetchOtherSalesmanCompanies(url) {
  try {
    if (!url) return [];

    const fullUrl = url + '?mode=data';
    const response = UrlFetchApp.fetch(fullUrl, {
      muteHttpExceptions: true,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (response.getResponseCode() !== 200) return [];

    const data = JSON.parse(response.getContentText());
    return data.map(loc => ({
      company: loc.company,
      address: loc.address
    }));
  } catch (error) {
    Logger.log(`データ取得エラー: ${error.toString()}`);
    return [];
  }
}

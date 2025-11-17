/***** 設定 *****/
const CONFIG = {
  SHEET_NAME: 'フォームの回答 1',
  SALESMAN_CONFIG_SHEET: '営業マン一覧',
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
  REGION: 'JP',
  LANGUAGE: 'ja',
  GOOGLE_MAPS_API_KEY: 'AIzaSyAqJN_eFQZj8B2aFpHl__2xJiKFpJvUfrE'
};

/***** 帝国データバンク設定 *****/
const TEIKOKU_CONFIG = {
  DRIVE_FOLDER_NAME: '帝国データバンク',
  PDF_FILE_PATTERN: /\.pdf$/i,
  STORAGE_KEY: 'teikoku_data_cache',
  CACHE_DURATION_HOURS: 24
};

/***** 建通新聞メール自動取り込み設定 *****/
const KENTSU_CONFIG = {
  EMAIL_FROM: 'media@kentsu.co.jp',
  EMAIL_SUBJECT_KEYWORD: '情報配信サービス　建通新聞',
  MIN_PRICE: 50000000,
  STORAGE_KEY: 'kentsu_pending_cases',
  CHECK_INTERVAL_MINUTES: 10
};

/***** 営業インテリジェンス設定 *****/
const INTELLIGENCE_CONFIG = {
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  STORAGE_KEY: 'intelligence_insights',
  CHECK_INTERVAL_HOURS: 12,
  DAYS_TO_ANALYZE: 7
};

/***** ウェブアプリのエントリーポイント *****/
function doGet(e) {
  const mode = e.parameter.mode;

  if (mode === 'data') {
    return ContentService
      .createTextOutput(JSON.stringify(getMapData()))
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

  if (mode === 'teikoku') {
    const company = e.parameter.company;
    return ContentService
      .createTextOutput(JSON.stringify(getTeikokuData(company)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutputFromFile('MapApp')
    .setTitle('営業先マップ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/***** 帝国データバンク関連関数 *****/
function loadTeikokuDataFromDrive() {
  try {
    // 「帝国データバンク」フォルダを検索
    const folders = DriveApp.getFoldersByName(TEIKOKU_CONFIG.DRIVE_FOLDER_NAME);

    if (!folders.hasNext()) {
      Logger.log('帝国データバンクフォルダが見つかりません');
      return null;
    }

    const folder = folders.next();
    const allFiles = folder.getFiles();

    // PDFファイルをすべて取得してマッピング
    const teikokuData = {};

    while (allFiles.hasNext()) {
      const file = allFiles.next();
      const fileName = file.getName();

      if (TEIKOKU_CONFIG.PDF_FILE_PATTERN.test(fileName)) {
        // ファイル名から会社名を抽出（拡張子を除く）
        const companyName = fileName.replace(/\.pdf$/i, '').trim();
        const normalizedName = normalizeCompanyNameForMatching(companyName);

        teikokuData[normalizedName] = {
          fileName: fileName,
          fileUrl: file.getUrl(),
          fileId: file.getId(),
          lastUpdated: file.getLastUpdated().toISOString()
        };

        Logger.log(`PDFファイル登録: ${companyName}`);
      }
    }

    // キャッシュに保存
    const cache = {
      data: teikokuData,
      timestamp: new Date().toISOString()
    };

    PropertiesService.getScriptProperties().setProperty(
      TEIKOKU_CONFIG.STORAGE_KEY,
      JSON.stringify(cache)
    );

    Logger.log(`帝国データバンク: ${Object.keys(teikokuData).length}件読み込み完了`);
    return teikokuData;

  } catch (error) {
    Logger.log(`帝国データバンク読み込みエラー: ${error}`);
    return null;
  }
}

function normalizeCompanyNameForMatching(name) {
  return name
    .replace(/株式会社|有限会社|合同会社|㈱|㈲|\(株\)|\(有\)/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
}

function getTeikokuData(companyName) {
  if (!companyName) {
    return null;
  }

  try {
    // キャッシュを確認
    const properties = PropertiesService.getScriptProperties();
    const cached = properties.getProperty(TEIKOKU_CONFIG.STORAGE_KEY);

    let teikokuData = null;

    if (cached) {
      const cache = JSON.parse(cached);
      const cacheAge = (new Date() - new Date(cache.timestamp)) / (1000 * 60 * 60);

      if (cacheAge < TEIKOKU_CONFIG.CACHE_DURATION_HOURS) {
        teikokuData = cache.data;
        Logger.log('帝国データバンク: キャッシュを使用');
      }
    }

    // キャッシュがない場合は読み込み
    if (!teikokuData) {
      teikokuData = loadTeikokuDataFromDrive();
    }

    if (!teikokuData) {
      return null;
    }

    // 会社名を正規化してマッチング
    const normalized = normalizeCompanyNameForMatching(companyName);
    const match = teikokuData[normalized];

    if (match) {
      Logger.log(`帝国データバンク: ${companyName} のデータが見つかりました`);
      return match;
    }

    // 部分一致も試す
    for (const key in teikokuData) {
      if (key.includes(normalized) || normalized.includes(key)) {
        Logger.log(`帝国データバンク: ${companyName} の部分一致データが見つかりました`);
        return teikokuData[key];
      }
    }

    Logger.log(`帝国データバンク: ${companyName} のデータが見つかりません`);
    return null;

  } catch (error) {
    Logger.log(`帝国データバンク取得エラー: ${error}`);
    return null;
  }
}

function refreshTeikokuCache() {
  const data = loadTeikokuDataFromDrive();
  if (data) {
    const fileList = Object.keys(data).map(key => `- ${data[key].fileName}`).join('\n');
    SpreadsheetApp.getUi().alert(
      `✅ 帝国データバンクを更新しました\n\n${Object.keys(data).length}件のPDFを読み込みました:\n\n${fileList.substring(0, 300)}`
    );
  } else {
    SpreadsheetApp.getUi().alert(
      '❌ 帝国データバンクの読み込みに失敗しました\n\n' +
      '以下を確認してください：\n' +
      '1. Googleドライブに「帝国データバンク」フォルダが存在するか\n' +
      '2. そのフォルダ内にPDFファイルが存在するか\n' +
      '3. PDFファイル名が会社名になっているか'
    );
  }
}

function clearTeikokuCache() {
  PropertiesService.getScriptProperties().deleteProperty(TEIKOKU_CONFIG.STORAGE_KEY);
  SpreadsheetApp.getUi().alert('✅ 帝国データバンクのキャッシュをクリアしました');
}

function testTeikokuMatching() {
  const sheet = getTargetSheet();
  const company = sheet.getRange(2, CONFIG.COLUMNS.COMPANY).getValue();

  if (!company) {
    SpreadsheetApp.getUi().alert('B2セルに会社名を入力してください');
    return;
  }

  // デバッグ情報を表示
  const normalized = normalizeCompanyNameForMatching(company);
  Logger.log(`会社名: ${company}`);
  Logger.log(`正規化後: ${normalized}`);

  const data = getTeikokuData(company);

  if (data) {
    let message = `✅ 「${company}」のデータが見つかりました\n\n`;
    message += `ファイル名: ${data.fileName}\n`;
    message += `ファイルURL: ${data.fileUrl}\n`;
    SpreadsheetApp.getUi().alert(message);
  } else {
    // 利用可能なPDFファイルをリスト表示
    const properties = PropertiesService.getScriptProperties();
    const cached = properties.getProperty(TEIKOKU_CONFIG.STORAGE_KEY);

    let message = `❌ 「${company}」のデータが見つかりませんでした\n\n`;
    message += `正規化された会社名: ${normalized}\n\n`;

    if (cached) {
      const cache = JSON.parse(cached);
      const keys = Object.keys(cache.data);
      message += `登録されているPDF (${keys.length}件):\n`;
      keys.slice(0, 5).forEach(key => {
        message += `- ${key}\n`;
      });
      if (keys.length > 5) {
        message += `... 他 ${keys.length - 5}件`;
      }
    } else {
      message += 'データがキャッシュされていません。\n「データを更新」を実行してください。';
    }

    SpreadsheetApp.getUi().alert(message);
  }
}

/***** メイン処理 *****/
function onFormSubmit(e) {
  const sheet = getTargetSheet();
  const row = e.range.getRow();
  enrichRow(sheet, row);
  Logger.log(`フォーム送信処理完了: 行${row}`);
}

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

function convertAddressesToJapanese() {
  const sheet = getTargetSheet();
  const range = sheet.getActiveRange();
  const startRow = range.getRow();
  const endRow = startRow + range.getNumRows() - 1;

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (let row = startRow; row <= endRow; row++) {
    if (row === 1) continue;
    const result = convertAddressToJapanese(sheet, row);
    if (result === 'converted') converted++;
    else if (result === 'skipped') skipped++;
    else if (result === 'failed') failed++;
    Utilities.sleep(CONFIG.SLEEP_MS);
  }

  SpreadsheetApp.getUi().alert(
    '住所の日本語化が完了しました\n\n' +
    `変換成功: ${converted}件\n` +
    `スキップ(既に日本語): ${skipped}件\n` +
    `変換失敗: ${failed}件`
  );
}

function convertAllAddressesToJapanese() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (let row = 2; row <= lastRow; row++) {
    const result = convertAddressToJapanese(sheet, row);
    if (result === 'converted') converted++;
    else if (result === 'skipped') skipped++;
    else if (result === 'failed') failed++;
    Utilities.sleep(CONFIG.SLEEP_MS);
  }

  SpreadsheetApp.getUi().alert(
    '全住所の日本語化が完了しました\n\n' +
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
      <p style="margin: 15px 0; color: #666; font-size: 14px;">
        ※このURLを共有すれば、他の人もマップを見ることができます<br>
        ※データは常にスプレッドシートから最新のものが表示されます
      </p>
      <button onclick="navigator.clipboard.writeText('${url}').then(() => alert('URLをコピーしました!'))"
              style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
        URLをコピー
      </button>
      <button onclick="window.open('${url}', '_blank')"
              style="background: #764ba2; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px; margin-left: 10px;">
        マップを開く
      </button>
    </div>
  `)
  .setWidth(600)
  .setHeight(350);

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

  SpreadsheetApp.getUi().alert(
    'マップボタンを追加しました!\n\n' +
    'A1セルのリンクをクリックすると、営業先マップが開きます。\n\n' +
    'URL: ' + url
  );
}

/***** セル編集時の自動処理（インストール可能なトリガー用） *****/
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

  if (lat && lng) {
    Logger.log(`Row ${row}: 座標が既に存在するためスキップ`);
    return;
  }

  const coordinates = getCoordinatesFromAddress(address);
  if (coordinates) {
    updateCell(sheet, row, CONFIG.COLUMNS.LAT, coordinates.lat);
    updateCell(sheet, row, CONFIG.COLUMNS.LNG, coordinates.lng);
    Logger.log(`Row ${row}: 住所から座標を自動取得 (${coordinates.lat}, ${coordinates.lng})`);
  } else {
    Logger.log(`Row ${row}: 座標の取得に失敗`);
  }
}

/***** 住所自動取得トリガーのインストール・削除 *****/
function setupAutoAddressTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditInstallable') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 新しいトリガーをインストール
  ScriptApp.newTrigger('onEditInstallable')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  SpreadsheetApp.getUi().alert(
    '✅ 住所自動取得を有効化しました!\n\n' +
    '会社名(B列)を入力すると、自動的に住所が取得されます。\n' +
    '住所(C列)を手動で入力すると、自動的に座標が取得されます。\n\n' +
    '※この設定は永続的に保存されます'
  );
}

function removeAutoAddressTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditInstallable') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  if (removed > 0) {
    SpreadsheetApp.getUi().alert(
      '✅ 住所自動取得を無効化しました\n\n' +
      `${removed}個のトリガーを削除しました`
    );
  } else {
    SpreadsheetApp.getUi().alert(
      'ℹ️ 住所自動取得は設定されていません'
    );
  }
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

/***** 区分変更 *****/
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
    const address = getCellValue(sheet, row, CONFIG.COLUMNS.ADDRESS);
    const memo = getCellValue(sheet, row, CONFIG.COLUMNS.MEMO);
    const lat = getCellValue(sheet, row, CONFIG.COLUMNS.LAT);
    const lng = getCellValue(sheet, row, CONFIG.COLUMNS.LNG);
    const website = getCellValue(sheet, row, CONFIG.COLUMNS.WEBSITE);
    const kubun = getCellValue(sheet, row, CONFIG.COLUMNS.KUBUN);
    const visitHistoryStr = getCellValue(sheet, row, CONFIG.COLUMNS.VISIT_HISTORY);
    const sansanUrl = getCellValue(sheet, row, CONFIG.COLUMNS.SANSAN_URL);

    let visitHistory = [];
    if (visitHistoryStr) {
      try {
        visitHistory = JSON.parse(visitHistoryStr);
      } catch (e) {
        visitHistory = [];
      }
    }

    if (company && lat && lng) {
      data.push({
        company: company,
        address: address,
        memo: memo,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        website: website,
        kubun: kubun,
        visitHistory: visitHistory,
        sansanUrl: sansanUrl,
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

  const targetGoal = getMonthlyTargetGoal();

  return {
    totalStrategyCount: totalStrategyCount,
    visitedThisMonth: visitedThisMonth,
    notVisitedCount: notVisitedCount,
    currentYear: currentYear,
    currentMonth: currentMonth,
    targetGoal: targetGoal
  };
}

/***** 目標件数の設定・取得 *****/
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

  if (!sheet) {
    return [{
      name: '自分',
      url: ScriptApp.getService().getUrl(),
      isSelf: true
    }];
  }

  const lastRow = sheet.getLastRow();
  const salesmen = [];

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

  salesmen.unshift({
    name: '自分',
    url: ScriptApp.getService().getUrl(),
    isSelf: true
  });

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
      .addItem('🔄 データを更新', 'refreshTeikokuCache')
      .addItem('🧹 キャッシュクリア', 'clearTeikokuCache')
      .addItem('🧪 マッチングテスト', 'testTeikokuMatching'))
    .addSeparator()
    .addItem('✅ 住所自動取得を有効化', 'setupAutoAddressTrigger')
    .addItem('⏹️ 住所自動取得を無効化', 'removeAutoAddressTrigger')
    .addToUi();
}

/***** 会社名クリーンアップ機能 *****/
function cleanCompanyNamesSelection() {
  const sheet = getTargetSheet();
  const range = sheet.getActiveRange();
  const startRow = range.getRow();
  const endRow = startRow + range.getNumRows() - 1;

  let cleaned = 0;
  let skipped = 0;

  for (let row = startRow; row <= endRow; row++) {
    if (row === 1) continue;
    const result = cleanCompanyName(sheet, row);
    if (result === 'cleaned') cleaned++;
    else if (result === 'skipped') skipped++;
  }

  SpreadsheetApp.getUi().alert(
    '会社名のクリーンアップが完了しました\n\n' +
    `クリーンアップ: ${cleaned}件\n` +
    `スキップ(変更なし): ${skipped}件`
  );
}

function cleanAllCompanyNames() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  let cleaned = 0;
  let skipped = 0;

  for (let row = 2; row <= lastRow; row++) {
    const result = cleanCompanyName(sheet, row);
    if (result === 'cleaned') cleaned++;
    else if (result === 'skipped') skipped++;
  }

  SpreadsheetApp.getUi().alert(
    '全会社名のクリーンアップが完了しました\n\n' +
    `クリーンアップ: ${cleaned}件\n` +
    `スキップ(変更なし): ${skipped}件`
  );
}

function cleanCompanyName(sheet, row) {
  try {
    const companyCell = sheet.getRange(row, CONFIG.COLUMNS.COMPANY);
    const currentCompany = String(companyCell.getValue() || '').trim();
    const address = getCellValue(sheet, row, CONFIG.COLUMNS.ADDRESS);

    if (!address || address === '住所取得失敗' || address === '住所') {
      return 'skipped';
    }

    if (!currentCompany) {
      return 'skipped';
    }

    const cleanedCompany = removeUnnecessaryInfo(currentCompany, address);

    if (cleanedCompany !== currentCompany) {
      companyCell.setValue(cleanedCompany);
      Logger.log(`Row ${row}: "${currentCompany}" → "${cleanedCompany}"`);
      return 'cleaned';
    }

    return 'skipped';
  } catch (err) {
    Logger.log(`cleanCompanyName error (row ${row}): ${err}`);
    return 'error';
  }
}

function removeUnnecessaryInfo(companyName, address) {
  let cleaned = companyName;

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

  const otherKeywords = [
    '日本', '株式会社', '有限会社', '合同会社', '㈱', '㈲'
  ];

  const allKeywords = [...locationKeywords, ...industryKeywords, ...otherKeywords];

  allKeywords.forEach(keyword => {
    cleaned = cleaned.replace(new RegExp(`\\s+${keyword}\\s+`, 'g'), ' ');
    cleaned = cleaned.replace(new RegExp(`\\s+${keyword}$`, 'g'), '');
    cleaned = cleaned.replace(new RegExp(`^${keyword}\\s+`, 'g'), '');
  });

  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();

  if (cleaned === '') {
    return companyName;
  }

  return cleaned;
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
    (currentKey ? '※既に設定済みです。変更する場合は新しいキーを入力してください。' : ''),
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
  allData.push({
    salesman: '自分',
    data: selfData
  });

  Logger.log(`自分: ${selfData.length}件`);

  salesmenList.forEach(salesman => {
    if (!salesman.isSelf && salesman.url) {
      try {
        Logger.log(`${salesman.name}のデータを取得中...`);
        const data = collectOtherSalesmanData(salesman.url, cutoffDate);
        if (data.length > 0) {
          allData.push({
            salesman: salesman.name,
            data: data
          });
          Logger.log(`${salesman.name}: ${data.length}件取得成功`);
        } else {
          Logger.log(`${salesman.name}: データなし`);
        }
      } catch (error) {
        Logger.log(`${salesman.name}のデータ収集をスキップ(エラー: ${error.message})`);
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
      } catch (e) {
      }
    }
  }

  return recentUpdates;
}

function collectOtherSalesmanData(url, cutoffDate) {
  try {
    if (!url || url === '') {
      Logger.log('URLが空です');
      return [];
    }

    const fullUrl = url + '?mode=data';
    Logger.log(`データ取得URL: ${fullUrl}`);

    const response = UrlFetchApp.fetch(fullUrl, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log(`データ取得失敗: ${responseCode}`);
      return [];
    }

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

    Logger.log(`${recentUpdates.length}件の最近の更新を取得`);
    return recentUpdates;
  } catch (error) {
    Logger.log(`データ取得エラー: ${error.toString()}`);
    return [];
  }
}

/***** Gemini API分析 - 修正版（source_company対応）*****/
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
    return {
      urgent_opportunities: []
    };
  }

  const prompt = `あなたは作業員派遣会社の営業分析AIです。
以下の営業記録から、ビジネスチャンスを5件以内で抽出してください。

入力形式: 「訪問先会社名(日付): 訪問メモ」

${analysisText}

以下の情報を優先:
- 「忙しい」「人手不足」「急募」などの繁忙情報
- 着工予定、新規物件の情報
- 見積もり依頼、商談中の案件

**重要**:
- "source_company"には、情報を聞いた会社名（訪問先の会社名）を入れてください
- "detail"には、どこが忙しいか、何の情報かなどの具体的な内容を入れてください

必ず以下のJSON形式のみで回答してください。他の文章は一切含めないでください:

{
  "urgent_opportunities": [
    {
      "type": "繁忙情報",
      "source_company": "訪問先の会社名（情報を聞いた会社）",
      "summary": "20文字以内の要約",
      "detail": "50文字以内の詳細（どこが忙しいかなど具体的な内容）",
      "source_salesman": "営業マン名",
      "date": "2025-11-06",
      "priority": "高"
    }
  ]
}`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 1024,
      stopSequences: []
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE"
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  };

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    Logger.log('APIリクエスト送信中...');
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log(`Response Code: ${responseCode}`);

    if (responseCode !== 200) {
      Logger.log(`Error Response: ${responseText.substring(0, 500)}`);
      throw new Error(`APIエラー (${responseCode})`);
    }

    const result = JSON.parse(responseText);

    if (result.error) {
      Logger.log(`API Error: ${JSON.stringify(result.error)}`);
      throw new Error(`APIエラー: ${result.error.message || 'Unknown error'}`);
    }

    if (result.promptFeedback && result.promptFeedback.blockReason) {
      Logger.log(`Blocked: ${result.promptFeedback.blockReason}`);
      throw new Error(`リクエストがブロックされました: ${result.promptFeedback.blockReason}`);
    }

    if (!result.candidates || result.candidates.length === 0) {
      Logger.log('No candidates in response');
      Logger.log(JSON.stringify(result, null, 2).substring(0, 1000));
      throw new Error('AIからの応答がありません');
    }

    const candidate = result.candidates[0];

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      Logger.log(`Unexpected finish reason: ${candidate.finishReason}`);
    }

    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      Logger.log('No content in candidate');
      Logger.log(JSON.stringify(candidate, null, 2));
      throw new Error('AIの応答内容が空です');
    }

    let aiResponseText = candidate.content.parts[0].text;
    Logger.log(`AI Response (first 500 chars): ${aiResponseText.substring(0, 500)}`);

    aiResponseText = aiResponseText.trim();
    aiResponseText = aiResponseText.replace(/```json\n?/gi, '').replace(/```\n?/g, '');

    const jsonStart = aiResponseText.indexOf('{');
    const jsonEnd = aiResponseText.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1) {
      aiResponseText = aiResponseText.substring(jsonStart, jsonEnd + 1);
    }

    try {
      const parsed = JSON.parse(aiResponseText);

      if (!parsed.urgent_opportunities || !Array.isArray(parsed.urgent_opportunities)) {
        Logger.log('Invalid data structure');
        return { urgent_opportunities: [] };
      }

      Logger.log(`Parsed ${parsed.urgent_opportunities.length} opportunities`);
      return parsed;

    } catch (parseError) {
      Logger.log(`JSON Parse Error: ${parseError.message}`);
      Logger.log(`Failed to parse: ${aiResponseText.substring(0, 500)}`);
      return { urgent_opportunities: [] };
    }

  } catch (error) {
    Logger.log(`=== Error Details ===`);
    Logger.log(`Error: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);

    if (error.toString().includes('DNS') || error.toString().includes('connection')) {
      throw new Error('ネットワークエラー: インターネット接続を確認してください');
    }

    throw error;
  }
}

/***** インサイト保存・取得 *****/
function saveIntelligenceInsights(insights) {
  const properties = PropertiesService.getScriptProperties();
  const data = {
    insights: insights,
    timestamp: new Date().toISOString()
  };
  properties.setProperty(INTELLIGENCE_CONFIG.STORAGE_KEY, JSON.stringify(data));
}

function getIntelligenceInsights() {
  const properties = PropertiesService.getScriptProperties();
  const data = properties.getProperty(INTELLIGENCE_CONFIG.STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

/***** 自動分析実行関数 - 12時間ごとにバックグラウンドで実行 *****/
function runIntelligenceAnalysis() {
  try {
    Logger.log('=== 自動分析開始 ===');
    Logger.log(`実行時刻: ${new Date().toLocaleString('ja-JP')}`);

    const allData = collectAllSalesmenData();

    if (allData.every(d => d.data.length === 0)) {
      Logger.log('分析対象データなし - 終了');
      return;
    }

    allData.forEach(salesmanData => {
      Logger.log(`${salesmanData.salesman}: ${salesmanData.data.length}件`);
    });

    const insights = analyzeWithGemini(allData);
    saveIntelligenceInsights(insights);

    Logger.log('✅ 自動分析完了');
    Logger.log(`検出された重要情報: ${insights.urgent_opportunities?.length || 0}件`);

    if (insights.urgent_opportunities && insights.urgent_opportunities.length > 0) {
      const highPriorityCount = insights.urgent_opportunities.filter(opp => opp.priority === '高').length;

      if (highPriorityCount > 0) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `優先度【高】が${highPriorityCount}件見つかりました！マップで確認してください。`,
          '🔥 重要な営業情報を検出',
          15
        );
      } else {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `${insights.urgent_opportunities.length}件の営業情報を更新しました`,
          '✅ 営業インテリジェンス更新',
          8
        );
      }
    }

  } catch (error) {
    Logger.log(`=== 自動分析エラー ===`);
    Logger.log(`エラー: ${error.toString()}`);
    Logger.log(`スタック: ${error.stack}`);
  }
}

function showIntelligenceInsights() {
  const data = getIntelligenceInsights();

  if (!data) {
    SpreadsheetApp.getUi().alert('ℹ️ まだ分析結果がありません\n\nマップを開くと自動的に分析が実行されます。');
    return;
  }

  const insights = data.insights;
  const timestamp = new Date(data.timestamp);

  let html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
      <h2 style="color: #667eea; margin-bottom: 10px;">🧠 営業インテリジェンス</h2>
      <p style="color: #999; font-size: 12px; margin-bottom: 20px;">
        最終更新: ${timestamp.toLocaleString('ja-JP')} | 全員の訪問履歴から重要情報を抽出
      </p>

      <h3 style="color: #333; margin: 20px 0 10px 0; font-size: 16px;">⚡ 重要な更新情報</h3>
  `;

  if (insights.urgent_opportunities && insights.urgent_opportunities.length > 0) {
    insights.urgent_opportunities.forEach((opp, index) => {
      const priorityColor = opp.priority === '高' ? '#f44336' :
                            opp.priority === '中' ? '#ff9800' : '#4caf50';
      const typeEmoji = opp.type.includes('繁忙') ? '🔥' :
                        opp.type.includes('物件') ? '📅' :
                        opp.type.includes('施工') ? '🏢' : '💰';

      const displayCompany = opp.source_company || opp.company || '不明';

      html += `
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid ${priorityColor};">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 14px; color: #333;">
              ${typeEmoji} ${displayCompany}
            </h4>
            <span style="background: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px;">
              ${opp.priority}
            </span>
          </div>
          <p style="margin: 5px 0; color: #666; font-size: 13px; font-weight: 600;">
            ${opp.summary}
          </p>
          <p style="margin: 5px 0; color: #555; font-size: 12px; line-height: 1.5;">
            ${opp.detail}
          </p>
          <p style="margin: 8px 0 0 0; color: #999; font-size: 11px;">
            📝 ${opp.source_salesman} (${opp.date})
          </p>
        </div>
      `;
    });
  } else {
    html += '<p style="color: #999; text-align: center; padding: 20px;">現在、重要な更新情報はありません。</p>';
  }

  html += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
        <button onclick="google.script.host.close()"
                style="background: #667eea; color: white; border: none; padding: 10px 30px; border-radius: 5px; cursor: pointer; font-size: 14px;">
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

/***** 自動分析トリガー - 12時間ごと *****/
function setupIntelligenceTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runIntelligenceAnalysis') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('runIntelligenceAnalysis')
    .timeBased()
    .everyHours(12)
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    '12時間ごとに自動で営業情報を分析します。\nマップで最新のインサイトを確認できます。',
    '✅ 自動分析を設定しました',
    8
  );
}

function removeIntelligenceTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runIntelligenceAnalysis') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  if (removed > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '自動分析を停止しました',
      '✅ 停止完了',
      5
    );
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '自動分析は設定されていません',
      'ℹ️ 情報',
      5
    );
  }
}

/***** 利用可能なGeminiモデルを確認する *****/
function checkAvailableGeminiModels() {
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    SpreadsheetApp.getUi().alert('❌ APIキーが設定されていません。\n「営業インテリジェンス」→「API設定」から設定してください。');
    return;
  }

  try {
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'get',
        muteHttpExceptions: true
      }
    );

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log(`レスポンスコード: ${responseCode}`);
    Logger.log(`レスポンス内容:\n${responseText}`);

    if (responseCode === 200) {
      const data = JSON.parse(responseText);

      if (data.models && data.models.length > 0) {
        let modelList = '利用可能なGeminiモデル:\n\n';

        data.models.forEach(model => {
          if (model.name && model.name.includes('gemini')) {
            modelList += `✓ ${model.name}\n`;
            if (model.displayName) {
              modelList += `  表示名: ${model.displayName}\n`;
            }
            modelList += '\n';
          }
        });

        Logger.log(modelList);
        SpreadsheetApp.getUi().alert(modelList + '\n詳細はログを確認してください。\n「拡張機能」→「Apps Script」→「実行数」');
      } else {
        SpreadsheetApp.getUi().alert('モデル情報が取得できませんでした。');
      }
    } else {
      SpreadsheetApp.getUi().alert(`❌ エラー (${responseCode}):\n${responseText}`);
    }

  } catch (error) {
    Logger.log(`エラー: ${error}`);
    SpreadsheetApp.getUi().alert(`❌ エラー:\n${error.message}`);
  }
}

/***** キャッシュクリア *****/
function clearIntelligenceCache() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty(INTELLIGENCE_CONFIG.STORAGE_KEY);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'キャッシュをクリアしました',
    '✅ 完了',
    5
  );
}

/***** ヘルパー関数 *****/
function getTargetSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
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

    if (!rowData.hasAddress) {
      const result = geocodeAddressWithCoords(query);
      if (result.address) {
        let finalAddress = result.address;
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
      updateCell(sheet, row, CONFIG.COLUMNS.WEBSITE,
        buildGoogleSearchUrl(rowData.company));
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

    if (!currentAddress || currentAddress === '住所取得失敗') {
      return 'empty';
    }

    if (isJapaneseAddress(currentAddress)) {
      return 'skipped';
    }

    const result = convertEnglishToJapaneseAddress(currentAddress);

    if (result.address && result.address !== currentAddress) {
      addressCell.setValue(result.address);
      if (result.coordinates) {
        updateCell(sheet, row, CONFIG.COLUMNS.LAT, result.coordinates.lat);
        updateCell(sheet, row, CONFIG.COLUMNS.LNG, result.coordinates.lng);
      }
      Logger.log(`Row ${row}: ${currentAddress} → ${result.address}`);

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

function geocodeAddressWithCoords(query) {
  try {
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&language=ja&key=${apiKey}`;

    const response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    const result = JSON.parse(response.getContentText());

    if (result.status === 'OK' && result.results?.length > 0) {
      const bestResult = selectBestAddressCandidate(result.results);
      const address = cleanJapaneseAddress(bestResult.formatted_address);
      const coordinates = {
        lat: bestResult.geometry.location.lat,
        lng: bestResult.geometry.location.lng
      };

      return { address, coordinates };
    }
  } catch (err) {
    Logger.log(`geocodeAddressWithCoords error: ${err}`);
  }
  return { address: '', coordinates: null };
}

function getCoordinatesFromAddress(address) {
  try {
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&language=ja&key=${apiKey}`;

    const response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    const result = JSON.parse(response.getContentText());

    if (result.status === 'OK' && result.results?.length > 0) {
      const location = result.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
  } catch (err) {
    Logger.log(`getCoordinatesFromAddress error: ${err}`);
  }
  return null;
}

function convertEnglishToJapaneseAddress(englishAddress) {
  try {
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;

    const encodedAddress = encodeURIComponent(englishAddress);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

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
    Logger.log(`convertEnglishToJapaneseAddress error: ${err}`);
  }
  return { address: '', coordinates: null };
}

function cleanJapaneseAddress(address) {
  if (!address) return '';

  let cleanedAddress = address.replace(/^日本、\s*/, '');
  cleanedAddress = cleanedAddress.replace(/〒\d{3}-\d{4}\s*/, '');

  return cleanedAddress.trim();
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

function getCellValue(sheet, row, col) {
  return String(sheet.getRange(row, col).getValue() || '').trim();
}

function updateCell(sheet, row, col, value) {
  sheet.getRange(row, col).setValue(value);
}

function buildSearchQuery(companyName) {
  let query = normalizeCompanyName(companyName);
  query = addSearchHints(query);
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

  let normalized = name
    .replace(/\s+/g, ' ')
    .replace(/　/g, ' ');

  for (const [pattern, replacement] of Object.entries(REPLACEMENTS)) {
    normalized = normalized.replace(new RegExp(pattern, 'g'), replacement);
  }

  return normalized;
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

function buildGoogleSearchUrl(companyName) {
  return `https://www.google.com/search?q=${encodeURIComponent(companyName)}`;
}

function buildSansanSearchUrl(companyName) {
  const normalized = normalizeCompanyName(companyName);
  return `https://ap.sansan.com/v/search?q=${encodeURIComponent(normalized)}`;
}

/***** 建通新聞メール監視関数 *****/
function setupKentsuEmailTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkKentsuEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('checkKentsuEmails')
    .timeBased()
    .everyMinutes(KENTSU_CONFIG.CHECK_INTERVAL_MINUTES)
    .create();

  SpreadsheetApp.getUi().alert('✅ メール監視を開始しました!\n\nマップの左サイドバーで新着案件を確認できます。');
}

function removeKentsuEmailTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkKentsuEmails') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });
  SpreadsheetApp.getUi().alert(removed > 0 ? '✅ 監視を停止しました' : 'ℹ️ 監視は設定されていません');
}

function checkKentsuEmails() {
  try {
    const lastCheck = PropertiesService.getScriptProperties().getProperty('kentsu_last_check') || Math.floor((Date.now() - 86400000) / 1000);
    const threads = GmailApp.search(`from:${KENTSU_CONFIG.EMAIL_FROM} subject:"${KENTSU_CONFIG.EMAIL_SUBJECT_KEYWORD}" after:${lastCheck}`, 0, 10);

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

/***** parseKentsuEmail - 修正版（落札業者・URLに対応） *****/
function parseKentsuEmail(message) {
  const body = message.getPlainBody();
  const lines = body.split('\n');
  const cases = [];
  let current = null;

  lines.forEach(line => {
    line = line.trim();

    // ● で始まる行 → 発注者（クライアント）
    if (line.startsWith('●')) {
      if (current && current.price >= KENTSU_CONFIG.MIN_PRICE) cases.push(current);
      current = {
        client: line.substring(1).trim(),
        projectName: '',
        address: '',
        price: 0,
        contractor: '',  // 落札業者を追加
        url: '',         // URLを追加
        emailDate: message.getDate()
      };
    }
    // ▽ で始まる行 → プロジェクト名と住所
    else if (line.startsWith('▽') && current) {
      const match = line.match(/（([^）]+)）/);
      if (match) current.address = match[1].trim();
      const nameMatch = line.match(/^▽([^（]+)/);
      if (nameMatch && !current.projectName) current.projectName = nameMatch[1].trim();
    }
    // 落札業者を抽出（「落札」「受注」などのキーワードを含む行）
    else if ((line.includes('落札') || line.includes('受注') || line.includes('施工')) && current && !current.contractor) {
      // 「落札:」「受注:」などの形式から会社名を抽出
      const contractorMatch = line.match(/(?:落札|受注|施工)[：:]\s*(.+)/);
      if (contractorMatch) {
        current.contractor = contractorMatch[1].trim();
      } else {
        // 行全体を落札業者として扱う（柔軟な対応）
        current.contractor = line;
      }
    }
    // 価格情報
    else if (line.includes('予定') && (line.includes('万円') || line.includes('億円')) && current) {
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
    }
    // URLを抽出
    else if ((line.startsWith('http://') || line.startsWith('https://')) && current && !current.url) {
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
  SpreadsheetApp.getUi().alert('テストデータを追加しました!\n\nマップを開いて左サイドバーを確認してください。');
}

function clearAllCases() {
  savePendingCases([]);
  SpreadsheetApp.getUi().alert('新着案件を全てクリアしました');
  return { success: true };
}

function testKentsuEmailParsing() {
  const threads = GmailApp.search(`from:${KENTSU_CONFIG.EMAIL_FROM}`, 0, 1);
  if (threads.length === 0) {
    SpreadsheetApp.getUi().alert('メールが見つかりません\n\nmedia@kentsu.co.jpからのメールがGmailに届いているか確認してください。');
    return;
  }
  const cases = parseKentsuEmail(threads[0].getMessages()[0]);
  SpreadsheetApp.getUi().alert(`${cases.length}件の案件を抽出しました\n\n詳細は「拡張機能」→「Apps Script」→「実行数」で確認してください。`);
}

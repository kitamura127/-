/***** 設定 *****/
const CONFIG = {
  SHEET_NAME: 'フォームの回答 1',
  SALESMAN_CONFIG_SHEET: '営業マン一覧',
  TEIKOKU_FOLDER_ID: '1_i2kVMGlz5JqOavSZTkWYBWBpyhJVrQD', // 帝国データバンクPDFを格納するGoogleドライブフォルダID
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

/***** 帝国データバンクPDF検索機能 *****/
function findTeikokyPDF(companyName) {
  try {
    Logger.log(`=== PDF検索開始 ===`);
    Logger.log(`元の会社名: ${companyName}`);

    // 会社名をクリーンアップ（株式会社などを除去してマッチング精度を上げる）
    let cleanName = companyName
      .replace(/株式会社|有限会社|㈱|㈲|合同会社|合資会社|合名会社/g, '')
      .replace(/\s+/g, '')
      .trim();

    Logger.log(`クリーンアップ後: ${cleanName}`);
    Logger.log(`フォルダID: ${CONFIG.TEIKOKU_FOLDER_ID}`);

    // フォルダIDが設定されている場合は特定フォルダ内を検索
    let files;
    let folderName = '';

    if (CONFIG.TEIKOKU_FOLDER_ID && CONFIG.TEIKOKU_FOLDER_ID !== '') {
      try {
        const folder = DriveApp.getFolderById(CONFIG.TEIKOKU_FOLDER_ID);
        folderName = folder.getName();
        Logger.log(`検索フォルダ: ${folderName}`);

        // まずフォルダ内の全PDFをカウント
        const allPdfs = folder.getFilesByType(MimeType.PDF);
        let pdfCount = 0;
        let pdfNames = [];
        while (allPdfs.hasNext() && pdfCount < 10) {
          const pdf = allPdfs.next();
          pdfNames.push(pdf.getName());
          pdfCount++;
        }
        Logger.log(`フォルダ内のPDF数（最初の10件）: ${pdfCount}件`);
        Logger.log(`PDFファイル名: ${pdfNames.join(', ')}`);

        // 検索クエリを実行
        files = folder.searchFiles(`title contains "${cleanName}"`);
      } catch (e) {
        Logger.log(`フォルダ検索エラー: ${e.message}`);
        Logger.log(`エラー詳細: ${e.stack}`);
        // フォルダが見つからない場合は全体を検索
        files = DriveApp.searchFiles(`mimeType = "application/pdf" and title contains "${cleanName}"`);
      }
    } else {
      Logger.log(`フォルダID未設定 - 全体検索`);
      // フォルダIDが未設定の場合はGoogleドライブ全体から検索
      files = DriveApp.searchFiles(`mimeType = "application/pdf" and title contains "${cleanName}"`);
    }

    if (files.hasNext()) {
      const file = files.next();

      // ファイルのウェブ表示用URLを取得
      const url = file.getUrl();

      // PDFを直接開けるリンクを作成
      const fileId = file.getId();
      const directUrl = `https://drive.google.com/file/d/${fileId}/view`;

      Logger.log(`✅ 帝国データバンクPDF見つかりました: ${file.getName()}`);
      Logger.log(`ファイルID: ${fileId}`);

      return {
        found: true,
        url: directUrl,
        fileName: file.getName(),
        fileId: fileId
      };
    }

    Logger.log(`❌ 帝国データバンクPDF見つかりませんでした: ${companyName} (検索語: ${cleanName})`);
    return {
      found: false
    };
  } catch (error) {
    Logger.log(`❌ findTeikokyPDF error: ${error}`);
    Logger.log(`エラースタック: ${error.stack}`);
    return {
      found: false,
      error: error.message
    };
  }
}

/***** Apps Scriptエディタ専用 - シンプルなドライブアクセステスト *****/
function testDriveAccessSimple() {
  try {
    Logger.log('========================================');
    Logger.log('=== シンプルドライブアクセステスト ===');
    Logger.log('========================================');
    Logger.log(`フォルダID: ${CONFIG.TEIKOKU_FOLDER_ID}`);
    Logger.log('');

    // フォルダにアクセス
    const folder = DriveApp.getFolderById(CONFIG.TEIKOKU_FOLDER_ID);
    Logger.log(`✅ フォルダアクセス成功!`);
    Logger.log(`フォルダ名: ${folder.getName()}`);
    Logger.log('');

    // PDF一覧を取得
    const files = folder.getFilesByType(MimeType.PDF);
    let count = 0;

    Logger.log('--- フォルダ内のPDFファイル一覧 ---');
    while (files.hasNext()) {
      const file = files.next();
      count++;
      Logger.log(`${count}. ${file.getName()}`);
      Logger.log(`   ファイルID: ${file.getId()}`);
      Logger.log(`   URL: https://drive.google.com/file/d/${file.getId()}/view`);
      Logger.log('');
    }

    Logger.log('========================================');
    Logger.log(`合計: ${count}件のPDFファイル`);
    Logger.log('========================================');
    Logger.log('');
    Logger.log('✅ テスト成功！権限が正しく設定されています。');

    return `成功: ${count}件のPDFファイルが見つかりました`;

  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ エラー発生');
    Logger.log('========================================');
    Logger.log(`エラーメッセージ: ${error.message}`);
    Logger.log(`エラースタック: ${error.stack}`);
    Logger.log('');
    Logger.log('対処法:');
    Logger.log('1. appsscript.jsonに "https://www.googleapis.com/auth/drive.readonly" が含まれているか確認');
    Logger.log('2. この関数を実行して権限の承認を行ってください');
    Logger.log('3. 承認後、再度実行してください');

    throw error; // エラーを再スローして権限承認ダイアログを表示
  }
}

/***** テスト用関数 - フォルダ内のPDFを一覧表示（メニュー用） *****/
function testListPDFsInFolder() {
  try {
    Logger.log('=== フォルダ内PDF一覧テスト ===');
    Logger.log(`フォルダID: ${CONFIG.TEIKOKU_FOLDER_ID}`);

    const folder = DriveApp.getFolderById(CONFIG.TEIKOKU_FOLDER_ID);
    Logger.log(`フォルダ名: ${folder.getName()}`);

    const files = folder.getFilesByType(MimeType.PDF);
    let count = 0;

    Logger.log('\n--- PDF一覧 ---');
    while (files.hasNext()) {
      const file = files.next();
      count++;
      Logger.log(`${count}. ${file.getName()}`);
      Logger.log(`   ID: ${file.getId()}`);
      Logger.log(`   URL: https://drive.google.com/file/d/${file.getId()}/view`);
    }

    Logger.log(`\n合計: ${count}件のPDFファイル`);

    // UIコンテキストでのみalertを使用
    try {
      SpreadsheetApp.getUi().alert(
        `✅ テスト完了\n\n` +
        `フォルダ名: ${folder.getName()}\n` +
        `PDFファイル数: ${count}件\n\n` +
        `詳細は「拡張機能」→「Apps Script」→「実行数」で確認してください。`
      );
    } catch (e) {
      // UIコンテキスト外の場合はログのみ
      Logger.log('✅ テスト完了（UIなし）');
    }

  } catch (error) {
    Logger.log(`❌ エラー: ${error}`);
    Logger.log(`スタック: ${error.stack}`);

    try {
      SpreadsheetApp.getUi().alert(`❌ エラー:\n${error.message}`);
    } catch (e) {
      // UIコンテキスト外の場合はログのみ
      Logger.log('❌ エラー（UIなし）');
    }

    throw error;
  }
}

/***** テスト用関数 - 特定の会社名でPDF検索 *****/
function testSearchPDF() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'PDF検索テスト',
    '検索する会社名を入力してください:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const companyName = response.getResponseText();
    Logger.log(`\n=== PDF検索テスト: ${companyName} ===`);

    const result = findTeikokyPDF(companyName);

    let message = '';
    if (result.found) {
      message = `✅ PDF見つかりました!\n\n` +
                `ファイル名: ${result.fileName}\n` +
                `URL: ${result.url}\n\n` +
                `詳細ログは「拡張機能」→「Apps Script」→「実行数」で確認してください。`;
    } else {
      message = `❌ PDFが見つかりませんでした\n\n` +
                `会社名: ${companyName}\n\n` +
                `詳細ログは「拡張機能」→「Apps Script」→「実行数」で確認してください。\n\n` +
                `PDFファイル名に会社名の一部が含まれているか確認してください。`;
    }

    ui.alert(message);
  }
}

/***** 帝国データバンクフォルダIDを設定する関数 *****/
function setupTeikokyFolder() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();
  const currentFolderId = CONFIG.TEIKOKU_FOLDER_ID;

  const response = ui.prompt(
    '帝国データバンクフォルダ設定',
    '帝国データバンクのPDFを格納しているGoogleドライブのフォルダURLまたはフォルダIDを入力してください:\n\n' +
    '例: https://drive.google.com/drive/folders/xxxxx\n' +
    'または: xxxxx (フォルダIDのみ)\n\n' +
    (currentFolderId ? `現在の設定: ${currentFolderId}` : '※未設定の場合はGoogleドライブ全体を検索します'),
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    let input = response.getResponseText().trim();

    if (input) {
      // URLからフォルダIDを抽出
      const folderIdMatch = input.match(/folders\/([a-zA-Z0-9_-]+)/);
      const folderId = folderIdMatch ? folderIdMatch[1] : input;

      // フォルダが存在するか確認
      try {
        const folder = DriveApp.getFolderById(folderId);
        ui.alert(
          '✅ フォルダを設定しました!\n\n' +
          `フォルダ名: ${folder.getName()}\n` +
          `フォルダID: ${folderId}\n\n` +
          '※この設定を永続化するには、code.gs の CONFIG.TEIKOKU_FOLDER_ID を編集してください。'
        );

        // 一時的にスクリプトプロパティに保存（オプション）
        properties.setProperty('TEIKOKU_FOLDER_ID', folderId);

      } catch (e) {
        ui.alert('❌ エラー: フォルダが見つかりません。\nフォルダIDまたはURLを確認してください。');
      }
    }
  }
}

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

  return HtmlService.createHtmlOutputFromFile('MapApp')
    .setTitle('営業先マップ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
      .addItem('📁 PDFフォルダ設定', 'setupTeikokyFolder')
      .addItem('📋 フォルダ内PDF一覧', 'testListPDFsInFolder')
      .addItem('🔍 会社名でPDF検索テスト', 'testSearchPDF'))
    .addSeparator()
    .addItem('✅ 住所自動取得を有効化', 'setupAutoAddressTrigger')
    .addItem('⏹️ 住所自動取得を無効化', 'removeAutoAddressTrigger')
    .addToUi();
}

// 残りの関数は文字数制限のため省略（元のコードを使用してください）

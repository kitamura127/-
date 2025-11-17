/**
 * UIハンドラー
 * ユーザーインターフェース関連の処理
 */

/**
 * メニューを構築
 */
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
    .addItem('✅ 住所自動取得を有効化', 'setupAutoAddressTrigger')
    .addItem('⏹️ 住所自動取得を無効化', 'removeAutoAddressTrigger')
    .addToUi();
}

/**
 * 選択範囲を補完
 */
function enrichSelection() {
  const sheet = getTargetSheet();
  const range = sheet.getActiveRange();
  const startRow = range.getRow();
  const endRow = startRow + range.getNumRows() - 1;
  processRows(sheet, startRow, endRow);
}

/**
 * 全行を補完
 */
function enrichAll() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  processRows(sheet, 2, lastRow);
}

/**
 * 選択範囲の住所を日本語化
 */
function convertAddressesToJapanese() {
  const sheet = getTargetSheet();
  const range = sheet.getActiveRange();
  const startRow = range.getRow();
  const endRow = startRow + range.getNumRows() - 1;

  const result = processAddressConversion(sheet, startRow, endRow);

  SpreadsheetApp.getUi().alert(
    '住所の日本語化が完了しました\n\n' +
    `変換成功: ${result.converted}件\n` +
    `スキップ(既に日本語): ${result.skipped}件\n` +
    `変換失敗: ${result.failed}件`
  );
}

/**
 * 全住所を日本語化
 */
function convertAllAddressesToJapanese() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  const result = processAddressConversion(sheet, 2, lastRow);

  SpreadsheetApp.getUi().alert(
    '全住所の日本語化が完了しました\n\n' +
    `変換成功: ${result.converted}件\n` +
    `スキップ(既に日本語): ${result.skipped}件\n` +
    `変換失敗: ${result.failed}件`
  );
}

/**
 * 住所変換処理を実行
 * @param {Sheet} sheet - 対象シート
 * @param {number} startRow - 開始行
 * @param {number} endRow - 終了行
 * @return {Object} 処理結果
 */
function processAddressConversion(sheet, startRow, endRow) {
  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (let row = startRow; row <= endRow; row++) {
    if (row === 1) continue;
    const result = convertAddressToJapanese(sheet, row);
    if (result === 'converted') converted++;
    else if (result === 'skipped') skipped++;
    else if (result === 'failed') failed++;
    sleep();
  }

  return { converted, skipped, failed };
}

/**
 * 選択範囲の会社名をクリーンアップ
 */
function cleanCompanyNamesSelection() {
  const sheet = getTargetSheet();
  const range = sheet.getActiveRange();
  const startRow = range.getRow();
  const endRow = startRow + range.getNumRows() - 1;

  const result = processCompanyNameCleanup(sheet, startRow, endRow);

  SpreadsheetApp.getUi().alert(
    '会社名のクリーンアップが完了しました\n\n' +
    `クリーンアップ: ${result.cleaned}件\n` +
    `スキップ(変更なし): ${result.skipped}件`
  );
}

/**
 * 全会社名をクリーンアップ
 */
function cleanAllCompanyNames() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  const result = processCompanyNameCleanup(sheet, 2, lastRow);

  SpreadsheetApp.getUi().alert(
    '全会社名のクリーンアップが完了しました\n\n' +
    `クリーンアップ: ${result.cleaned}件\n` +
    `スキップ(変更なし): ${result.skipped}件`
  );
}

/**
 * 会社名クリーンアップ処理を実行
 * @param {Sheet} sheet - 対象シート
 * @param {number} startRow - 開始行
 * @param {number} endRow - 終了行
 * @return {Object} 処理結果
 */
function processCompanyNameCleanup(sheet, startRow, endRow) {
  let cleaned = 0;
  let skipped = 0;

  for (let row = startRow; row <= endRow; row++) {
    if (row === 1) continue;
    const result = cleanCompanyName(sheet, row);
    if (result === 'cleaned') cleaned++;
    else if (result === 'skipped') skipped++;
  }

  return { cleaned, skipped };
}

/**
 * マップアプリを開く（ダイアログ）
 */
function openMapApp() {
  const html = HtmlService.createHtmlOutputFromFile('MapApp')
    .setWidth(1200)
    .setHeight(800)
    .setTitle('営業先マップ');
  SpreadsheetApp.getUi().showModalDialog(html, '営業先マップ');
}

/**
 * マップURLを表示
 */
function showMapUrl() {
  const url = getWebAppUrl();
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

/**
 * シートにマップボタンを追加
 */
function addMapButtonToSheet() {
  const sheet = getTargetSheet();
  const url = getWebAppUrl();

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

/**
 * Gemini APIキーを設定
 */
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

/**
 * 営業インテリジェンスのインサイトを表示
 */
function showIntelligenceInsights() {
  const data = getIntelligenceInsights();

  if (!data) {
    SpreadsheetApp.getUi().alert('ℹ️ まだ分析結果がありません\n\nマップを開くと自動的に分析が実行されます。');
    return;
  }

  const insights = data.insights;
  const timestamp = new Date(data.timestamp);

  const html = buildIntelligenceInsightsHtml(insights, timestamp);

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(850)
    .setHeight(600)
    .setTitle('営業インテリジェンス');

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '営業インテリジェンス');
}

/**
 * インテリジェンスインサイトのHTMLを構築
 * @param {Object} insights - インサイトデータ
 * @param {Date} timestamp - タイムスタンプ
 * @return {string} HTML文字列
 */
function buildIntelligenceInsightsHtml(insights, timestamp) {
  let html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
      <h2 style="color: #667eea; margin-bottom: 10px;">🧠 営業インテリジェンス</h2>
      <p style="color: #999; font-size: 12px; margin-bottom: 20px;">
        最終更新: ${timestamp.toLocaleString('ja-JP')} | 全員の訪問履歴から重要情報を抽出
      </p>

      <h3 style="color: #333; margin: 20px 0 10px 0; font-size: 16px;">⚡ 重要な更新情報</h3>
  `;

  if (insights.urgent_opportunities && insights.urgent_opportunities.length > 0) {
    insights.urgent_opportunities.forEach((opp) => {
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

  return html;
}

/**
 * 利用可能なGeminiモデルを確認
 */
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
      { method: 'get', muteHttpExceptions: true }
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

/**
 * 住所自動取得トリガーを設定
 */
function setupAutoAddressTrigger() {
  deleteTriggersByFunction('onEditInstallable');

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

/**
 * 住所自動取得トリガーを削除
 */
function removeAutoAddressTrigger() {
  const removed = deleteTriggersByFunction('onEditInstallable');

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

/**
 * 営業インテリジェンストリガーを設定
 */
function setupIntelligenceTrigger() {
  deleteTriggersByFunction('runIntelligenceAnalysis');

  ScriptApp.newTrigger('runIntelligenceAnalysis')
    .timeBased()
    .everyHours(INTELLIGENCE_CONFIG.CHECK_INTERVAL_HOURS)
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    '12時間ごとに自動で営業情報を分析します。\nマップで最新のインサイトを確認できます。',
    '✅ 自動分析を設定しました',
    8
  );
}

/**
 * 営業インテリジェンストリガーを削除
 */
function removeIntelligenceTrigger() {
  const removed = deleteTriggersByFunction('runIntelligenceAnalysis');

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

/**
 * 建通新聞メール監視トリガーを設定
 */
function setupKentsuEmailTrigger() {
  deleteTriggersByFunction('checkKentsuEmails');

  ScriptApp.newTrigger('checkKentsuEmails')
    .timeBased()
    .everyMinutes(KENTSU_CONFIG.CHECK_INTERVAL_MINUTES)
    .create();

  SpreadsheetApp.getUi().alert('✅ メール監視を開始しました!\n\nマップの左サイドバーで新着案件を確認できます。');
}

/**
 * 建通新聞メール監視トリガーを削除
 */
function removeKentsuEmailTrigger() {
  const removed = deleteTriggersByFunction('checkKentsuEmails');
  SpreadsheetApp.getUi().alert(removed > 0 ? '✅ 監視を停止しました' : 'ℹ️ 監視は設定されていません');
}

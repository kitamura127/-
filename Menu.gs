/**
 * Menu.gs
 * メニューとUI関連機能
 */

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

/***** マップUI *****/
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

  showAlert(
    'マップボタンを追加しました!\n\n' +
    'A1セルのリンクをクリックすると、営業先マップが開きます。\n\n' +
    'URL: ' + url
  );
}

/***** 営業インテリジェンス表示 *****/
function showIntelligenceInsights() {
  const data = getIntelligenceInsights();

  if (!data) {
    showAlert('ℹ️ まだ分析結果がありません\n\nマップを開くと自動的に分析が実行されます。');
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

/***** トリガー設定UI *****/
function setupAutoAddressTrigger() {
  removeTriggersByFunction('onEditInstallable');

  ScriptApp.newTrigger('onEditInstallable')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  showAlert(
    '✅ 住所自動取得を有効化しました!\n\n' +
    '会社名(B列)を入力すると、自動的に住所が取得されます。\n' +
    '住所(C列)を手動で入力すると、自動的に座標が取得されます。\n\n' +
    '※この設定は永続的に保存されます'
  );
}

function removeAutoAddressTrigger() {
  const removed = removeTriggersByFunction('onEditInstallable');

  if (removed > 0) {
    showAlert(`✅ 住所自動取得を無効化しました\n\n${removed}個のトリガーを削除しました`);
  } else {
    showAlert('ℹ️ 住所自動取得は設定されていません');
  }
}

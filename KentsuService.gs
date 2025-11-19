/**
 * KentsuService.gs
 * 建通新聞メール自動取り込みサービス
 */

/***** メール監視 *****/
function checkKentsuEmails() {
  try {
    const lastCheck = getProperty('kentsu_last_check') || Math.floor((Date.now() - 86400000) / 1000);
    const threads = GmailApp.search(
      `from:${KENTSU_CONFIG.EMAIL_FROM} subject:"${KENTSU_CONFIG.EMAIL_SUBJECT_KEYWORD}" after:${lastCheck}`,
      0,
      10
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
    setProperty('kentsu_last_check', Math.floor(Date.now() / 1000).toString());
  } catch (error) {
    Logger.log(`checkKentsuEmails error: ${error}`);
  }
}

/***** メール解析 *****/
function parseKentsuEmail(message) {
  const body = message.getPlainBody();
  const lines = body.split('\n');
  const cases = [];
  let current = null;

  lines.forEach(line => {
    line = line.trim();

    // ● で始まる行 → 発注者（クライアント）
    if (line.startsWith('●')) {
      if (current && current.price >= KENTSU_CONFIG.MIN_PRICE) {
        cases.push(current);
      }
      current = {
        client: line.substring(1).trim(),
        projectName: '',
        address: '',
        price: 0,
        contractor: '',
        url: '',
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
    // 落札業者を抽出
    else if ((line.includes('落札') || line.includes('受注') || line.includes('施工')) && current && !current.contractor) {
      const contractorMatch = line.match(/(?:落札|受注|施工)[：:]\s*(.+)/);
      if (contractorMatch) {
        current.contractor = contractorMatch[1].trim();
      } else {
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

  if (current && current.price >= KENTSU_CONFIG.MIN_PRICE) {
    cases.push(current);
  }
  return cases;
}

/***** 案件データ管理 *****/
function getPendingCases() {
  const data = getProperty(KENTSU_CONFIG.STORAGE_KEY);
  return data ? parseJsonSafe(data, []) : [];
}

function savePendingCases(cases) {
  setProperty(KENTSU_CONFIG.STORAGE_KEY, JSON.stringify(cases));
}

function getNewCases() {
  return getPendingCases();
}

function clearAllCases() {
  savePendingCases([]);
  showAlert('新着案件を全てクリアしました');
  return { success: true };
}

/***** 案件登録 *****/
function registerCase(index) {
  const cases = getPendingCases();
  if (index < 0 || index >= cases.length) {
    throw new Error('無効なインデックス');
  }

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

/***** トリガー管理 *****/
function setupKentsuEmailTrigger() {
  removeTriggersByFunction('checkKentsuEmails');

  ScriptApp.newTrigger('checkKentsuEmails')
    .timeBased()
    .everyMinutes(KENTSU_CONFIG.CHECK_INTERVAL_MINUTES)
    .create();

  showAlert('✅ メール監視を開始しました!\n\nマップの左サイドバーで新着案件を確認できます。');
}

function removeKentsuEmailTrigger() {
  const removed = removeTriggersByFunction('checkKentsuEmails');
  showAlert(removed > 0 ? '✅ 監視を停止しました' : 'ℹ️ 監視は設定されていません');
}

/***** テスト機能 *****/
function testKentsuEmailParsing() {
  const threads = GmailApp.search(`from:${KENTSU_CONFIG.EMAIL_FROM}`, 0, 1);
  if (threads.length === 0) {
    showAlert(
      'メールが見つかりません\n\n' +
      'media@kentsu.co.jpからのメールがGmailに届いているか確認してください。'
    );
    return;
  }
  const cases = parseKentsuEmail(threads[0].getMessages()[0]);
  showAlert(
    `${cases.length}件の案件を抽出しました\n\n` +
    '詳細は「拡張機能」→「Apps Script」→「実行数」で確認してください。'
  );
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
  showAlert('テストデータを追加しました!\n\nマップを開いて左サイドバーを確認してください。');
}

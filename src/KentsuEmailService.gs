/**
 * 建通新聞メール監視サービス
 * Gmailから建通新聞のメールを監視し、案件情報を抽出
 */

/**
 * 建通新聞メールをチェック
 */
function checkKentsuEmails() {
  try {
    const lastCheck = getLastCheckTimestamp();
    const threads = GmailApp.search(
      `from:${KENTSU_CONFIG.EMAIL_FROM} subject:"${KENTSU_CONFIG.EMAIL_SUBJECT_KEYWORD}" after:${lastCheck}`,
      0,
      10
    );

    if (threads.length === 0) return;

    const cases = getPendingCases();

    // 各スレッドのメッセージを処理
    threads.forEach(thread => {
      thread.getMessages().forEach(message => {
        const newCases = parseKentsuEmail(message);
        newCases.forEach(newCase => {
          // 重複チェック
          if (!isDuplicateCase(cases, newCase)) {
            cases.push(newCase);
          }
        });
      });
    });

    savePendingCases(cases);
    updateLastCheckTimestamp();

  } catch (error) {
    Logger.log(`checkKentsuEmails Error: ${error}`);
  }
}

/**
 * 建通新聞メールをパース
 * @param {GmailMessage} message - Gmailメッセージ
 * @return {Array} 抽出された案件配列
 */
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
      if (match) {
        current.address = match[1].trim();
      }
      const nameMatch = line.match(/^▽([^（]+)/);
      if (nameMatch && !current.projectName) {
        current.projectName = nameMatch[1].trim();
      }
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
            if (price > current.price) {
              current.price = price;
            }
          }
        });
      }
    }
    // URLを抽出
    else if ((line.startsWith('http://') || line.startsWith('https://')) && current && !current.url) {
      current.url = line.trim();
    }
  });

  // 最後の案件を追加
  if (current && current.price >= KENTSU_CONFIG.MIN_PRICE) {
    cases.push(current);
  }

  return cases;
}

/**
 * 案件が重複しているかチェック
 * @param {Array} cases - 既存の案件配列
 * @param {Object} newCase - 新しい案件
 * @return {boolean} 重複していればtrue
 */
function isDuplicateCase(cases, newCase) {
  return cases.some(existingCase =>
    existingCase.projectName === newCase.projectName &&
    existingCase.address === newCase.address
  );
}

/**
 * 保留中の案件を取得
 * @return {Array} 案件配列
 */
function getPendingCases() {
  const data = PropertiesService.getScriptProperties().getProperty(KENTSU_CONFIG.STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * 保留中の案件を保存
 * @param {Array} cases - 案件配列
 */
function savePendingCases(cases) {
  PropertiesService.getScriptProperties().setProperty(
    KENTSU_CONFIG.STORAGE_KEY,
    JSON.stringify(cases)
  );
}

/**
 * 新着案件を取得（API用）
 * @return {Array} 案件配列
 */
function getNewCases() {
  return getPendingCases();
}

/**
 * 案件を登録（シートに追加）
 * @param {number} index - 案件のインデックス
 * @return {Object} 処理結果
 */
function registerCase(index) {
  const cases = getPendingCases();

  if (index < 0 || index >= cases.length) {
    throw new Error('無効なインデックス');
  }

  const targetCase = cases[index];
  const sheet = getTargetSheet();
  const row = sheet.getLastRow() + 1;

  // シートに追加
  updateCell(sheet, row, CONFIG.COLUMNS.COMPANY, targetCase.projectName);
  updateCell(sheet, row, CONFIG.COLUMNS.ADDRESS, targetCase.address);
  updateCell(
    sheet,
    row,
    CONFIG.COLUMNS.MEMO,
    `発注者: ${targetCase.client}\n落札価格: ${targetCase.price.toLocaleString()}円`
  );
  updateCell(sheet, row, CONFIG.COLUMNS.KUBUN, '現場');

  // 座標を取得
  const coords = getCoordinatesFromAddress(targetCase.address);
  if (coords) {
    updateCell(sheet, row, CONFIG.COLUMNS.LAT, coords.lat);
    updateCell(sheet, row, CONFIG.COLUMNS.LNG, coords.lng);
  }

  // 登録済み案件を削除
  cases.splice(index, 1);
  savePendingCases(cases);

  return {
    success: true,
    row: row,
    remaining: cases.length
  };
}

/**
 * 全案件をクリア
 * @return {Object} 処理結果
 */
function clearAllCases() {
  savePendingCases([]);
  SpreadsheetApp.getUi().alert('新着案件を全てクリアしました');
  return { success: true };
}

/**
 * テストケースを追加
 */
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
  SpreadsheetApp.getUi().alert(
    'テストデータを追加しました!\n\nマップを開いて左サイドバーを確認してください。'
  );
}

/**
 * メールパーステストを実行
 */
function testKentsuEmailParsing() {
  const threads = GmailApp.search(`from:${KENTSU_CONFIG.EMAIL_FROM}`, 0, 1);

  if (threads.length === 0) {
    SpreadsheetApp.getUi().alert(
      'メールが見つかりません\n\nmedia@kentsu.co.jpからのメールがGmailに届いているか確認してください。'
    );
    return;
  }

  const cases = parseKentsuEmail(threads[0].getMessages()[0]);
  SpreadsheetApp.getUi().alert(
    `${cases.length}件の案件を抽出しました\n\n詳細は「拡張機能」→「Apps Script」→「実行数」で確認してください。`
  );
}

/**
 * 最終チェック時刻を取得
 * @return {number} Unixタイムスタンプ（秒）
 */
function getLastCheckTimestamp() {
  const lastCheck = PropertiesService.getScriptProperties().getProperty('kentsu_last_check');
  return lastCheck || Math.floor((Date.now() - 86400000) / 1000); // デフォルトは24時間前
}

/**
 * 最終チェック時刻を更新
 */
function updateLastCheckTimestamp() {
  PropertiesService.getScriptProperties().setProperty(
    'kentsu_last_check',
    Math.floor(Date.now() / 1000).toString()
  );
}

/**
 * MapService.gs
 * マップデータ取得・管理サービス
 */

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

    const visitHistory = parseJsonSafe(visitHistoryStr, []);

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

/***** 重複チェック付きマップデータ取得 *****/
function getMapDataWithDuplicates() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  const data = [];
  const companyMap = {};

  // 自分のデータを収集
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

    const visitHistory = parseJsonSafe(visitHistoryStr, []);

    if (company && lat && lng) {
      const locationData = {
        company: company,
        address: address,
        memo: memo,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        website: website,
        kubun: kubun,
        visitHistory: visitHistory,
        sansanUrl: sansanUrl,
        row: row,
        registeredBy: '自分',
        duplicates: []
      };

      data.push(locationData);

      // 会社名の正規化
      const normalizedCompany = normalizeCompanyNameForDuplicate(company);
      if (!companyMap[normalizedCompany]) {
        companyMap[normalizedCompany] = [];
      }
      companyMap[normalizedCompany].push({
        salesman: '自分',
        data: locationData
      });
    }
  }

  // 他の営業マンのデータを取得
  const salesmanList = getSalesmanList();
  salesmanList.forEach(salesman => {
    if (!salesman.isSelf && salesman.url) {
      try {
        const otherData = fetchOtherSalesmanCompanies(salesman.url);
        otherData.forEach(otherCompany => {
          const normalizedCompany = normalizeCompanyNameForDuplicate(otherCompany.company);
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

  // 重複チェック
  data.forEach(loc => {
    const normalizedCompany = normalizeCompanyNameForDuplicate(loc.company);
    const duplicateEntries = companyMap[normalizedCompany] || [];

    if (duplicateEntries.length > 1) {
      // 自分以外の営業マンを抽出
      loc.duplicates = duplicateEntries
        .filter(entry => entry.salesman !== '自分')
        .map(entry => entry.salesman);
    }
  });

  return data;
}

function fetchOtherSalesmanCompanies(url) {
  try {
    if (!url || url === '') {
      return [];
    }

    const fullUrl = url + '?mode=data';
    const response = UrlFetchApp.fetch(fullUrl, {
      muteHttpExceptions: true,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log(`データ取得失敗: ${responseCode}`);
      return [];
    }

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

/***** 訪問履歴 *****/
function addVisitRecord(row, visitDate, note) {
  const sheet = getTargetSheet();
  const visitHistoryCell = sheet.getRange(row, CONFIG.COLUMNS.VISIT_HISTORY);
  const currentHistory = visitHistoryCell.getValue();

  let history = [];
  if (currentHistory) {
    history = parseJsonSafe(currentHistory, []);
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

/***** 削除機能 *****/
function deleteLocation(row) {
  try {
    const sheet = getTargetSheet();
    if (!sheet) {
      throw new Error('シートが見つかりません');
    }

    if (row < 2) {
      throw new Error('ヘッダー行は削除できません');
    }

    const lastRow = sheet.getLastRow();
    if (row > lastRow) {
      throw new Error('指定された行が存在しません');
    }

    sheet.deleteRow(row);

    return {
      success: true,
      message: '削除しました'
    };

  } catch (error) {
    Logger.log('削除エラー:', error);
    return {
      success: false,
      message: 'エラー: ' + error.message
    };
  }
}

/***** 月次統計 *****/
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
        const visitHistory = parseJsonSafe(visitHistoryStr, []);

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

/***** 目標件数 *****/
function setMonthlyTargetGoal(goal) {
  const now = new Date();
  const key = `target_${now.getFullYear()}_${now.getMonth() + 1}`;
  setProperty(key, goal.toString());
  return goal;
}

function getMonthlyTargetGoal() {
  const now = new Date();
  const key = `target_${now.getFullYear()}_${now.getMonth() + 1}`;
  const value = getProperty(key);
  return value ? parseInt(value) : 0;
}

/***** 営業マン一覧 *****/
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

/***** スプレッドシートURL *****/
function getSpreadsheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}

/**
 * シート操作サービス
 * スプレッドシートのデータ取得・更新を管理
 */

/**
 * 行データを取得
 * @param {Sheet} sheet - 対象シート
 * @param {number} row - 行番号
 * @return {Object} 行データオブジェクト
 */
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
    hasAddress: address !== '' && address !== '住所取得失敗',
    hasWebsite: website !== '',
    hasCoordinates: lat !== '' && lng !== '',
    hasSansanUrl: sansanUrl !== ''
  };
}

/**
 * 行を補完（住所、座標、Webサイトなどを自動取得）
 * @param {Sheet} sheet - 対象シート
 * @param {number} row - 行番号
 */
function enrichRow(sheet, row) {
  try {
    const rowData = getRowData(sheet, row);
    if (!rowData.company) return;

    const query = buildSearchQuery(rowData.company);
    let coordinates = null;
    let addressWasSet = false;

    // 住所が未設定の場合、取得する
    if (!rowData.hasAddress) {
      const result = geocodeAddressWithCoords(query);
      if (result.address) {
        let finalAddress = result.address;

        // 英語住所の場合、日本語に変換
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

    // 座標が未設定の場合、取得する
    if (!rowData.hasCoordinates) {
      if (!coordinates && rowData.hasAddress) {
        coordinates = getCoordinatesFromAddress(rowData.address);
      }
      if (coordinates) {
        updateCell(sheet, row, CONFIG.COLUMNS.LAT, coordinates.lat);
        updateCell(sheet, row, CONFIG.COLUMNS.LNG, coordinates.lng);
      }
    }

    // Webサイトが未設定の場合、検索URLを設定
    if (!rowData.hasWebsite) {
      updateCell(sheet, row, CONFIG.COLUMNS.WEBSITE, buildGoogleSearchUrl(rowData.company));
    }

    // 住所が新規設定された場合、会社名をクリーンアップ
    if (addressWasSet) {
      sleep(100);
      cleanCompanyName(sheet, row);
    }
  } catch (err) {
    Logger.log(`enrichRow error (row ${row}): ${err}`);
  }
}

/**
 * 複数行を処理
 * @param {Sheet} sheet - 対象シート
 * @param {number} startRow - 開始行
 * @param {number} endRow - 終了行
 */
function processRows(sheet, startRow, endRow) {
  for (let row = startRow; row <= endRow; row++) {
    if (row === 1) continue; // ヘッダー行をスキップ
    enrichRow(sheet, row);
    sleep();
  }
}

/**
 * 会社名をクリーンアップ
 * @param {Sheet} sheet - 対象シート
 * @param {number} row - 行番号
 * @return {string} 処理結果 ('cleaned', 'skipped', 'error')
 */
function cleanCompanyName(sheet, row) {
  try {
    const companyCell = sheet.getRange(row, CONFIG.COLUMNS.COMPANY);
    const currentCompany = String(companyCell.getValue() || '').trim();
    const address = getCellValue(sheet, row, CONFIG.COLUMNS.ADDRESS);

    // 住所が無効な場合はスキップ
    if (!address || address === '住所取得失敗' || address === '住所') {
      return 'skipped';
    }

    if (!currentCompany) {
      return 'skipped';
    }

    const cleanedCompany = removeUnnecessaryInfo(currentCompany, address);

    // 変更があった場合のみ更新
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

/**
 * 住所を日本語に変換
 * @param {Sheet} sheet - 対象シート
 * @param {number} row - 行番号
 * @return {string} 処理結果 ('converted', 'skipped', 'failed', 'error', 'empty')
 */
function convertAddressToJapanese(sheet, row) {
  try {
    const addressCell = sheet.getRange(row, CONFIG.COLUMNS.ADDRESS);
    const currentAddress = String(addressCell.getValue() || '').trim();

    if (!currentAddress || currentAddress === '住所取得失敗') {
      return 'empty';
    }

    // 既に日本語の場合はスキップ
    if (isJapaneseAddress(currentAddress)) {
      return 'skipped';
    }

    const result = convertEnglishToJapaneseAddress(currentAddress);

    if (result.address && result.address !== currentAddress) {
      addressCell.setValue(result.address);

      // 座標も更新
      if (result.coordinates) {
        updateCell(sheet, row, CONFIG.COLUMNS.LAT, result.coordinates.lat);
        updateCell(sheet, row, CONFIG.COLUMNS.LNG, result.coordinates.lng);
      }

      Logger.log(`Row ${row}: ${currentAddress} → ${result.address}`);

      // 会社名をクリーンアップ
      sleep(100);
      cleanCompanyName(sheet, row);

      return 'converted';
    }

    return 'failed';
  } catch (err) {
    Logger.log(`convertAddressToJapanese error (row ${row}): ${err}`);
    return 'error';
  }
}

/**
 * 訪問履歴を追加
 * @param {number} row - 行番号
 * @param {string} visitDate - 訪問日
 * @param {string} note - メモ
 * @return {Array} 更新後の訪問履歴
 */
function addVisitRecord(row, visitDate, note) {
  const sheet = getTargetSheet();
  const visitHistoryCell = sheet.getRange(row, CONFIG.COLUMNS.VISIT_HISTORY);
  const currentHistory = visitHistoryCell.getValue();

  let history = safeJsonParse(currentHistory, []);

  history.push({
    date: visitDate,
    note: note,
    timestamp: new Date().toISOString()
  });

  visitHistoryCell.setValue(JSON.stringify(history));
  return history;
}

/**
 * 区分を更新
 * @param {number} row - 行番号
 * @param {string} newKubun - 新しい区分
 * @return {string} 設定された区分
 */
function updateKubun(row, newKubun) {
  const sheet = getTargetSheet();
  updateCell(sheet, row, CONFIG.COLUMNS.KUBUN, newKubun);
  return newKubun;
}

/**
 * マップ表示用のデータを取得
 * @return {Array} マップデータの配列
 */
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

    const visitHistory = safeJsonParse(visitHistoryStr, []);

    // 会社名と座標が両方ある場合のみ追加
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

/**
 * 月次統計を取得
 * @return {Object} 統計データ
 */
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
        const visitHistory = safeJsonParse(visitHistoryStr, []);

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

/**
 * 月次目標を設定
 * @param {number} goal - 目標件数
 * @return {number} 設定された目標
 */
function setMonthlyTargetGoal(goal) {
  const properties = PropertiesService.getScriptProperties();
  const now = new Date();
  const key = `target_${now.getFullYear()}_${now.getMonth() + 1}`;
  properties.setProperty(key, goal.toString());
  return goal;
}

/**
 * 月次目標を取得
 * @return {number} 目標件数
 */
function getMonthlyTargetGoal() {
  const properties = PropertiesService.getScriptProperties();
  const now = new Date();
  const key = `target_${now.getFullYear()}_${now.getMonth() + 1}`;
  const value = properties.getProperty(key);
  return value ? parseInt(value) : 0;
}

/**
 * 営業マン一覧を取得
 * @return {Array} 営業マンリスト
 */
function getSalesmanList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SALESMAN_CONFIG_SHEET);

  if (!sheet) {
    return [{
      name: '自分',
      url: getWebAppUrl(),
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

  // 自分を先頭に追加
  salesmen.unshift({
    name: '自分',
    url: getWebAppUrl(),
    isSelf: true
  });

  return salesmen;
}

/**
 * 住所から座標を自動更新
 * @param {Sheet} sheet - 対象シート
 * @param {number} row - 行番号
 * @param {string} address - 住所
 */
function updateCoordinatesFromAddress(sheet, row, address) {
  const lat = getCellValue(sheet, row, CONFIG.COLUMNS.LAT);
  const lng = getCellValue(sheet, row, CONFIG.COLUMNS.LNG);

  // 座標が既に存在する場合はスキップ
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

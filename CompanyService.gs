/**
 * CompanyService.gs
 * 会社名クリーンアップサービス
 */

/***** 会社名クリーンアップ *****/
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

  showAlert(
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

  showAlert(
    '全会社名のクリーンアップが完了しました\n\n' +
    `クリーンアップ: ${cleaned}件\n` +
    `スキップ(変更なし): ${skipped}件`
  );
}

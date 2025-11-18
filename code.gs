/**
 * 削除機能 - スプレッドシートから指定行を削除
 */
function deleteLocation(row) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('フォームの回答 1');
    if (!sheet) {
      throw new Error('シートが見つかりません');
    }

    // 行番号の検証（ヘッダー行は削除できない）
    if (row < 2) {
      throw new Error('ヘッダー行は削除できません');
    }

    // シートの最終行を確認
    const lastRow = sheet.getLastRow();
    if (row > lastRow) {
      throw new Error('指定された行が存在しません');
    }

    // 行を削除
    sheet.deleteRow(row);

    return {
      success: true,
      message: '削除しました'
    };

  } catch (error) {
    console.error('削除エラー:', error);
    return {
      success: false,
      message: 'エラー: ' + error.message
    };
  }
}

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
    '会社名(B列)を入力すると、自動的に住所が取得されます。\n\n' +
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

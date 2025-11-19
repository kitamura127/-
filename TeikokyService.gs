/**
 * TeikokyService.gs
 * 帝国データバンクPDF検索サービス
 */

/***** PDF検索 *****/
function findTeikokyPDF(companyName) {
  try {
    Logger.log(`=== PDF検索開始 ===`);
    Logger.log(`元の会社名: ${companyName}`);

    const cleanName = cleanCompanyNameForSearch(companyName);
    Logger.log(`クリーンアップ後: ${cleanName}`);
    Logger.log(`フォルダID: ${CONFIG.TEIKOKU_FOLDER_ID}`);

    const files = searchPDFFiles(cleanName);

    if (files.hasNext()) {
      const file = files.next();
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
    return { found: false };

  } catch (error) {
    Logger.log(`❌ findTeikokyPDF error: ${error}`);
    Logger.log(`エラースタック: ${error.stack}`);
    return {
      found: false,
      error: error.message
    };
  }
}

/***** 会社名クリーンアップ（検索用）*****/
function cleanCompanyNameForSearch(companyName) {
  return companyName
    .replace(COMPANY_PATTERNS.LEGAL_FORMS, '')
    .replace(/\s+/g, '')
    .trim();
}

/***** PDFファイル検索 *****/
function searchPDFFiles(cleanName) {
  if (CONFIG.TEIKOKU_FOLDER_ID && CONFIG.TEIKOKU_FOLDER_ID !== '') {
    try {
      const folder = DriveApp.getFolderById(CONFIG.TEIKOKU_FOLDER_ID);
      Logger.log(`検索フォルダ: ${folder.getName()}`);

      // デバッグ: フォルダ内のPDFカウント
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

      return folder.searchFiles(`title contains "${cleanName}"`);

    } catch (e) {
      Logger.log(`フォルダ検索エラー: ${e.message}`);
      Logger.log(`エラー詳細: ${e.stack}`);
      // フォルダが見つからない場合は全体を検索
      return DriveApp.searchFiles(`mimeType = "application/pdf" and title contains "${cleanName}"`);
    }
  } else {
    Logger.log(`フォルダID未設定 - 全体検索`);
    return DriveApp.searchFiles(`mimeType = "application/pdf" and title contains "${cleanName}"`);
  }
}

/***** フォルダ設定 *****/
function setupTeikokyFolder() {
  const ui = SpreadsheetApp.getUi();
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

      try {
        const folder = DriveApp.getFolderById(folderId);
        showAlert(
          '✅ フォルダを設定しました!\n\n' +
          `フォルダ名: ${folder.getName()}\n` +
          `フォルダID: ${folderId}\n\n` +
          '※この設定を永続化するには、Config.gs の CONFIG.TEIKOKU_FOLDER_ID を編集してください。'
        );

        setProperty('TEIKOKU_FOLDER_ID', folderId);

      } catch (e) {
        showAlert('❌ エラー: フォルダが見つかりません。\nフォルダIDまたはURLを確認してください。');
      }
    }
  }
}

/***** テスト関数 *****/
function testDriveAccessSimple() {
  try {
    Logger.log('========================================');
    Logger.log('=== シンプルドライブアクセステスト ===');
    Logger.log('========================================');
    Logger.log(`フォルダID: ${CONFIG.TEIKOKU_FOLDER_ID}`);
    Logger.log('');

    const folder = DriveApp.getFolderById(CONFIG.TEIKOKU_FOLDER_ID);
    Logger.log(`✅ フォルダアクセス成功!`);
    Logger.log(`フォルダ名: ${folder.getName()}`);
    Logger.log('');

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

    throw error;
  }
}

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

    try {
      showAlert(
        `✅ テスト完了\n\n` +
        `フォルダ名: ${folder.getName()}\n` +
        `PDFファイル数: ${count}件\n\n` +
        `詳細は「拡張機能」→「Apps Script」→「実行数」で確認してください。`
      );
    } catch (e) {
      Logger.log('✅ テスト完了（UIなし）');
    }

  } catch (error) {
    Logger.log(`❌ エラー: ${error}`);
    Logger.log(`スタック: ${error.stack}`);

    try {
      showAlert(`❌ エラー:\n${error.message}`);
    } catch (e) {
      Logger.log('❌ エラー（UIなし）');
    }

    throw error;
  }
}

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

/**
 * IntelligenceService.gs
 * 営業インテリジェンス - Gemini AIを使った営業情報分析
 */

/***** API設定 *****/
function setupGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const currentKey = getProperty('GEMINI_API_KEY');

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
      setProperty('GEMINI_API_KEY', apiKey);
      showAlert('✅ APIキーを設定しました!');
    }
  }
}

/***** データ収集 *****/
function collectAllSalesmenData() {
  const salesmenList = getSalesmanList();
  const allData = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - INTELLIGENCE_CONFIG.DAYS_TO_ANALYZE);

  // 自分のデータ
  const selfData = collectOwnData(cutoffDate);
  allData.push({
    salesman: '自分',
    data: selfData
  });
  Logger.log(`自分: ${selfData.length}件`);

  // 他の営業マンのデータ
  salesmenList.forEach(salesman => {
    if (!salesman.isSelf && salesman.url) {
      try {
        Logger.log(`${salesman.name}のデータを取得中...`);
        const data = collectOtherSalesmanData(salesman.url, cutoffDate);
        if (data.length > 0) {
          allData.push({
            salesman: salesman.name,
            data: data
          });
          Logger.log(`${salesman.name}: ${data.length}件取得成功`);
        } else {
          Logger.log(`${salesman.name}: データなし`);
        }
      } catch (error) {
        Logger.log(`${salesman.name}のデータ収集をスキップ(エラー: ${error.message})`);
      }
    }
  });

  return allData;
}

function collectOwnData(cutoffDate) {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  const recentUpdates = [];

  for (let row = 2; row <= lastRow; row++) {
    const company = getCellValue(sheet, row, CONFIG.COLUMNS.COMPANY);
    const memo = getCellValue(sheet, row, CONFIG.COLUMNS.MEMO);
    const visitHistoryStr = getCellValue(sheet, row, CONFIG.COLUMNS.VISIT_HISTORY);
    const kubun = getCellValue(sheet, row, CONFIG.COLUMNS.KUBUN);

    if (visitHistoryStr) {
      try {
        const visitHistory = parseJsonSafe(visitHistoryStr, []);
        visitHistory.forEach(visit => {
          const visitDate = new Date(visit.date);
          if (visitDate >= cutoffDate && visit.note) {
            recentUpdates.push({
              company: company,
              date: visit.date,
              note: visit.note,
              kubun: kubun,
              memo: memo
            });
          }
        });
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  return recentUpdates;
}

function collectOtherSalesmanData(url, cutoffDate) {
  try {
    if (!url || url === '') {
      Logger.log('URLが空です');
      return [];
    }

    const fullUrl = url + '?mode=data';
    Logger.log(`データ取得URL: ${fullUrl}`);

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
    const recentUpdates = [];

    data.forEach(loc => {
      if (loc.visitHistory && loc.visitHistory.length > 0) {
        loc.visitHistory.forEach(visit => {
          const visitDate = new Date(visit.date);
          if (visitDate >= cutoffDate && visit.note) {
            recentUpdates.push({
              company: loc.company,
              date: visit.date,
              note: visit.note,
              kubun: loc.kubun,
              memo: loc.memo
            });
          }
        });
      }
    });

    Logger.log(`${recentUpdates.length}件の最近の更新を取得`);
    return recentUpdates;
  } catch (error) {
    Logger.log(`データ取得エラー: ${error.toString()}`);
    return [];
  }
}

/***** Gemini AI分析 *****/
function analyzeWithGemini(allSalesmenData) {
  const apiKey = getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。「営業インテリジェンス」→「API設定」から設定してください。');
  }

  // 分析用テキスト作成
  let analysisText = '';
  let recordCount = 0;
  const maxRecords = 200;

  for (const salesmanData of allSalesmenData) {
    if (salesmanData.data.length > 0) {
      analysisText += `【${salesmanData.salesman}の記録】\n`;
      for (const record of salesmanData.data) {
        if (recordCount >= maxRecords) break;
        const dateStr = record.date.substring(0, 10);
        const note = record.note.substring(0, 100);
        analysisText += `${record.company}(${dateStr}): ${note}\n`;
        recordCount++;
      }
      analysisText += '\n';
      if (recordCount >= maxRecords) break;
    }
  }

  if (analysisText.trim() === '') {
    return { urgent_opportunities: [] };
  }

  const prompt = buildAnalysisPrompt(analysisText);
  const payload = buildGeminiPayload(prompt);

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    Logger.log(`Response Code: ${responseCode}`);

    if (responseCode !== 200) {
      Logger.log(`Error Response: ${responseText.substring(0, 500)}`);
      throw new Error(`APIエラー (${responseCode})`);
    }

    return parseGeminiResponse(responseText);

  } catch (error) {
    Logger.log(`=== Error Details ===`);
    Logger.log(`Error: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);

    if (error.toString().includes('DNS') || error.toString().includes('connection')) {
      throw new Error('ネットワークエラー: インターネット接続を確認してください');
    }

    throw error;
  }
}

function buildAnalysisPrompt(analysisText) {
  return `あなたは作業員派遣会社の営業分析AIです。
以下の営業記録から、ビジネスチャンスを5件以内で抽出してください。

入力形式: 「訪問先会社名(日付): 訪問メモ」

${analysisText}

以下の情報を優先:
- 「忙しい」「人手不足」「急募」などの繁忙情報
- 着工予定、新規物件の情報
- 見積もり依頼、商談中の案件

**重要**:
- "source_company"には、情報を聞いた会社名（訪問先の会社名）を入れてください
- "detail"には、どこが忙しいか、何の情報かなどの具体的な内容を入れてください

必ず以下のJSON形式のみで回答してください。他の文章は一切含めないでください:

{
  "urgent_opportunities": [
    {
      "type": "繁忙情報",
      "source_company": "訪問先の会社名（情報を聞いた会社）",
      "summary": "20文字以内の要約",
      "detail": "50文字以内の詳細（どこが忙しいかなど具体的な内容）",
      "source_salesman": "営業マン名",
      "date": "2025-11-06",
      "priority": "高"
    }
  ]
}`;
}

function buildGeminiPayload(prompt) {
  return {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.2,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 1024,
      stopSequences: []
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };
}

function parseGeminiResponse(responseText) {
  const result = JSON.parse(responseText);

  if (result.error) {
    Logger.log(`API Error: ${JSON.stringify(result.error)}`);
    throw new Error(`APIエラー: ${result.error.message || 'Unknown error'}`);
  }

  if (result.promptFeedback && result.promptFeedback.blockReason) {
    Logger.log(`Blocked: ${result.promptFeedback.blockReason}`);
    throw new Error(`リクエストがブロックされました: ${result.promptFeedback.blockReason}`);
  }

  if (!result.candidates || result.candidates.length === 0) {
    Logger.log('No candidates in response');
    throw new Error('AIからの応答がありません');
  }

  const candidate = result.candidates[0];

  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    Logger.log('No content in candidate');
    throw new Error('AIの応答内容が空です');
  }

  let aiResponseText = candidate.content.parts[0].text;
  Logger.log(`AI Response (first 500 chars): ${aiResponseText.substring(0, 500)}`);

  // JSONを抽出
  aiResponseText = aiResponseText.trim()
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '');

  const jsonStart = aiResponseText.indexOf('{');
  const jsonEnd = aiResponseText.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1) {
    aiResponseText = aiResponseText.substring(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(aiResponseText);

    if (!parsed.urgent_opportunities || !Array.isArray(parsed.urgent_opportunities)) {
      Logger.log('Invalid data structure');
      return { urgent_opportunities: [] };
    }

    Logger.log(`Parsed ${parsed.urgent_opportunities.length} opportunities`);
    return parsed;

  } catch (parseError) {
    Logger.log(`JSON Parse Error: ${parseError.message}`);
    Logger.log(`Failed to parse: ${aiResponseText.substring(0, 500)}`);
    return { urgent_opportunities: [] };
  }
}

/***** インサイト管理 *****/
function saveIntelligenceInsights(insights) {
  const data = {
    insights: insights,
    timestamp: new Date().toISOString()
  };
  setProperty(INTELLIGENCE_CONFIG.STORAGE_KEY, JSON.stringify(data));
}

function getIntelligenceInsights() {
  const data = getProperty(INTELLIGENCE_CONFIG.STORAGE_KEY);
  return data ? parseJsonSafe(data) : null;
}

function clearIntelligenceCache() {
  deleteProperty(INTELLIGENCE_CONFIG.STORAGE_KEY);
  showToast('キャッシュをクリアしました', '✅ 完了');
}

/***** 自動分析実行 *****/
function runIntelligenceAnalysis() {
  try {
    Logger.log('=== 自動分析開始 ===');
    Logger.log(`実行時刻: ${new Date().toLocaleString('ja-JP')}`);

    const allData = collectAllSalesmenData();

    if (allData.every(d => d.data.length === 0)) {
      Logger.log('分析対象データなし - 終了');
      return;
    }

    allData.forEach(salesmanData => {
      Logger.log(`${salesmanData.salesman}: ${salesmanData.data.length}件`);
    });

    const insights = analyzeWithGemini(allData);
    saveIntelligenceInsights(insights);

    Logger.log('✅ 自動分析完了');
    Logger.log(`検出された重要情報: ${insights.urgent_opportunities?.length || 0}件`);

    if (insights.urgent_opportunities && insights.urgent_opportunities.length > 0) {
      const highPriorityCount = insights.urgent_opportunities.filter(opp => opp.priority === '高').length;

      if (highPriorityCount > 0) {
        showToast(
          `優先度【高】が${highPriorityCount}件見つかりました！マップで確認してください。`,
          '🔥 重要な営業情報を検出',
          15
        );
      } else {
        showToast(
          `${insights.urgent_opportunities.length}件の営業情報を更新しました`,
          '✅ 営業インテリジェンス更新',
          8
        );
      }
    }

  } catch (error) {
    Logger.log(`=== 自動分析エラー ===`);
    Logger.log(`エラー: ${error.toString()}`);
    Logger.log(`スタック: ${error.stack}`);
  }
}

/***** トリガー管理 *****/
function setupIntelligenceTrigger() {
  removeTriggersByFunction('runIntelligenceAnalysis');

  ScriptApp.newTrigger('runIntelligenceAnalysis')
    .timeBased()
    .everyHours(12)
    .create();

  showToast(
    '12時間ごとに自動で営業情報を分析します。\nマップで最新のインサイトを確認できます。',
    '✅ 自動分析を設定しました',
    8
  );
}

function removeIntelligenceTrigger() {
  const removed = removeTriggersByFunction('runIntelligenceAnalysis');

  if (removed > 0) {
    showToast('自動分析を停止しました', '✅ 停止完了');
  } else {
    showToast('自動分析は設定されていません', 'ℹ️ 情報');
  }
}

/***** 利用可能モデル確認 *****/
function checkAvailableGeminiModels() {
  const apiKey = getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    showAlert('❌ APIキーが設定されていません。\n「営業インテリジェンス」→「API設定」から設定してください。');
    return;
  }

  try {
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'get',
        muteHttpExceptions: true
      }
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
        showAlert(modelList + '\n詳細はログを確認してください。\n「拡張機能」→「Apps Script」→「実行数」');
      } else {
        showAlert('モデル情報が取得できませんでした。');
      }
    } else {
      showAlert(`❌ エラー (${responseCode}):\n${responseText}`);
    }

  } catch (error) {
    Logger.log(`エラー: ${error}`);
    showAlert(`❌ エラー:\n${error.message}`);
  }
}

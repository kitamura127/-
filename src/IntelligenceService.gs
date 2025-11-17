/**
 * 営業インテリジェンスサービス
 * Gemini APIを使用した営業データ分析
 */

/**
 * 全営業マンのデータを収集
 * @return {Array} 営業マンごとのデータ配列
 */
function collectAllSalesmenData() {
  const salesmenList = getSalesmanList();
  const allData = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - INTELLIGENCE_CONFIG.DAYS_TO_ANALYZE);

  // 自分のデータを収集
  const selfData = collectOwnData(cutoffDate);
  allData.push({
    salesman: '自分',
    data: selfData
  });

  Logger.log(`自分: ${selfData.length}件`);

  // 他の営業マンのデータを収集
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

/**
 * 自分のデータを収集
 * @param {Date} cutoffDate - 収集開始日
 * @return {Array} データ配列
 */
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
      const visitHistory = safeJsonParse(visitHistoryStr, []);
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
    }
  }

  return recentUpdates;
}

/**
 * 他の営業マンのデータを収集
 * @param {string} url - 営業マンのWebアプリURL
 * @param {Date} cutoffDate - 収集開始日
 * @return {Array} データ配列
 */
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
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
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

/**
 * Gemini APIで営業データを分析
 * @param {Array} allSalesmenData - 全営業マンのデータ
 * @return {Object} 分析結果
 */
function analyzeWithGemini(allSalesmenData) {
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。「営業インテリジェンス」→「API設定」から設定してください。');
  }

  // 分析テキストを構築
  let analysisText = '';
  let recordCount = 0;

  for (const salesmanData of allSalesmenData) {
    if (salesmanData.data.length > 0) {
      analysisText += `【${salesmanData.salesman}の記録】\n`;
      for (const record of salesmanData.data) {
        if (recordCount >= INTELLIGENCE_CONFIG.MAX_RECORDS_PER_ANALYSIS) break;
        const dateStr = record.date.substring(0, 10);
        const note = record.note.substring(0, 100);
        analysisText += `${record.company}(${dateStr}): ${note}\n`;
        recordCount++;
      }
      analysisText += '\n';
      if (recordCount >= INTELLIGENCE_CONFIG.MAX_RECORDS_PER_ANALYSIS) break;
    }
  }

  if (analysisText.trim() === '') {
    return {
      urgent_opportunities: []
    };
  }

  const prompt = buildAnalysisPrompt(analysisText);
  const payload = buildGeminiPayload(prompt);

  return callGeminiApi(apiKey, payload);
}

/**
 * 分析プロンプトを構築
 * @param {string} analysisText - 分析対象のテキスト
 * @return {string} プロンプト
 */
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

/**
 * Gemini APIリクエストペイロードを構築
 * @param {string} prompt - プロンプト
 * @return {Object} ペイロード
 */
function buildGeminiPayload(prompt) {
  return {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: INTELLIGENCE_CONFIG.GENERATION_CONFIG,
    safetySettings: INTELLIGENCE_CONFIG.SAFETY_SETTINGS
  };
}

/**
 * Gemini APIを呼び出し
 * @param {string} apiKey - APIキー
 * @param {Object} payload - リクエストペイロード
 * @return {Object} 分析結果
 */
function callGeminiApi(apiKey, payload) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  };

  try {
    const apiUrl = `${INTELLIGENCE_CONFIG.GEMINI_ENDPOINT}?key=${apiKey}`;

    Logger.log('APIリクエスト送信中...');
    const response = UrlFetchApp.fetch(apiUrl, options);
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
    throw new Error(formatErrorMessage(error));
  }
}

/**
 * Gemini APIレスポンスをパース
 * @param {string} responseText - レスポンステキスト
 * @return {Object} パースされた結果
 */
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

  // JSON部分を抽出
  aiResponseText = extractJsonFromResponse(aiResponseText);

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

/**
 * レスポンステキストからJSON部分を抽出
 * @param {string} text - レスポンステキスト
 * @return {string} JSON文字列
 */
function extractJsonFromResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json\n?/gi, '').replace(/```\n?/g, '');

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  return cleaned;
}

/**
 * インサイトを保存
 * @param {Object} insights - インサイトデータ
 */
function saveIntelligenceInsights(insights) {
  const properties = PropertiesService.getScriptProperties();
  const data = {
    insights: insights,
    timestamp: new Date().toISOString()
  };
  properties.setProperty(INTELLIGENCE_CONFIG.STORAGE_KEY, JSON.stringify(data));
}

/**
 * インサイトを取得
 * @return {Object|null} インサイトデータ
 */
function getIntelligenceInsights() {
  const properties = PropertiesService.getScriptProperties();
  const data = properties.getProperty(INTELLIGENCE_CONFIG.STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * 営業インテリジェンス分析を実行（自動実行用）
 */
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

    // 通知を表示
    notifyAnalysisResults(insights);

  } catch (error) {
    Logger.log(`=== 自動分析エラー ===`);
    Logger.log(`エラー: ${error.toString()}`);
    Logger.log(`スタック: ${error.stack}`);
  }
}

/**
 * 分析結果を通知
 * @param {Object} insights - インサイトデータ
 */
function notifyAnalysisResults(insights) {
  if (insights.urgent_opportunities && insights.urgent_opportunities.length > 0) {
    const highPriorityCount = insights.urgent_opportunities.filter(opp => opp.priority === '高').length;

    if (highPriorityCount > 0) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `優先度【高】が${highPriorityCount}件見つかりました！マップで確認してください。`,
        '🔥 重要な営業情報を検出',
        15
      );
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `${insights.urgent_opportunities.length}件の営業情報を更新しました`,
        '✅ 営業インテリジェンス更新',
        8
      );
    }
  }
}

/**
 * インテリジェンスキャッシュをクリア
 */
function clearIntelligenceCache() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty(INTELLIGENCE_CONFIG.STORAGE_KEY);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'キャッシュをクリアしました',
    '✅ 完了',
    5
  );
}

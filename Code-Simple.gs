/***** 設定 *****/
const CONFIG = {
  SHEET_NAME: 'フォームの回答 1',
  COLUMNS: {
    COMPANY: 2,
    ADDRESS: 3,
    MEMO: 4,
    KUBUN: 5,
    WEBSITE: 6,
    LAT: 7,
    LNG: 8,
    VISIT_HISTORY: 9,
    SANSAN_URL: 10
  },
  GOOGLE_MAPS_API_KEY: 'AIzaSyAqJN_eFQZj8B2aFpHl__2xJiKFpJvUfrE'
};

/***** 会社の強み設定 *****/
const COMPANY_STRENGTHS = {
  'Cost': {
    name: '価格',
    keyword: ['価格', 'コスト', '費用', '安い', '予算'],
    detail: '本隊の人件費より安いうえ必要な時だけ依頼可。固定費削減、利益率向上。1人当たり22,000円前後。'
  },
  'Follow': {
    name: 'アフターフォロー',
    keyword: ['フォロー', 'トラブル', 'クレーム', '災害', '対応'],
    detail: '災害対応、クレーム対応が優秀。トラブルを見越して安心して依頼。豊富な実績。'
  },
  'Safety': {
    name: '安全',
    keyword: ['安全', '教育', '事故', 'KY', '熱中症'],
    detail: '充実した安全教育の実施。安心感、生産性向上。私病管理、現場KY、安全大会、巡回、熱中症対策。'
  },
  'Training': {
    name: '教育',
    keyword: ['教育', '未経験', '育成', '研修', '新人'],
    detail: '未経験者に対する教育実施。安心感、生産性向上。新人勉強会、雇い入れテスト'
  },
  'Base': {
    name: '安定基盤',
    keyword: ['安定', '経営', '信頼', '実績', '大手'],
    detail: '安定した経営基盤。長期的に安心して取引。年商100億、全国シェアNo1。'
  },
  'Potential': {
    name: '将来性',
    keyword: ['将来', '成長', '拡大', '増員'],
    detail: '持続的に成長。更にサービス拡充の可能性。毎年100名規模で増員、教育体制を定期的に刷新。'
  },
  'Young': {
    name: '若年齢',
    keyword: ['若い', '年齢', '体力', '元気'],
    detail: '若い平均年齢。体力ある作業員により生産性向上。平均年齢40代後半。'
  },
  'Equipment': {
    name: '装備',
    keyword: ['道具', '装備', '工具', 'セーバーソー', 'スコップ'],
    detail: '作業道具の持参。追加コスト不要。セーバーソーやスコップ。'
  },
  'Capacity': {
    name: '動員力',
    keyword: ['人数', '大量', '動員', '急な', '人手不足', '人が足りない', '忙しい'],
    detail: '供給力が高い。1社で大型現場や増員に対応可能、急な依頼も対応可能。総員1500名。'
  },
  'Compliance': {
    name: '法令遵守',
    keyword: ['社会保険', 'CCUS', 'コンプライアンス', '法令', '保険'],
    detail: '高い社会保険加入率、CCUS加入率。コンプラリスク回避。社会保険加入率98%、CCUS加入率80%。'
  },
  'Matching': {
    name: '適材配置',
    keyword: ['資格', '経験', '技術', 'スキル', 'マッチング'],
    detail: '要望に応じた資格保有者や経験者の配置。ミスマッチ回避で作業効率向上。別紙参照。'
  },
  'Document': {
    name: '書類対応',
    keyword: ['書類', '安全書類', '手続き', 'GS', 'ビルディ'],
    detail: '様々な安全書類の形式に対応可能。書類負担軽減、入場可能現場多数。GSやビルディ。'
  },
  'Leader': {
    name: '職長制度',
    keyword: ['職長', 'リーダー', '監督', '管理'],
    detail: '各現場に職長登用。監督負担軽減。職長資格保有者700名。'
  },
  'Record': {
    name: '実績',
    keyword: ['実績', 'ゼネコン', '施工例', '事例'],
    detail: 'ゼネコン現場の実績多数。安心感向上。別紙参照。'
  },
  'Sales': {
    name: '担当営業',
    keyword: ['営業', '担当', '対応', 'サポート'],
    detail: '気に入ってもらえる営業が在籍。スムーズなやり取り。別紙参照。'
  }
};

/***** AI提案生成関数 *****/
function generateProposal(problems) {
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。「🧠営業インテリジェンス」→「⚙️API設定」から設定してください。');
  }

  // お困りごとから関連する強みを抽出
  const relevantStrengths = [];
  for (const [key, strength] of Object.entries(COMPANY_STRENGTHS)) {
    const isRelevant = strength.keyword.some(keyword =>
      problems.toLowerCase().includes(keyword)
    );
    if (isRelevant) {
      relevantStrengths.push(strength);
    }
  }

  // 関連する強みがない場合は全ての強みを使用
  const strengthsToUse = relevantStrengths.length > 0
    ? relevantStrengths
    : Object.values(COMPANY_STRENGTHS);

  let strengthsText = '';
  strengthsToUse.forEach(strength => {
    strengthsText += `■${strength.name}：${strength.detail}\n`;
  });

  const prompt = `あなたは建設作業員派遣会社の営業提案AIです。

【訪問先のお困りごと】
${problems}

【当社の強み】
${strengthsText}

上記のお困りごとに対して、当社の強みを活かした訴求内容を3つ提案してください。

以下のJSON形式で回答してください：
{
  "proposals": [
    {
      "title": "提案タイトル（20文字以内）",
      "content": "具体的な訴求内容（100文字程度）",
      "strengths": ["活用する強み1", "活用する強み2"]
    }
  ]
}`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      throw new Error(`APIエラー (${responseCode})`);
    }

    const result = JSON.parse(response.getContentText());

    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('AIからの応答がありません');
    }

    let aiResponseText = result.candidates[0].content.parts[0].text;
    aiResponseText = aiResponseText.trim();
    aiResponseText = aiResponseText.replace(/```json\n?/gi, '').replace(/```\n?/g, '');

    const jsonStart = aiResponseText.indexOf('{');
    const jsonEnd = aiResponseText.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1) {
      aiResponseText = aiResponseText.substring(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(aiResponseText);
    return parsed;

  } catch (error) {
    Logger.log(`AI提案生成エラー: ${error.toString()}`);
    throw error;
  }
}

/***** Gemini API設定 *****/
function setupGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();
  const currentKey = properties.getProperty('GEMINI_API_KEY');

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
      properties.setProperty('GEMINI_API_KEY', apiKey);
      ui.alert('✅ APIキーを設定しました!');
    }
  }
}

/***** メニュー構築 *****/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧠 営業インテリジェンス')
    .addItem('⚙️ API設定', 'setupGeminiApiKey')
    .addToUi();
}

/***** ウェブアプリのエントリーポイント *****/
function doGet() {
  return HtmlService.createHtmlOutputFromFile('MapApp')
    .setTitle('営業先マップ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/***** マップデータ取得 *****/
function getMapData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    Logger.log('シートが見つかりません: ' + CONFIG.SHEET_NAME);
    return [];
  }

  const lastRow = sheet.getLastRow();
  Logger.log('データ行数: ' + lastRow);

  const data = [];

  for (let row = 2; row <= lastRow; row++) {
    const company = sheet.getRange(row, CONFIG.COLUMNS.COMPANY).getValue();
    const address = sheet.getRange(row, CONFIG.COLUMNS.ADDRESS).getValue();
    const memo = sheet.getRange(row, CONFIG.COLUMNS.MEMO).getValue();
    const lat = sheet.getRange(row, CONFIG.COLUMNS.LAT).getValue();
    const lng = sheet.getRange(row, CONFIG.COLUMNS.LNG).getValue();
    const website = sheet.getRange(row, CONFIG.COLUMNS.WEBSITE).getValue();
    const kubun = sheet.getRange(row, CONFIG.COLUMNS.KUBUN).getValue();
    const sansanUrl = sheet.getRange(row, CONFIG.COLUMNS.SANSAN_URL).getValue();

    if (company && lat && lng) {
      data.push({
        company: String(company || '').trim(),
        address: String(address || '').trim(),
        memo: String(memo || '').trim(),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        website: String(website || '').trim(),
        kubun: String(kubun || '').trim(),
        sansanUrl: String(sansanUrl || '').trim(),
        row: row
      });
    }
  }

  Logger.log('取得データ数: ' + data.length);
  return data;
}

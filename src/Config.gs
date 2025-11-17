/**
 * 設定定数
 * アプリケーション全体で使用する設定値を管理
 */

/**
 * シートとカラムの設定
 */
const CONFIG = {
  SHEET_NAME: 'フォームの回答 1',
  SALESMAN_CONFIG_SHEET: '営業マン一覧',

  // カラムインデックス
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

  // API設定
  SLEEP_MS: 200,
  REGION: 'JP',
  LANGUAGE: 'ja',
  GOOGLE_MAPS_API_KEY: 'AIzaSyAqJN_eFQZj8B2aFpHl__2xJiKFpJvUfrE'
};

/**
 * 建通新聞メール自動取り込み設定
 */
const KENTSU_CONFIG = {
  EMAIL_FROM: 'media@kentsu.co.jp',
  EMAIL_SUBJECT_KEYWORD: '情報配信サービス　建通新聞',
  MIN_PRICE: 50000000,
  STORAGE_KEY: 'kentsu_pending_cases',
  CHECK_INTERVAL_MINUTES: 10
};

/**
 * 営業インテリジェンス設定
 */
const INTELLIGENCE_CONFIG = {
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  STORAGE_KEY: 'intelligence_insights',
  CHECK_INTERVAL_HOURS: 12,
  DAYS_TO_ANALYZE: 7,
  MAX_RECORDS_PER_ANALYSIS: 200,

  // API設定
  GENERATION_CONFIG: {
    temperature: 0.2,
    topK: 20,
    topP: 0.8,
    maxOutputTokens: 1024,
    stopSequences: []
  },

  // セーフティ設定
  SAFETY_SETTINGS: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ]
};

/**
 * 会社名クリーンアップ用キーワード
 */
const COMPANY_NAME_KEYWORDS = {
  // 都道府県名
  LOCATIONS: [
    '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
    '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
    '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜',
    '静岡', '愛知', '三重', '滋賀', '京都', '大阪', '兵庫',
    '奈良', '和歌山', '鳥取', '島根', '岡山', '広島', '山口',
    '徳島', '香川', '愛媛', '高知', '福岡', '佐賀', '長崎',
    '熊本', '大分', '宮崎', '鹿児島', '沖縄',
    '区', '市', '町', '村', '県', '都', '府', '郡'
  ],

  // 業種キーワード
  INDUSTRIES: [
    '建設', '工務', '土木', '解体', '鉄筋', 'とび', '型枠',
    '配管', '内装', '足場', '電気', '設備', '塗装', '防水',
    '左官', '大工', '板金', '屋根', '外構', '造園', '舗装',
    'リフォーム', '建築', '住宅', '工事', '施工'
  ],

  // その他のキーワード
  OTHERS: [
    '日本', '株式会社', '有限会社', '合同会社', '㈱', '㈲'
  ]
};

/**
 * Google Maps APIのアドレスタイプ優先順位
 */
const ADDRESS_TYPE_PRIORITY = [
  'street_address',
  'premise',
  'subpremise',
  'establishment'
];

/**
 * 会社名の正規化マッピング
 */
const COMPANY_NAME_REPLACEMENTS = {
  '㈱': '株式会社',
  '(株)': '株式会社',
  'Ⅰ': '1',
  'Ⅱ': '2',
  'Ⅲ': '3'
};

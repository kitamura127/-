/**
 * Config.gs
 * アプリケーション全体の設定定数
 */

/***** 基本設定 *****/
const CONFIG = {
  SHEET_NAME: 'フォームの回答 1',
  SALESMAN_CONFIG_SHEET: '営業マン一覧',
  TEIKOKU_FOLDER_ID: '1_i2kVMGlz5JqOavSZTkWYBWBpyhJVrQD',

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

  SLEEP_MS: 200,
  REGION: 'JP',
  LANGUAGE: 'ja',
  GOOGLE_MAPS_API_KEY: 'AIzaSyAqJN_eFQZj8B2aFpHl__2xJiKFpJvUfrE'
};

/***** 建通新聞設定 *****/
const KENTSU_CONFIG = {
  EMAIL_FROM: 'media@kentsu.co.jp',
  EMAIL_SUBJECT_KEYWORD: '情報配信サービス　建通新聞',
  MIN_PRICE: 50000000,
  STORAGE_KEY: 'kentsu_pending_cases',
  CHECK_INTERVAL_MINUTES: 10
};

/***** 営業インテリジェンス設定 *****/
const INTELLIGENCE_CONFIG = {
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  STORAGE_KEY: 'intelligence_insights',
  CHECK_INTERVAL_HOURS: 12,
  DAYS_TO_ANALYZE: 7
};

/***** 会社名正規化パターン *****/
const COMPANY_PATTERNS = {
  REPLACEMENTS: {
    '㈱': '株式会社',
    '(株)': '株式会社',
    'Ⅰ': '1',
    'Ⅱ': '2',
    'Ⅲ': '3'
  },

  LEGAL_FORMS: /株式会社|有限会社|㈱|㈲|合同会社|合資会社|合名会社/g,

  LOCATION_KEYWORDS: [
    '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
    '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
    '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜',
    '静岡', '愛知', '三重', '滋賀', '京都', '大阪', '兵庫',
    '奈良', '和歌山', '鳥取', '島根', '岡山', '広島', '山口',
    '徳島', '香川', '愛媛', '高知', '福岡', '佐賀', '長崎',
    '熊本', '大分', '宮崎', '鹿児島', '沖縄',
    '区', '市', '町', '村', '県', '都', '府', '郡'
  ],

  INDUSTRY_KEYWORDS: [
    '建設', '工務', '土木', '解体', '鉄筋', 'とび', '型枠',
    '配管', '内装', '足場', '電気', '設備', '塗装', '防水',
    '左官', '大工', '板金', '屋根', '外構', '造園', '舗装',
    'リフォーム', '建築', '住宅', '工事', '施工'
  ]
};

/***** Geocoding設定 *****/
const GEOCODING = {
  PREFERRED_TYPES: ['street_address', 'premise', 'subpremise', 'establishment']
};

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

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★ この function doGet() がない場合は追加してください ★★★
// ★★★ CONFIGの後、他の関数の前に追加します ★★★
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
function doGet() {
  return HtmlService.createHtmlOutputFromFile('MapApp')
    .setTitle('営業マップ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★ ここまでが追加部分です ★★★
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

// 以下、既存の関数（getData, geocodeAddress, loadSalesmanConfig など）は
// そのまま残しておいてください。削除しないでください。

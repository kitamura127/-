/**
 * AddressService.gs
 * 住所・座標取得サービス
 */

/***** ジオコーディング *****/
function geocodeAddressWithCoords(query) {
  try {
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
    const encodedQuery = encodeURIComponent(query);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&language=ja&key=${apiKey}`;

    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const result = JSON.parse(response.getContentText());

    if (result.status === 'OK' && result.results?.length > 0) {
      const bestResult = selectBestAddressCandidate(result.results);
      const address = cleanJapaneseAddress(bestResult.formatted_address);
      const coordinates = {
        lat: bestResult.geometry.location.lat,
        lng: bestResult.geometry.location.lng
      };

      return { address, coordinates };
    }
  } catch (err) {
    Logger.log(`geocodeAddressWithCoords error: ${err}`);
  }
  return { address: '', coordinates: null };
}

function getCoordinatesFromAddress(address) {
  try {
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&language=ja&key=${apiKey}`;

    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const result = JSON.parse(response.getContentText());

    if (result.status === 'OK' && result.results?.length > 0) {
      const location = result.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
  } catch (err) {
    Logger.log(`getCoordinatesFromAddress error: ${err}`);
  }
  return null;
}

/***** 英語→日本語住所変換 *****/
function convertEnglishToJapaneseAddress(englishAddress) {
  try {
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;

    // まずジオコーディングで座標取得
    const encodedAddress = encodeURIComponent(englishAddress);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const geocodeResponse = UrlFetchApp.fetch(geocodeUrl, { muteHttpExceptions: true });
    const geocodeResult = JSON.parse(geocodeResponse.getContentText());

    if (geocodeResult.status !== 'OK' || !geocodeResult.results?.length) {
      return { address: '', coordinates: null };
    }

    const location = geocodeResult.results[0].geometry.location;

    // 逆ジオコーディングで日本語住所を取得
    const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&language=ja&key=${apiKey}`;

    const reverseResponse = UrlFetchApp.fetch(reverseUrl, { muteHttpExceptions: true });
    const reverseResult = JSON.parse(reverseResponse.getContentText());

    if (reverseResult.status === 'OK' && reverseResult.results?.length > 0) {
      return {
        address: cleanJapaneseAddress(reverseResult.results[0].formatted_address),
        coordinates: { lat: location.lat, lng: location.lng }
      };
    }
  } catch (err) {
    Logger.log(`convertEnglishToJapaneseAddress error: ${err}`);
  }
  return { address: '', coordinates: null };
}

/***** 住所候補選択 *****/
function selectBestAddressCandidate(results) {
  const preferredResult = results.find(result =>
    (result.types || []).some(type => GEOCODING.PREFERRED_TYPES.includes(type))
  );

  return preferredResult || results[0];
}

/***** 住所変換処理 *****/
function convertAddressToJapanese(sheet, row) {
  try {
    const addressCell = sheet.getRange(row, CONFIG.COLUMNS.ADDRESS);
    const currentAddress = String(addressCell.getValue() || '').trim();

    if (!currentAddress || currentAddress === '住所取得失敗') {
      return 'empty';
    }

    if (isJapaneseAddress(currentAddress)) {
      return 'skipped';
    }

    const result = convertEnglishToJapaneseAddress(currentAddress);

    if (result.address && result.address !== currentAddress) {
      addressCell.setValue(result.address);
      if (result.coordinates) {
        updateCell(sheet, row, CONFIG.COLUMNS.LAT, result.coordinates.lat);
        updateCell(sheet, row, CONFIG.COLUMNS.LNG, result.coordinates.lng);
      }
      Logger.log(`Row ${row}: ${currentAddress} → ${result.address}`);

      Utilities.sleep(100);
      cleanCompanyName(sheet, row);

      return 'converted';
    }

    return 'failed';
  } catch (err) {
    Logger.log(`convertAddressToJapanese error (row ${row}): ${err}`);
    return 'error';
  }
}

/***** 選択範囲の住所を日本語化 *****/
function convertAddressesToJapanese() {
  const sheet = getTargetSheet();
  const range = sheet.getActiveRange();
  const startRow = range.getRow();
  const endRow = startRow + range.getNumRows() - 1;

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (let row = startRow; row <= endRow; row++) {
    if (row === 1) continue;
    const result = convertAddressToJapanese(sheet, row);
    if (result === 'converted') converted++;
    else if (result === 'skipped') skipped++;
    else if (result === 'failed') failed++;
    Utilities.sleep(CONFIG.SLEEP_MS);
  }

  showAlert(
    '住所の日本語化が完了しました\n\n' +
    `変換成功: ${converted}件\n` +
    `スキップ(既に日本語): ${skipped}件\n` +
    `変換失敗: ${failed}件`
  );
}

/***** 全住所を日本語化 *****/
function convertAllAddressesToJapanese() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (let row = 2; row <= lastRow; row++) {
    const result = convertAddressToJapanese(sheet, row);
    if (result === 'converted') converted++;
    else if (result === 'skipped') skipped++;
    else if (result === 'failed') failed++;
    Utilities.sleep(CONFIG.SLEEP_MS);
  }

  showAlert(
    '全住所の日本語化が完了しました\n\n' +
    `変換成功: ${converted}件\n` +
    `スキップ(既に日本語): ${skipped}件\n` +
    `変換失敗: ${failed}件`
  );
}

/***** 座標自動更新 *****/
function updateCoordinatesFromAddress(sheet, row, address) {
  const lat = getCellValue(sheet, row, CONFIG.COLUMNS.LAT);
  const lng = getCellValue(sheet, row, CONFIG.COLUMNS.LNG);

  if (lat && lng) {
    Logger.log(`Row ${row}: 座標が既に存在するためスキップ`);
    return;
  }

  const coordinates = getCoordinatesFromAddress(address);
  if (coordinates) {
    updateCell(sheet, row, CONFIG.COLUMNS.LAT, coordinates.lat);
    updateCell(sheet, row, CONFIG.COLUMNS.LNG, coordinates.lng);
    Logger.log(`Row ${row}: 住所から座標を自動取得 (${coordinates.lat}, ${coordinates.lng})`);
  } else {
    Logger.log(`Row ${row}: 座標の取得に失敗`);
  }
}

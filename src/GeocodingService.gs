/**
 * ジオコーディングサービス
 * Google Maps APIを使用した住所・座標変換
 */

/**
 * 検索クエリから住所と座標を取得
 * @param {string} query - 検索クエリ
 * @return {Object} {address: string, coordinates: {lat: number, lng: number}}
 */
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

/**
 * 住所から座標を取得
 * @param {string} address - 住所
 * @return {Object|null} {lat: number, lng: number} または null
 */
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

/**
 * 英語住所を日本語に変換
 * @param {string} englishAddress - 英語住所
 * @return {Object} {address: string, coordinates: {lat: number, lng: number}|null}
 */
function convertEnglishToJapaneseAddress(englishAddress) {
  try {
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;

    // まず英語住所をジオコード
    const encodedAddress = encodeURIComponent(englishAddress);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const geocodeResponse = UrlFetchApp.fetch(geocodeUrl, { muteHttpExceptions: true });
    const geocodeResult = JSON.parse(geocodeResponse.getContentText());

    if (geocodeResult.status !== 'OK' || !geocodeResult.results?.length) {
      return { address: '', coordinates: null };
    }

    const location = geocodeResult.results[0].geometry.location;

    // 座標から日本語住所を逆引き
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

/**
 * 住所候補から最適なものを選択
 * @param {Array} results - Geocoding APIの結果配列
 * @return {Object} 最適な結果
 */
function selectBestAddressCandidate(results) {
  // 優先度の高いタイプを持つ結果を探す
  const preferredResult = results.find(result =>
    (result.types || []).some(type => ADDRESS_TYPE_PRIORITY.includes(type))
  );

  return preferredResult || results[0];
}

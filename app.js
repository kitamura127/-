// 営業先マップ - メインアプリケーション

// ========================================
// グローバル変数
// ========================================

let map;
let markers = [];
let allLocations = [];
let infoWindow;
let lastDataCount = 0;
let sidebarVisible = true;
let leftSidebarVisible = true;
let sheetVisible = false;
let currentZoom = 10;
let currentLocationMarker = null;
let isTrackingLocation = false;
let watchId = null;
let spreadsheetUrl = '';
let currentSalesman = 'self';
let salesmanList = [];
let newCases = [];
let currentInsights = null;
let currentLeftTab = 'insights';
let isMobileListView = false;

// ========================================
// 定数
// ========================================

const MARKER_SHAPES = {
  'タネ未満': 'circle',
  '戦略予材': 'star',
  '現場': 'triangle',
  'その他': 'square',
  'default': 'circle'
};

// ========================================
// モバイル表示切替
// ========================================

function toggleMobileView() {
  const leftSidebar = document.getElementById('left-sidebar');
  const rightSidebar = document.getElementById('sidebar');
  const toggleBtn = document.querySelector('.mobile-toggle-btn');
  const sidebarHeader = document.getElementById('sidebar-header');
  const listViewLayout = document.getElementById('list-view-layout');

  isMobileListView = !isMobileListView;

  if (isMobileListView) {
    // 営業先リストを表示
    leftSidebar.classList.remove('mobile-visible');
    leftSidebar.classList.add('hidden');
    rightSidebar.classList.add('mobile-visible');
    rightSidebar.classList.remove('hidden');

    // 通常のヘッダーを非表示、2カラムレイアウトを表示
    sidebarHeader.style.display = 'none';
    listViewLayout.style.display = 'block';

    // 統計情報を2カラムレイアウトにコピー
    updateLargeStats();

    toggleBtn.innerHTML = '🗺️ マップに切替';
    leftSidebarVisible = false;
    sidebarVisible = true;
  } else {
    // マップを表示
    leftSidebar.classList.remove('mobile-visible');
    leftSidebar.classList.add('hidden');
    rightSidebar.classList.remove('mobile-visible');
    rightSidebar.classList.add('hidden');

    // 通常のヘッダーを表示、2カラムレイアウトを非表示
    sidebarHeader.style.display = 'block';
    listViewLayout.style.display = 'none';

    toggleBtn.innerHTML = '📋 リストに切替';
    leftSidebarVisible = false;
    sidebarVisible = false;
  }

  // 地図のリサイズイベントをトリガー
  setTimeout(() => {
    google.maps.event.trigger(map, 'resize');
  }, 300);
}

// 統計情報を2カラムレイアウトにコピー
function updateLargeStats() {
  const visited = document.getElementById('stat-visited').textContent;
  const target = document.getElementById('stat-target').textContent;
  const rate = document.getElementById('stat-rate').textContent;
  const message = document.getElementById('stat-message').textContent;

  document.getElementById('stat-visited-large').textContent = visited;
  document.getElementById('stat-target-large').textContent = target;
  document.getElementById('stat-rate-large').textContent = rate;
  document.getElementById('stat-message-large').textContent = message;
}

// ========================================
// 重複チェック
// ========================================

function searchDuplicates() {
  const searchInput = document.getElementById('duplicate-search');
  const resultsDiv = document.getElementById('duplicate-results');
  const searchValue = searchInput.value.trim();

  if (!searchValue) {
    resultsDiv.innerHTML = '<div class="duplicate-empty">🔍 住所を入力して重複をチェック</div>';
    return;
  }

  // 入力された住所を正規化
  const normalizedSearch = normalizeAddressForDuplicate(searchValue);

  // 重複する営業先を検索
  const duplicates = allLocations.filter(loc => {
    const normalizedAddress = normalizeAddressForDuplicate(loc.address);
    return normalizedAddress.includes(normalizedSearch) || normalizedSearch.includes(normalizedAddress);
  });

  if (duplicates.length === 0) {
    resultsDiv.innerHTML = '<div class="duplicate-empty">❌ 該当する営業先が見つかりません</div>';
    return;
  }

  // 重複結果を表示
  let html = '';
  duplicates.forEach(loc => {
    const hasDuplicates = loc.duplicates && loc.duplicates.length > 0;
    const duplicateText = hasDuplicates ?
      `<div class="duplicate-salesmen">⚠️ ${loc.duplicates.join(', ')}も登録</div>` :
      '<div class="duplicate-salesmen" style="color: #48bb78;">✓ 重複なし</div>';

    html += `
      <div class="duplicate-item">
        <div class="duplicate-company">${loc.company}</div>
        <div class="duplicate-address">${loc.address}</div>
        ${duplicateText}
      </div>
    `;
  });

  resultsDiv.innerHTML = html;
}

// 住所正規化関数（code.gsと同じロジック）
function normalizeAddressForDuplicate(address) {
  if (!address) return '';

  return address
    .replace(/^日本、?\s*/g, '')
    .replace(/〒\d{3}-?\d{4}\s*/g, '')
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[‐－―ー]/g, '-')
    .replace(/\s+/g, '')
    .toLowerCase()
    .trim();
}

// ========================================
// 左サイドバー（インテリジェンス）
// ========================================

function switchLeftTab(tabName) {
  currentLeftTab = tabName;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  if (tabName === 'insights') {
    document.querySelector('.tab-btn:first-child').classList.add('active');
    document.getElementById('insights-tab').classList.add('active');
  } else {
    document.querySelector('.tab-btn:last-child').classList.add('active');
    document.getElementById('newcases-tab').classList.add('active');
  }
}

function refreshLeftSidebar() {
  if (currentLeftTab === 'insights') {
    runAnalysisAndLoadInsights();
  } else {
    loadNewCases();
  }
}

function runAnalysisAndLoadInsights() {
  const btn = document.querySelector('.refresh-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '🔄 分析中...';
  btn.disabled = true;

  const container = document.getElementById('insights-tab');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⏳</div>
      <div class="empty-state-text">
        営業情報を分析しています...<br>
        しばらくお待ちください
      </div>
    </div>
  `;

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(() => {
        setTimeout(() => {
          loadInsights();
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 1000);
      })
      .withFailureHandler((error) => {
        console.error('分析エラー:', error);
        btn.innerHTML = originalText;
        btn.disabled = false;
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">❌</div>
            <div class="empty-state-text">
              分析に失敗しました<br>
              エラー: ${error.message}
            </div>
          </div>
        `;
      })
      .runIntelligenceAnalysis();
  } else {
    btn.innerHTML = originalText;
    btn.disabled = false;
    loadInsights();
  }
}

function toggleLeftSidebar() {
  const sidebar = document.getElementById('left-sidebar');
  const toggle = document.getElementById('left-sidebar-toggle');
  const icon = document.getElementById('left-toggle-icon');

  leftSidebarVisible = !leftSidebarVisible;

  if (leftSidebarVisible) {
    sidebar.classList.remove('hidden');
    toggle.classList.remove('sidebar-hidden');
    toggle.classList.add('sidebar-visible');
    icon.textContent = '◀';
  } else {
    sidebar.classList.add('hidden');
    toggle.classList.remove('sidebar-visible');
    toggle.classList.add('sidebar-hidden');
    icon.textContent = '▶';
  }

  setTimeout(() => {
    google.maps.event.trigger(map, 'resize');
  }, 300);
}

function loadInsights() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(displayInsights)
      .withFailureHandler((error) => {
        console.error('インサイト取得エラー:', error);
        displayInsights(null);
      })
      .getIntelligenceInsights();
  } else {
    displayInsights(null);
  }
}

function displayInsights(data) {
  const container = document.getElementById('insights-tab');

  if (!data || !data.insights) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">
          まだ分析結果がありません<br><br>
          「更新」ボタンをクリックして<br>
          分析を実行してください
        </div>
      </div>
    `;
    return;
  }

  currentInsights = data.insights;
  const timestamp = new Date(data.timestamp);

  let html = '';

  if (currentInsights.urgent_opportunities && currentInsights.urgent_opportunities.length > 0) {
    currentInsights.urgent_opportunities.forEach((opp, index) => {
      const typeEmoji = opp.type.includes('繁忙') ? '🔥' :
                        opp.type.includes('物件') ? '📅' :
                        opp.type.includes('施工') ? '🏢' : '💰';

      const sourceCompany = opp.source_company || opp.company || opp.updated_company || opp.visit_company || '会社名不明';

      html += `
        <div class="insight-item" onclick="showInsightDetail(${index})">
          <div class="insight-company"><strong>${escapeHtml(sourceCompany)}</strong></div>
          <div class="insight-summary">${escapeHtml(opp.detail)}</div>
          <div class="insight-source">📝 ${escapeHtml(opp.source_salesman)} (${formatShortDate(opp.date)})</div>
        </div>
      `;
    });
  } else {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">✨</div>
        <div class="empty-state-text">
          現在、重要な更新情報は<br>ありません
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function showInsightDetail(index) {
  if (!currentInsights || !currentInsights.urgent_opportunities) return;

  const opp = currentInsights.urgent_opportunities[index];
  const typeEmoji = opp.type.includes('繁忙') ? '🔥' :
                    opp.type.includes('物件') ? '📅' :
                    opp.type.includes('施工') ? '🏢' : '💰';

  const sourceCompany = opp.source_company || opp.company || opp.updated_company || opp.visit_company || '会社名不明';

  const content = `
    <div style="padding: 15px; min-width: 280px; max-width: 350px;">
      <div style="margin-bottom: 12px;">
        <h3 style="margin: 0; color: #333; font-size: 15px; font-weight: 600;">
          ${typeEmoji} <strong>${escapeHtml(sourceCompany)}</strong>
        </h3>
      </div>

      <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #4285f4;">
        <p style="margin: 0; color: #333; font-size: 13px; font-weight: 600; margin-bottom: 6px;">
          ${escapeHtml(opp.summary)}
        </p>
        <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.5;">
          ${escapeHtml(opp.detail)}
        </p>
      </div>

      <div style="padding: 10px; background: #e8f5e9; border-radius: 6px;">
        <p style="margin: 0; color: #2e7d32; font-size: 11px;">
          📝 ${escapeHtml(opp.source_salesman)}<br>
          📅 ${formatDate(opp.date)}
        </p>
      </div>
    </div>
  `;

  infoWindow.setContent(content);
  infoWindow.setPosition(map.getCenter());
  infoWindow.open(map);
}

// ========================================
// 新着案件
// ========================================

function loadNewCases() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(displayNewCases)
      .withFailureHandler((error) => {
        console.error('新着案件取得エラー:', error);
        displayNewCases([]);
      })
      .getNewCases();
  } else {
    displayNewCases([]);
  }
}

function displayNewCases(cases) {
  newCases = cases;
  const container = document.getElementById('newcases-tab');
  const badge = document.getElementById('left-cases-badge');

  if (cases.length > 0) {
    badge.textContent = cases.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  if (cases.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">
          新着案件はありません<br><br>
          メール監視が有効な場合、<br>
          自動的に案件が抽出されます
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  cases.forEach((caseData, index) => {
    const item = document.createElement('div');
    item.className = 'new-case-item';
    item.innerHTML = `
      <div class="new-case-name">${escapeHtml(caseData.projectName)}</div>
      ${caseData.contractor ? `<div class="new-case-contractor">🏗️ ${escapeHtml(caseData.contractor)}</div>` : ''}
      <div class="new-case-info">📍 ${escapeHtml(caseData.address)}</div>
      <div class="new-case-price">💰 ${caseData.price.toLocaleString()}円</div>
      ${caseData.url ? `<a href="${escapeHtml(caseData.url)}" target="_blank" class="new-case-link" onclick="event.stopPropagation();">🔗 詳細を見る →</a>` : ''}
    `;
    item.onclick = () => registerNewCase(index);
    container.appendChild(item);
  });
}

function registerNewCase(index) {
  const item = document.querySelectorAll('.new-case-item')[index];
  const caseData = newCases[index];

  if (!confirm(`「${caseData.projectName}」\nをスプレッドシートに登録しますか？`)) {
    return;
  }

  item.classList.add('registering');

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((result) => {
        showLocationStatus('✅ 登録完了！スプレッドシートに追加しました', 'success');
        loadNewCases();
        loadData();
      })
      .withFailureHandler((error) => {
        alert('登録に失敗しました: ' + error.message);
        item.classList.remove('registering');
      })
      .registerCase(index);
  }
}

// ========================================
// マーカー関連
// ========================================

function getMarkerShape(kubun) {
  return MARKER_SHAPES[kubun] || MARKER_SHAPES['default'];
}

function getMarkerColor(visitHistory) {
  if (!visitHistory || visitHistory.length === 0) {
    return '#f44336';
  }

  const lastVisit = new Date(visitHistory[visitHistory.length - 1].date);
  const today = new Date();
  const daysDiff = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 30) {
    return '#9e9e9e';
  } else if (daysDiff <= 90) {
    return '#ffc107';
  } else {
    return '#f44336';
  }
}

function getVisitStatus(visitHistory) {
  if (!visitHistory || visitHistory.length === 0) {
    return { label: '訪問必要', class: 'status-urgent' };
  }

  const lastVisit = new Date(visitHistory[visitHistory.length - 1].date);
  const today = new Date();
  const daysDiff = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 30) {
    return { label: `${daysDiff}日前`, class: 'status-recent' };
  } else if (daysDiff <= 90) {
    return { label: `${daysDiff}日前`, class: 'status-warning' };
  } else {
    return { label: `${daysDiff}日前`, class: 'status-urgent' };
  }
}

function createMarkerIcon(shape, color) {
  let path;
  let scale;
  let anchor;

  switch (shape) {
    case 'circle':
      path = google.maps.SymbolPath.CIRCLE;
      scale = 6;
      anchor = new google.maps.Point(0, 0);
      break;
    case 'star':
      path = 'M 0,-8 L 2,-2 L 8,-2 L 3,2 L 5,8 L 0,4 L -5,8 L -3,2 L -8,-2 L -2,-2 Z';
      scale = 1;
      anchor = new google.maps.Point(0, 0);
      break;
    case 'triangle':
      path = 'M 0,-8 L 7,8 L -7,8 Z';
      scale = 1;
      anchor = new google.maps.Point(0, 2);
      break;
    case 'square':
      path = 'M -6,-6 L 6,-6 L 6,6 L -6,6 Z';
      scale = 1;
      anchor = new google.maps.Point(0, 0);
      break;
    default:
      path = google.maps.SymbolPath.CIRCLE;
      scale = 6;
      anchor = new google.maps.Point(0, 0);
  }

  return {
    path: path,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: scale,
    anchor: anchor
  };
}

function createCurrentLocationIcon() {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: '#4285f4',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
    scale: 8
  };
}

// ========================================
// サイドバー制御
// ========================================

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const icon = document.getElementById('toggle-icon');

  sidebarVisible = !sidebarVisible;

  if (sidebarVisible) {
    sidebar.classList.remove('hidden');
    toggle.classList.remove('sidebar-hidden');
    toggle.classList.add('sidebar-visible');
    icon.textContent = '◀';
  } else {
    sidebar.classList.add('hidden');
    toggle.classList.remove('sidebar-visible');
    toggle.classList.add('sidebar-hidden');
    icon.textContent = '▶';
  }

  setTimeout(() => {
    google.maps.event.trigger(map, 'resize');
  }, 300);
}

// ========================================
// スプレッドシート
// ========================================

function toggleSheet() {
  const container = document.getElementById('sheet-container');
  const mapContainer = document.getElementById('map-container');
  const toggle = document.getElementById('sheet-toggle');
  const icon = document.getElementById('sheet-toggle-icon');
  const text = document.getElementById('sheet-toggle-text');
  const mobileSwitcher = document.getElementById('mobile-view-switcher');

  sheetVisible = !sheetVisible;

  if (sheetVisible) {
    container.classList.add('visible');
    mapContainer.classList.add('with-sheet');
    toggle.classList.add('sheet-open');
    icon.textContent = '▼';
    text.textContent = 'スプレッドシートを閉じる';

    if (spreadsheetUrl && !document.getElementById('sheet-frame').src) {
      document.getElementById('sheet-frame').src = spreadsheetUrl;
    }

    // スプレッドシート表示時は下部ボタンを非表示
    if (mobileSwitcher) {
      mobileSwitcher.style.display = 'none';
    }
  } else {
    container.classList.remove('visible');
    mapContainer.classList.remove('with-sheet');
    toggle.classList.remove('sheet-open');
    icon.textContent = '▲';
    text.textContent = 'スプレッドシートを表示';

    // スプレッドシート非表示時は下部ボタンを再表示
    if (mobileSwitcher) {
      mobileSwitcher.style.display = '';
    }
  }

  setTimeout(() => {
    google.maps.event.trigger(map, 'resize');
    if (!sheetVisible) {
      loadData();
    }
  }, 300);
}

// ========================================
// 現在地トラッキング
// ========================================

function toggleCurrentLocation() {
  const btn = document.getElementById('location-btn');

  if (isTrackingLocation) {
    stopLocationTracking();
    btn.classList.remove('active');
    btn.innerHTML = '📍 現在地';
  } else {
    startLocationTracking();
    btn.classList.add('active');
    btn.innerHTML = '⏹️ 停止';
  }
}

function startLocationTracking() {
  if (!navigator.geolocation) {
    showLocationStatus('お使いのブラウザは位置情報に対応していません', 'error');
    return;
  }

  showLocationStatus('現在地を取得中...', 'loading');

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      updateCurrentLocation(pos);
      isTrackingLocation = true;
      showLocationStatus('現在地を追跡中', 'success');
    },
    (error) => {
      console.error('位置情報エラー:', error);
      let message = '位置情報の取得に失敗しました';
      if (error.code === error.PERMISSION_DENIED) {
        message = '位置情報の使用が許可されていません';
      }
      showLocationStatus(message, 'error');
      stopLocationTracking();
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function stopLocationTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (currentLocationMarker) {
    currentLocationMarker.setMap(null);
    currentLocationMarker = null;
  }

  isTrackingLocation = false;
  hideLocationStatus();
}

function updateCurrentLocation(pos) {
  if (!currentLocationMarker) {
    currentLocationMarker = new google.maps.Marker({
      map: map,
      icon: createCurrentLocationIcon(),
      title: '現在地',
      zIndex: 1000
    });

    currentLocationMarker.addListener('click', () => {
      const content = `
        <div style="padding: 12px; min-width: 180px;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">📍 あなたの現在地</h3>
          <p style="margin: 4px 0; color: #666; font-size: 12px;">
            緯度: ${pos.lat.toFixed(6)}<br>
            経度: ${pos.lng.toFixed(6)}
          </p>
        </div>
      `;
      infoWindow.setContent(content);
      infoWindow.open(map, currentLocationMarker);
    });

    map.setCenter(pos);
    map.setZoom(15);
  }

  currentLocationMarker.setPosition(pos);
}

function showLocationStatus(message, type) {
  const status = document.getElementById('location-status');
  status.textContent = message;
  status.style.display = 'block';

  if (type === 'success') {
    status.style.background = '#4caf50';
    status.style.color = 'white';
    setTimeout(() => hideLocationStatus(), 3000);
  } else if (type === 'error') {
    status.style.background = '#f44336';
    status.style.color = 'white';
    setTimeout(() => hideLocationStatus(), 5000);
  } else {
    status.style.background = 'white';
    status.style.color = '#333';
  }
}

function hideLocationStatus() {
  const status = document.getElementById('location-status');
  status.style.display = 'none';
}

// ========================================
// 地図初期化
// ========================================

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: { lat: 35.6762, lng: 139.6503 },
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: 'greedy',
    styles: [
      {
        elementType: 'geometry',
        stylers: [{ color: '#6b7280' }]
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#3f4a59' }]
      },
      {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#7b8794' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#5f6b7a' }]
      },
      {
        featureType: 'road',
        elementType: 'labels',
        stylers: [{ visibility: 'on' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#3f4a59' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#8b95a3' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#6b7280' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#3f4a59' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'road.highway.controlled_access',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'road.local',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#6b7886' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'transit.line',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#4a5d6f' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#8b95a3' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#3f4a59' }]
      }
    ]
  });

  map.addListener('zoom_changed', () => {
    currentZoom = map.getZoom();
  });

  infoWindow = new google.maps.InfoWindow();
  loadSpreadsheetUrl();
  loadSalesmanList();
  loadData();
  loadStats();
  loadInsights();
  loadNewCases();

  setInterval(() => {
    loadNewCases();
  }, 60000);

  setInterval(() => {
    loadInsights();
  }, 300000);
}

// ========================================
// データ読み込み
// ========================================

function loadSpreadsheetUrl() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((url) => {
        spreadsheetUrl = url;
      })
      .withFailureHandler((error) => {
        console.error('スプレッドシートURL取得エラー:', error);
      })
      .getSpreadsheetUrl();
  }
}

function loadSalesmanList() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((list) => {
        salesmanList = list;
        createSalesmanSwitcher();
      })
      .withFailureHandler((error) => {
        console.error('営業マン一覧取得エラー:', error);
        salesmanList = [{name: '自分', url: '', isSelf: true}];
        createSalesmanSwitcher();
      })
      .getSalesmanList();
  }
}

function createSalesmanSwitcher() {
  const select = document.getElementById('salesman-select');
  select.innerHTML = '';

  salesmanList.forEach((salesman, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = (salesman.isSelf ? '👤 ' : '👥 ') + salesman.name;
    if (salesman.isSelf) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function switchSalesman() {
  const select = document.getElementById('salesman-select');
  const index = parseInt(select.value);
  const salesman = salesmanList[index];

  if (salesman.isSelf) {
    currentSalesman = 'self';
    document.getElementById('stats-panel').style.display = 'block';
    loadData();
    loadStats();
  } else {
    currentSalesman = index;
    document.getElementById('stats-panel').style.display = 'none';
    loadOtherSalesmanData(salesman.url);
  }
}

function loadOtherSalesmanData(url) {
  document.getElementById('loading').classList.remove('hidden');

  fetch(url + '?mode=data')
    .then(response => response.json())
    .then(data => {
      onDataLoaded(data, false);
    })
    .catch(error => {
      console.error('データ取得エラー:', error);
      showError('他の営業マンのデータを取得できませんでした: ' + error.message);
      document.getElementById('loading').classList.add('hidden');
    });
}

function loadStats() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(updateStats)
      .withFailureHandler((error) => {
        console.error('統計データ取得エラー:', error);
      })
      .getMonthlyStats();
  }
}

function updateStats(stats) {
  if (!stats) return;

  document.getElementById('stat-visited').textContent = stats.visitedThisMonth;
  document.getElementById('stat-target').textContent = stats.targetGoal || '未設定';

  let rate = 0;
  let message = '';

  if (stats.targetGoal && stats.targetGoal > 0) {
    rate = Math.round((stats.visitedThisMonth / stats.targetGoal) * 100);
    document.getElementById('stat-rate').textContent = rate + '%';

    const remaining = stats.targetGoal - stats.visitedThisMonth;
    if (remaining > 0) {
      message = `あと ${remaining} 件で目標達成！`;
    } else if (remaining === 0) {
      message = '🎉 目標達成おめでとうございます！';
    } else {
      message = `🎉 目標を ${Math.abs(remaining)} 件超過達成！`;
    }
  } else {
    document.getElementById('stat-rate').textContent = '-';
    message = '「目標設定」ボタンから目標を設定してください';
  }

  document.getElementById('stat-message').textContent = message;
}

function editTargetGoal() {
  if (typeof google === 'undefined' || !google.script || !google.script.run) {
    alert('この機能はGoogle Apps Script環境でのみ動作します');
    return;
  }

  google.script.run
    .withSuccessHandler((currentGoal) => {
      const input = prompt(
        '今月の訪問目標件数を入力してください：\n（現在の目標: ' + (currentGoal || '未設定') + '件）',
        currentGoal || ''
      );

      if (input === null) return;

      const goal = parseInt(input);
      if (isNaN(goal) || goal < 0) {
        alert('正しい数値を入力してください');
        return;
      }

      google.script.run
        .withSuccessHandler(() => {
          alert('目標を ' + goal + ' 件に設定しました！');
          loadStats();
        })
        .withFailureHandler((error) => {
          alert('設定に失敗しました: ' + error.message);
        })
        .setMonthlyTargetGoal(goal);
    })
    .withFailureHandler((error) => {
      alert('目標の取得に失敗しました: ' + error.message);
    })
    .getMonthlyTargetGoal();
}

function loadData(silent = false) {
  if (!silent) {
    document.getElementById('loading').classList.remove('hidden');
  }

  if (currentSalesman !== 'self') {
    const salesman = salesmanList[currentSalesman];
    if (salesman) {
      loadOtherSalesmanData(salesman.url);
    }
    return;
  }

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((data) => onDataLoaded(data, silent))
      .withFailureHandler(onError)
      .getMapDataWithDuplicates();
  } else {
    onError(new Error('データソースに接続できません'));
  }
}

function onDataLoaded(data, silent = false) {
  document.getElementById('loading').classList.add('hidden');

  if (!data || data.length === 0) {
    if (!silent) {
      showError('表示できるデータがありません。座標が登録されている営業先を追加してください。');
    }
    return;
  }

  const hasNewData = data.length > lastDataCount;
  lastDataCount = data.length;

  allLocations = data;
  displayLocations(data, hasNewData);

  if (!silent) {
    centerMap();
  }

  document.getElementById('count').textContent = data.length;

  if (hasNewData && silent) {
    showNewDataNotification();
  }
}

function showNewDataNotification() {
  const notification = document.createElement('div');
  const rightOffset = sidebarVisible ? '370px' : '20px';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: ${rightOffset};
    background: #4caf50;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-size: 14px;
  `;
  notification.innerHTML = `🎉 新しい営業先が追加されました！`;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}

function onError(error) {
  document.getElementById('loading').classList.add('hidden');
  showError('データの読み込みに失敗しました: ' + (error.message || error));
}

function showError(message) {
  const sidebar = document.getElementById('sidebar-content');
  sidebar.innerHTML = `<div class="error-message">${message}</div>`;
}

// ========================================
// 営業先表示
// ========================================

function displayLocations(locations, highlightNew = false) {
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  const sidebar = document.getElementById('sidebar-content');
  sidebar.innerHTML = '';

  if (locations.length === 0) {
    sidebar.innerHTML = '<div style="padding: 20px; text-align: center; color: #666; font-size: 13px;">検索結果がありません</div>';
    return;
  }

  locations.forEach((loc, index) => {
    const shape = getMarkerShape(loc.kubun);
    const color = getMarkerColor(loc.visitHistory);
    const visitStatus = getVisitStatus(loc.visitHistory);
    const hasDuplicates = loc.duplicates && loc.duplicates.length > 0;

    const marker = new google.maps.Marker({
      position: { lat: loc.lat, lng: loc.lng },
      map: map,
      title: loc.company,
      icon: createMarkerIcon(shape, color),
      label: hasDuplicates ? {
        text: '⚠️',
        color: '#ff9800',
        fontSize: '16px',
        fontWeight: 'bold'
      } : null,
      animation: highlightNew && index === locations.length - 1 ? google.maps.Animation.BOUNCE : google.maps.Animation.DROP
    });

    if (highlightNew && index === locations.length - 1) {
      setTimeout(() => marker.setAnimation(null), 3000);
    }

    marker.addListener('click', () => {
      showInfo(loc, marker);
      highlightSidebarItem(index);
    });

    markers.push(marker);

    const kubunClass = loc.kubun ? `kubun-${loc.kubun}` : 'kubun-default';
    const shapeClass = `shape-${shape}`;

    const item = document.createElement('div');
    item.className = 'location-item';
    if (highlightNew && index === locations.length - 1) {
      item.classList.add('new');
    }
    item.id = `item-${index}`;

    let shapeIndicatorContent = '';
    if (shape === 'star') {
      shapeIndicatorContent = `<span class="shape-indicator ${shapeClass}" style="color: ${color}; border: none;"></span>`;
    } else {
      shapeIndicatorContent = `<span class="shape-indicator ${shapeClass}" style="border-color: ${color};"></span>`;
    }

    // 重複情報の表示
    const duplicateBadge = hasDuplicates ?
      `<span class="duplicate-badge" title="${loc.duplicates.join(', ')}も登録">⚠️ 重複</span>` : '';
    const duplicateInfo = hasDuplicates ?
      `<div class="duplicate-info">👥 ${loc.duplicates.join(', ')}も登録</div>` : '';

    item.innerHTML = `
      <div class="location-name">
        ${shapeIndicatorContent}
        ${index + 1}. ${escapeHtml(loc.company)}
        ${highlightNew && index === locations.length - 1 ? '<span class="update-badge">NEW</span>' : ''}
        ${duplicateBadge}
      </div>
      <div class="location-address">${escapeHtml(loc.address)}</div>
      ${duplicateInfo}
      ${loc.memo ? `<div class="location-memo">📝 ${escapeHtml(loc.memo)}</div>` : ''}
      <div>
        ${loc.kubun ? `<span class="location-kubun ${kubunClass}">${escapeHtml(loc.kubun)}</span>` : ''}
        <span class="visit-status ${visitStatus.class}">${visitStatus.label}</span>
      </div>
    `;
    item.onclick = () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar.classList.contains('mobile-visible')) {
        showMobileModal(loc);
      } else {
        map.setCenter({ lat: loc.lat, lng: loc.lng });
        map.setZoom(17);
        showInfo(loc, marker);
        highlightSidebarItem(index);
      }
    };
    sidebar.appendChild(item);
  });
}

function showInfo(loc, marker) {
  const hasValidWebsite = loc.website &&
                          loc.website.trim() !== '' &&
                          !loc.website.includes('google.com/search') &&
                          !loc.website.includes('住所取得失敗');

  const hasValidSansanUrl = loc.sansanUrl &&
                             loc.sansanUrl.trim() !== '' &&
                             (loc.sansanUrl.includes('sansan.com') || loc.sansanUrl.includes('ap.sansan.com'));

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(loc.company)}`;

  const escapedCompany = loc.company.replace(/'/g, "\\'").replace(/"/g, '&quot;');

  let visitHistoryHtml = '';
  if (loc.visitHistory && loc.visitHistory.length > 0) {
    const sortedHistory = [...loc.visitHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    visitHistoryHtml = `
      <div class="visit-history-section">
        <div class="visit-history-title">📅 訪問履歴 (${loc.visitHistory.length}件)</div>
        ${sortedHistory.slice(0, 3).map(visit => `
          <div class="visit-record">
            <div class="visit-date">${formatDate(visit.date)}</div>
            ${visit.note ? `<div class="visit-note">${escapeHtml(visit.note)}</div>` : ''}
          </div>
        `).join('')}
        ${sortedHistory.length > 3 ? `<div style="font-size: 11px; color: #999; text-align: center; margin-top: 4px;">他 ${sortedHistory.length - 3}件</div>` : ''}
      </div>
    `;
  } else {
    visitHistoryHtml = `
      <div class="visit-history-section">
        <div class="visit-history-title">📅 訪問履歴</div>
        <div class="no-visits">まだ訪問履歴がありません</div>
      </div>
    `;
  }

  const canAddVisit = currentSalesman === 'self';

  const teikokyLinkId = `teikoku-link-${loc.row}`;

  const content = `
    <div style="padding: 14px; min-width: 280px; max-width: 350px;">
      <h3 style="margin: 0 0 8px 0; color: #333; font-size: 15px; font-weight: 600;">${escapeHtml(loc.company)}</h3>
      <p style="margin: 6px 0; color: #666; font-size: 13px; line-height: 1.5;">
        📍 ${escapeHtml(loc.address)}
      </p>
      ${loc.memo ? `<p style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px; color: #555; font-size: 13px; line-height: 1.4; border-left: 3px solid #4285f4;">📝 ${escapeHtml(loc.memo)}</p>` : ''}
      ${loc.kubun ? `<p style="margin: 6px 0; color: #666; font-size: 13px;">🏷️ ${escapeHtml(loc.kubun)}</p>` : ''}
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #eee;">
        <div id="${teikokyLinkId}" style="margin: 6px 0;">
          <span class="teikoku-loading">🏢 帝国データバンク情報を確認中...</span>
        </div>
        ${hasValidSansanUrl
          ? `<a href="${escapeHtml(loc.sansanUrl)}" target="_blank"
               style="display: block; margin: 6px 0; color: #4285f4; text-decoration: none; font-size: 13px;">
              📇 Sansanで確認 →
            </a>`
          : `<a href="javascript:void(0)" onclick="copyToClipboardAndOpenSansan('${escapedCompany}')"
               style="display: block; margin: 6px 0; color: #4285f4; text-decoration: none; font-size: 13px; cursor: pointer;">
              📇 Sansanで検索（会社名をコピー） →
            </a>`}
        <a href="${searchUrl}" target="_blank"
           style="display: block; margin: 6px 0; color: #4285f4; text-decoration: none; font-size: 13px;">
          🔍 Google検索 →
        </a>
        ${hasValidWebsite
          ? `<a href="${escapeHtml(loc.website)}" target="_blank"
               style="display: block; margin: 6px 0; color: #4285f4; text-decoration: none; font-size: 13px;">
              🌐 ウェブサイト →
            </a>`
          : ''}
        <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}"
           target="_blank"
           style="display: block; margin: 6px 0; color: #4285f4; text-decoration: none; font-size: 13px;">
          🗺️ ルート検索 →
        </a>
      </div>
      ${visitHistoryHtml}
      ${canAddVisit ? `
      <div class="add-visit-form">
        <input type="date" id="visit-date-${loc.row}" value="${getTodayDate()}" max="${getTodayDate()}">
        <textarea id="visit-note-${loc.row}" placeholder="訪問メモを入力..."></textarea>
        <button class="add-visit-btn" onclick="addVisit(${loc.row})">訪問履歴を追加</button>
      </div>
      ` : ''}
    </div>
  `;

  infoWindow.setContent(content);
  infoWindow.open(map, marker);

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((result) => {
        const linkElement = document.getElementById(teikokyLinkId);
        if (linkElement) {
          if (result.found) {
            linkElement.innerHTML = `
              <a href="${escapeHtml(result.url)}" target="_blank"
                 style="display: block; color: #4285f4; text-decoration: none; font-size: 13px;">
                🏢 帝国データバンク（${escapeHtml(result.fileName)}） →
              </a>
            `;
          } else {
            linkElement.innerHTML = '<span style="color: #999; font-size: 12px;">🏢 帝国データバンク情報なし</span>';
          }
        }
      })
      .withFailureHandler((error) => {
        console.error('帝国データバンクPDF検索エラー:', error);
        const linkElement = document.getElementById(teikokyLinkId);
        if (linkElement) {
          linkElement.innerHTML = '<span style="color: #999; font-size: 12px;">🏢 帝国データバンク情報なし</span>';
        }
      })
      .findTeikokyPDF(loc.company);
  } else {
    const linkElement = document.getElementById(teikokyLinkId);
    if (linkElement) {
      linkElement.innerHTML = '<span style="color: #999; font-size: 12px;">🏢 帝国データバンク情報なし</span>';
    }
  }
}

function copyToClipboardAndOpenSansan(companyName) {
  navigator.clipboard.writeText(companyName).then(() => {
    showLocationStatus(`「${companyName}」をコピーしました`, 'success');
    setTimeout(() => {
      window.open('https://ap.sansan.com/', '_blank');
    }, 500);
  }).catch(err => {
    console.error('クリップボードへのコピー失敗:', err);
    const msg = `会社名: ${companyName}\n\n手動でコピーしてください`;
    if (confirm(msg + '\n\nSansanを開きますか？')) {
      window.open('https://ap.sansan.com/', '_blank');
    }
  });
}

// ========================================
// ユーティリティ関数
// ========================================

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addVisit(row) {
  const dateInput = document.getElementById(`visit-date-${row}`);
  const noteInput = document.getElementById(`visit-note-${row}`);

  const visitDate = dateInput.value;
  const visitNote = noteInput.value.trim();

  if (!visitDate) {
    alert('訪問日を選択してください');
    return;
  }

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '追加中...';

    google.script.run
      .withSuccessHandler(() => {
        loadData();
        loadStats();
        infoWindow.close();
      })
      .withFailureHandler((error) => {
        alert('追加に失敗しました: ' + error.message);
        btn.disabled = false;
        btn.textContent = '訪問履歴を追加';
      })
      .addVisitRecord(row, visitDate, visitNote);
  } else {
    alert('この機能はGoogle Apps Script環境でのみ動作します');
  }
}

function highlightSidebarItem(index) {
  document.querySelectorAll('.location-item').forEach(item => {
    item.classList.remove('active');
  });
  const item = document.getElementById(`item-${index}`);
  if (item) {
    item.classList.add('active');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// モバイルモーダル
// ========================================

function showMobileModal(loc) {
  const modal = document.getElementById('mobile-modal');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('modal-content');

  title.textContent = loc.company;

  const hasValidWebsite = loc.website &&
                          loc.website.trim() !== '' &&
                          !loc.website.includes('google.com/search') &&
                          !loc.website.includes('住所取得失敗');

  const hasValidSansanUrl = loc.sansanUrl &&
                             loc.sansanUrl.trim() !== '' &&
                             (loc.sansanUrl.includes('sansan.com') || loc.sansanUrl.includes('ap.sansan.com'));

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(loc.company)}`;
  const escapedCompany = loc.company.replace(/'/g, "\\'").replace(/"/g, '&quot;');

  let visitHistoryHtml = '';
  if (loc.visitHistory && loc.visitHistory.length > 0) {
    const sortedHistory = [...loc.visitHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    visitHistoryHtml = `
      <div style="margin: 28px 0;">
        <p style="font-weight: 700; font-size: 20px; margin-bottom: 16px;">📅 訪問履歴 (${loc.visitHistory.length}件)</p>
        ${sortedHistory.slice(0, 5).map(visit => `
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #4285f4;">
            <div style="font-weight: 600; color: #4285f4; font-size: 17px; margin-bottom: 6px;">${formatDate(visit.date)}</div>
            ${visit.note ? `<div style="color: #555; font-size: 17px; line-height: 1.6;">${escapeHtml(visit.note)}</div>` : ''}
          </div>
        `).join('')}
        ${sortedHistory.length > 5 ? `<div style="font-size: 16px; color: #999; text-align: center; margin-top: 12px;">他 ${sortedHistory.length - 5}件</div>` : ''}
      </div>
    `;
  } else {
    visitHistoryHtml = `
      <div style="margin: 28px 0;">
        <p style="font-weight: 700; font-size: 20px; margin-bottom: 12px;">📅 訪問履歴</p>
        <p style="color: #999; font-size: 17px; font-style: italic;">まだ訪問履歴がありません</p>
      </div>
    `;
  }

  const canAddVisit = currentSalesman === 'self';
  const teikokyLinkId = `teikoku-link-mobile-${loc.row}`;

  content.innerHTML = `
    <p style="margin: 20px 0; font-size: 18px;"><strong style="font-size: 19px;">📍 住所:</strong><br>${escapeHtml(loc.address)}</p>
    ${loc.memo ? `<div style="margin: 20px 0; padding: 16px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #4285f4; font-size: 18px;"><strong style="font-size: 19px;">📝 メモ:</strong><br>${escapeHtml(loc.memo)}</div>` : ''}
    ${loc.kubun ? `<p style="margin: 20px 0; font-size: 18px;"><strong style="font-size: 19px;">🏷️ 区分:</strong> ${escapeHtml(loc.kubun)}</p>` : ''}

    <div style="margin: 28px 0;">
      <p style="font-weight: 700; font-size: 20px; margin-bottom: 16px;">🔗 リンク</p>
      <div id="${teikokyLinkId}" style="margin: 12px 0; font-size: 17px; color: #999;">
        🏢 帝国データバンク情報を確認中...
      </div>
      ${hasValidSansanUrl
        ? `<a href="${escapeHtml(loc.sansanUrl)}" target="_blank" style="display: block; margin: 12px 0; padding: 18px 20px; background: #f8f9fa; color: #4285f4; text-decoration: none; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 18px; min-height: 60px; display: flex; align-items: center;">
            📇 Sansanで確認 →
          </a>`
        : `<a href="javascript:void(0)" onclick="copyToClipboardAndOpenSansan('${escapedCompany}')" style="display: block; margin: 12px 0; padding: 18px 20px; background: #f8f9fa; color: #4285f4; text-decoration: none; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 18px; min-height: 60px; display: flex; align-items: center;">
            📇 Sansanで検索（会社名をコピー） →
          </a>`}
      <a href="${searchUrl}" target="_blank" style="display: block; margin: 12px 0; padding: 18px 20px; background: #f8f9fa; color: #4285f4; text-decoration: none; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 18px; min-height: 60px; display: flex; align-items: center;">
        🔍 Google検索 →
      </a>
      ${hasValidWebsite
        ? `<a href="${escapeHtml(loc.website)}" target="_blank" style="display: block; margin: 12px 0; padding: 18px 20px; background: #f8f9fa; color: #4285f4; text-decoration: none; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 18px; min-height: 60px; display: flex; align-items: center;">
            🌐 ウェブサイト →
          </a>`
        : ''}
      <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}" target="_blank" style="display: block; margin: 12px 0; padding: 18px 20px; background: #f8f9fa; color: #4285f4; text-decoration: none; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 18px; min-height: 60px; display: flex; align-items: center;">
        🗺️ ルート検索 →
      </a>
    </div>

    ${visitHistoryHtml}

    ${canAddVisit ? `
    <div style="margin: 28px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; border: 2px dashed #ccc;">
      <p style="font-weight: 700; font-size: 20px; margin-bottom: 16px;">➕ 訪問履歴を追加</p>
      <input type="date" id="visit-date-mobile-${loc.row}" value="${getTodayDate()}" max="${getTodayDate()}" style="width: 100%; padding: 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 18px; margin-bottom: 14px; min-height: 56px;">
      <textarea id="visit-note-mobile-${loc.row}" placeholder="訪問メモを入力..." style="width: 100%; padding: 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 18px; margin-bottom: 14px; min-height: 100px; font-family: inherit; resize: vertical;"></textarea>
      <button onclick="addVisitFromModal(${loc.row})" style="width: 100%; padding: 18px; background: #4285f4; color: white; border: none; border-radius: 8px; font-size: 19px; font-weight: 600; cursor: pointer; min-height: 60px;">訪問履歴を追加</button>
    </div>
    ` : ''}

    ${canAddVisit ? `
    <div style="margin: 28px 0; padding: 20px; background: #fff3f3; border-radius: 10px; border: 2px solid #ffcdd2;">
      <button onclick="deleteLocationFromModal(${loc.row}, '${escapeHtml(loc.company).replace(/'/g, "\\'")}', event)" style="width: 100%; padding: 18px; background: #dc3545; color: white; border: none; border-radius: 8px; font-size: 19px; font-weight: 600; cursor: pointer; min-height: 60px;">🗑️ この営業先を削除</button>
      <p style="margin-top: 12px; font-size: 15px; color: #666; text-align: center;">※削除すると元に戻せません</p>
    </div>
    ` : ''}
  `;

  modal.classList.add('show');

  // 帝国データバンクPDF検索
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((result) => {
        const linkElement = document.getElementById(teikokyLinkId);
        if (linkElement) {
          if (result.found) {
            linkElement.innerHTML = `
              <a href="${escapeHtml(result.url)}" target="_blank" style="display: block; margin: 12px 0; padding: 18px 20px; background: #f8f9fa; color: #4285f4; text-decoration: none; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 18px; min-height: 60px; display: flex; align-items: center;">
                🏢 帝国データバンク（${escapeHtml(result.fileName)}） →
              </a>
            `;
          } else {
            linkElement.innerHTML = '<span style="color: #999; font-size: 17px;">🏢 帝国データバンク情報なし</span>';
          }
        }
      })
      .withFailureHandler((error) => {
        console.error('帝国データバンクPDF検索エラー:', error);
        const linkElement = document.getElementById(teikokyLinkId);
        if (linkElement) {
          linkElement.innerHTML = '<span style="color: #999; font-size: 17px;">🏢 帝国データバンク情報なし</span>';
        }
      })
      .findTeikokyPDF(loc.company);
  } else {
    const linkElement = document.getElementById(teikokyLinkId);
    if (linkElement) {
      linkElement.innerHTML = '<span style="color: #999; font-size: 17px;">🏢 帝国データバンク情報なし</span>';
    }
  }
}

function closeMobileModal() {
  const modal = document.getElementById('mobile-modal');
  modal.classList.remove('show');
}

function addVisitFromModal(row) {
  const dateInput = document.getElementById(`visit-date-mobile-${row}`);
  const noteInput = document.getElementById(`visit-note-mobile-${row}`);

  const visitDate = dateInput.value;
  const visitNote = noteInput.value.trim();

  if (!visitDate) {
    alert('訪問日を選択してください');
    return;
  }

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '追加中...';

    google.script.run
      .withSuccessHandler(() => {
        loadData();
        loadStats();
        closeMobileModal();
        showLocationStatus('✅ 訪問履歴を追加しました', 'success');
      })
      .withFailureHandler((error) => {
        alert('追加に失敗しました: ' + error.message);
        btn.disabled = false;
        btn.textContent = '訪問履歴を追加';
      })
      .addVisitRecord(row, visitDate, visitNote);
  } else {
    alert('この機能はGoogle Apps Script環境でのみ動作します');
  }
}

function deleteLocationFromModal(row, companyName, event) {
  // 確認ダイアログを表示
  const confirmMessage = `「${companyName}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`;
  if (!confirm(confirmMessage)) {
    return;
  }

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '削除中...';

    google.script.run
      .withSuccessHandler((result) => {
        if (result.success) {
          loadData();
          loadStats();
          closeMobileModal();
          showLocationStatus('✅ 削除しました', 'success');
        } else {
          alert('削除に失敗しました: ' + result.message);
          btn.disabled = false;
          btn.textContent = originalText;
        }
      })
      .withFailureHandler((error) => {
        alert('削除に失敗しました: ' + error.message);
        btn.disabled = false;
        btn.textContent = originalText;
      })
      .deleteLocation(row);
  } else {
    alert('この機能はGoogle Apps Script環境でのみ動作します');
  }
}

// ========================================
// フィルタリング・検索
// ========================================

function filterByKubun() {
  const query = document.getElementById('search').value.toLowerCase();
  const kubunFilter = document.getElementById('kubun-filter').value;
  filterLocations(query, kubunFilter);
}

function filterLocations(query, kubunFilter) {
  let filtered = allLocations;

  if (kubunFilter !== '') {
    filtered = filtered.filter(loc => loc.kubun === kubunFilter);
  }

  if (query !== '') {
    filtered = filtered.filter(loc =>
      loc.company.toLowerCase().includes(query) ||
      loc.address.toLowerCase().includes(query) ||
      (loc.kubun && loc.kubun.toLowerCase().includes(query)) ||
      (loc.memo && loc.memo.toLowerCase().includes(query))
    );
  }

  displayLocations(filtered);
  if (filtered.length > 0) {
    centerMap();
  }
}

function centerMap() {
  if (markers.length === 0) return;

  const bounds = new google.maps.LatLngBounds();
  markers.forEach(marker => bounds.extend(marker.getPosition()));
  map.fitBounds(bounds);

  google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
    if (map.getZoom() > 16) {
      map.setZoom(16);
    }
  });
}

// ========================================
// イベントリスナー
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const kubunFilter = document.getElementById('kubun-filter').value;
      filterLocations(query, kubunFilter);
    });
  }
});

// ページ離脱時に位置情報トラッキングを停止
window.addEventListener('beforeunload', () => {
  stopLocationTracking();
});

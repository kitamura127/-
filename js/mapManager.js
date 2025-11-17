/**
 * Map Manager
 * Handles all map-related functionality
 */
class MapManager {
  constructor() {
    this.map = null;
    this.markers = [];
    this.infoWindow = null;
    this.currentZoom = CONFIG.DEFAULT_ZOOM;
    this.currentLocationMarker = null;
    this.isTrackingLocation = false;
    this.watchId = null;
  }

  /**
   * Initialize the map
   */
  init() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: CONFIG.DEFAULT_ZOOM,
      center: CONFIG.DEFAULT_MAP_CENTER,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: CONFIG.MAP_STYLES
    });

    this.map.addListener('zoom_changed', () => {
      this.currentZoom = this.map.getZoom();
    });

    this.infoWindow = new google.maps.InfoWindow();
  }

  /**
   * Add markers to the map
   * @param {Array} locations - Array of location objects
   * @param {boolean} highlightNew - Whether to highlight the newest marker
   */
  addMarkers(locations, highlightNew = false) {
    // Clear existing markers
    this.clearMarkers();

    locations.forEach((loc, index) => {
      const shape = Utils.getMarkerShape(loc.kubun);
      const color = Utils.getMarkerColor(loc.visitHistory);

      const marker = new google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: this.map,
        title: loc.company,
        icon: Utils.createMarkerIcon(shape, color),
        animation: highlightNew && index === locations.length - 1
          ? google.maps.Animation.BOUNCE
          : google.maps.Animation.DROP
      });

      if (highlightNew && index === locations.length - 1) {
        setTimeout(() => marker.setAnimation(null), 3000);
      }

      marker.addListener('click', () => {
        this.showLocationInfo(loc, marker);
        window.app.sidebarManager.highlightItem(index);
      });

      this.markers.push(marker);
    });
  }

  /**
   * Clear all markers from the map
   */
  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  /**
   * Center map to show all markers
   */
  centerMap() {
    if (this.markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    this.markers.forEach(marker => bounds.extend(marker.getPosition()));
    this.map.fitBounds(bounds);

    google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
      if (this.map.getZoom() > CONFIG.MAX_ZOOM) {
        this.map.setZoom(CONFIG.MAX_ZOOM);
      }
    });
  }

  /**
   * Show location information window
   * @param {Object} loc - Location object
   * @param {Object} marker - Google Maps marker
   */
  showLocationInfo(loc, marker) {
    const hasValidWebsite = loc.website &&
      loc.website.trim() !== '' &&
      !loc.website.includes('google.com/search') &&
      !loc.website.includes('住所取得失敗');

    const hasValidSansanUrl = loc.sansanUrl &&
      loc.sansanUrl.trim() !== '' &&
      (loc.sansanUrl.includes('sansan.com') || loc.sansanUrl.includes('ap.sansan.com'));

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(loc.company)}`;
    const escapedCompany = loc.company.replace(/'/g, "\\'").replace(/"/g, '&quot;');

    const visitHistoryHtml = this.buildVisitHistoryHtml(loc.visitHistory);
    const canAddVisit = window.app.dataManager.currentSalesman === 'self';

    const content = `
      <div style="padding: 14px; min-width: 280px; max-width: 350px;">
        <h3 style="margin: 0 0 8px 0; color: #333; font-size: 15px; font-weight: 600;">${Utils.escapeHtml(loc.company)}</h3>
        <p style="margin: 6px 0; color: #666; font-size: 13px; line-height: 1.5;">
          📍 ${Utils.escapeHtml(loc.address)}
        </p>
        ${loc.memo ? `<p style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px; color: #555; font-size: 13px; line-height: 1.4; border-left: 3px solid #4285f4;">📝 ${Utils.escapeHtml(loc.memo)}</p>` : ''}
        ${loc.kubun ? `<p style="margin: 6px 0; color: #666; font-size: 13px;">🏷️ ${Utils.escapeHtml(loc.kubun)}</p>` : ''}
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #eee;">
          ${hasValidSansanUrl
            ? `<a href="${Utils.escapeHtml(loc.sansanUrl)}" target="_blank"
                 style="display: block; margin: 6px 0; color: #4285f4; text-decoration: none; font-size: 13px;">
                📇 Sansanで確認 →
              </a>`
            : `<a href="javascript:void(0)" onclick="window.app.mapManager.copyToClipboardAndOpenSansan('${escapedCompany}')"
                 style="display: block; margin: 6px 0; color: #4285f4; text-decoration: none; font-size: 13px; cursor: pointer;">
                📇 Sansanで検索（会社名をコピー） →
              </a>`}
          <a href="${searchUrl}" target="_blank"
             style="display: block; margin: 6px 0; color: #4285f4; text-decoration: none; font-size: 13px;">
            🔍 Google検索 →
          </a>
          ${hasValidWebsite
            ? `<a href="${Utils.escapeHtml(loc.website)}" target="_blank"
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
          <input type="date" id="visit-date-${loc.row}" value="${Utils.getTodayDate()}" max="${Utils.getTodayDate()}">
          <textarea id="visit-note-${loc.row}" placeholder="訪問メモを入力..."></textarea>
          <button class="add-visit-btn" onclick="window.app.addVisit(${loc.row})">訪問履歴を追加</button>
        </div>
        ` : ''}
      </div>
    `;

    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }

  /**
   * Build visit history HTML
   * @param {Array} visitHistory - Visit history array
   * @returns {string} HTML string
   */
  buildVisitHistoryHtml(visitHistory) {
    if (!visitHistory || visitHistory.length === 0) {
      return `
        <div class="visit-history-section">
          <div class="visit-history-title">📅 訪問履歴</div>
          <div class="no-visits">まだ訪問履歴がありません</div>
        </div>
      `;
    }

    const sortedHistory = [...visitHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="visit-history-section">
        <div class="visit-history-title">📅 訪問履歴 (${visitHistory.length}件)</div>
        ${sortedHistory.slice(0, 3).map(visit => `
          <div class="visit-record">
            <div class="visit-date">${Utils.formatDate(visit.date)}</div>
            ${visit.note ? `<div class="visit-note">${Utils.escapeHtml(visit.note)}</div>` : ''}
          </div>
        `).join('')}
        ${sortedHistory.length > 3 ? `<div style="font-size: 11px; color: #999; text-align: center; margin-top: 4px;">他 ${sortedHistory.length - 3}件</div>` : ''}
      </div>
    `;
  }

  /**
   * Copy company name to clipboard and open Sansan
   * @param {string} companyName - Company name
   */
  copyToClipboardAndOpenSansan(companyName) {
    Utils.copyToClipboard(companyName).then(() => {
      this.showLocationStatus(`「${companyName}」をコピーしました`, 'success');
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

  /**
   * Start location tracking
   */
  startLocationTracking() {
    if (!navigator.geolocation) {
      this.showLocationStatus('お使いのブラウザは位置情報に対応していません', 'error');
      return;
    }

    this.showLocationStatus('現在地を取得中...', 'loading');

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        this.updateCurrentLocation(pos);
        this.isTrackingLocation = true;
        this.showLocationStatus('現在地を追跡中', 'success');
      },
      (error) => {
        console.error('位置情報エラー:', error);
        let message = '位置情報の取得に失敗しました';
        if (error.code === error.PERMISSION_DENIED) {
          message = '位置情報の使用が許可されていません';
        }
        this.showLocationStatus(message, 'error');
        this.stopLocationTracking();
      },
      CONFIG.LOCATION_OPTIONS
    );
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.currentLocationMarker) {
      this.currentLocationMarker.setMap(null);
      this.currentLocationMarker = null;
    }

    this.isTrackingLocation = false;
    this.hideLocationStatus();
  }

  /**
   * Update current location marker
   * @param {Object} pos - Position object with lat and lng
   */
  updateCurrentLocation(pos) {
    if (!this.currentLocationMarker) {
      this.currentLocationMarker = new google.maps.Marker({
        map: this.map,
        icon: Utils.createCurrentLocationIcon(),
        title: '現在地',
        zIndex: 1000
      });

      this.currentLocationMarker.addListener('click', () => {
        const content = `
          <div style="padding: 12px; min-width: 180px;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">📍 あなたの現在地</h3>
            <p style="margin: 4px 0; color: #666; font-size: 12px;">
              緯度: ${pos.lat.toFixed(6)}<br>
              経度: ${pos.lng.toFixed(6)}
            </p>
          </div>
        `;
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, this.currentLocationMarker);
      });

      this.map.setCenter(pos);
      this.map.setZoom(CONFIG.TRACKING_ZOOM);
    }

    this.currentLocationMarker.setPosition(pos);
  }

  /**
   * Toggle current location tracking
   */
  toggleCurrentLocation() {
    const btn = document.getElementById('location-btn');

    if (this.isTrackingLocation) {
      this.stopLocationTracking();
      btn.classList.remove('active');
      btn.innerHTML = '📍 現在地';
    } else {
      this.startLocationTracking();
      btn.classList.add('active');
      btn.innerHTML = '⏹️ 停止';
    }
  }

  /**
   * Show location status message
   * @param {string} message - Message to display
   * @param {string} type - Type of message (success, error, loading)
   */
  showLocationStatus(message, type) {
    const status = document.getElementById('location-status');
    status.textContent = message;
    status.style.display = 'block';

    if (type === 'success') {
      status.style.background = '#4caf50';
      status.style.color = 'white';
      setTimeout(() => this.hideLocationStatus(), 3000);
    } else if (type === 'error') {
      status.style.background = '#f44336';
      status.style.color = 'white';
      setTimeout(() => this.hideLocationStatus(), 5000);
    } else {
      status.style.background = 'white';
      status.style.color = '#333';
    }
  }

  /**
   * Hide location status message
   */
  hideLocationStatus() {
    const status = document.getElementById('location-status');
    status.style.display = 'none';
  }

  /**
   * Trigger map resize (useful after sidebar toggle)
   */
  resize() {
    setTimeout(() => {
      google.maps.event.trigger(this.map, 'resize');
    }, 300);
  }
}

/**
 * Sidebar Manager
 * Handles all sidebar-related functionality
 */
class SidebarManager {
  constructor() {
    this.leftSidebarVisible = true;
    this.rightSidebarVisible = true;
    this.sheetVisible = false;
    this.currentLeftTab = 'insights';
    this.currentInsights = null;
    this.newCases = [];
  }

  /**
   * Initialize sidebars
   */
  init() {
    // Set up search input
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      this.handleSearch(e.target.value);
    }, 300));

    // Initialize left sidebar tab
    this.switchLeftTab('insights');
  }

  /**
   * Toggle left sidebar
   */
  toggleLeftSidebar() {
    const sidebar = document.getElementById('left-sidebar');
    const toggle = document.getElementById('left-sidebar-toggle');
    const icon = document.getElementById('left-toggle-icon');

    this.leftSidebarVisible = !this.leftSidebarVisible;

    if (this.leftSidebarVisible) {
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

    window.app.mapManager.resize();
  }

  /**
   * Toggle right sidebar
   */
  toggleRightSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const icon = document.getElementById('toggle-icon');

    this.rightSidebarVisible = !this.rightSidebarVisible;

    if (this.rightSidebarVisible) {
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

    window.app.mapManager.resize();
  }

  /**
   * Toggle sheet container
   */
  toggleSheet() {
    const container = document.getElementById('sheet-container');
    const mapContainer = document.getElementById('map-container');
    const toggle = document.getElementById('sheet-toggle');
    const icon = document.getElementById('sheet-toggle-icon');
    const text = document.getElementById('sheet-toggle-text');

    this.sheetVisible = !this.sheetVisible;

    if (this.sheetVisible) {
      container.classList.add('visible');
      mapContainer.classList.add('with-sheet');
      toggle.classList.add('sheet-open');
      icon.textContent = '▼';
      text.textContent = 'スプレッドシートを閉じる';

      const spreadsheetUrl = window.app.dataManager.spreadsheetUrl;
      if (spreadsheetUrl && !document.getElementById('sheet-frame').src) {
        document.getElementById('sheet-frame').src = spreadsheetUrl;
      }
    } else {
      container.classList.remove('visible');
      mapContainer.classList.remove('with-sheet');
      toggle.classList.remove('sheet-open');
      icon.textContent = '▲';
      text.textContent = 'スプレッドシートを表示';
    }

    setTimeout(() => {
      window.app.mapManager.resize();
      if (!this.sheetVisible) {
        window.app.dataManager.loadData();
      }
    }, 300);
  }

  /**
   * Switch left sidebar tab
   * @param {string} tabName - Tab name (insights or newcases)
   */
  switchLeftTab(tabName) {
    this.currentLeftTab = tabName;

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

  /**
   * Refresh left sidebar content
   */
  refreshLeftSidebar() {
    if (this.currentLeftTab === 'insights') {
      this.runAnalysisAndLoadInsights();
    } else {
      window.app.dataManager.loadNewCases();
    }
  }

  /**
   * Run analysis and load insights
   */
  runAnalysisAndLoadInsights() {
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

    if (Utils.isGASAvailable()) {
      google.script.run
        .withSuccessHandler(() => {
          setTimeout(() => {
            window.app.dataManager.loadInsights();
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
      window.app.dataManager.loadInsights();
    }
  }

  /**
   * Display insights in left sidebar
   * @param {Object} data - Insights data
   */
  displayInsights(data) {
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

    this.currentInsights = data.insights;
    const timestamp = new Date(data.timestamp);

    let html = '';

    if (this.currentInsights.urgent_opportunities && this.currentInsights.urgent_opportunities.length > 0) {
      this.currentInsights.urgent_opportunities.forEach((opp, index) => {
        const sourceCompany = opp.source_company || opp.company || opp.updated_company || opp.visit_company || '会社名不明';

        html += `
          <div class="insight-item" onclick="window.app.sidebarManager.showInsightDetail(${index})">
            <div class="insight-company"><strong>${Utils.escapeHtml(sourceCompany)}</strong></div>
            <div class="insight-summary">${Utils.escapeHtml(opp.detail)}</div>
            <div class="insight-source">📝 ${Utils.escapeHtml(opp.source_salesman)} (${Utils.formatShortDate(opp.date)})</div>
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

  /**
   * Show insight detail in info window
   * @param {number} index - Insight index
   */
  showInsightDetail(index) {
    if (!this.currentInsights || !this.currentInsights.urgent_opportunities) return;

    const opp = this.currentInsights.urgent_opportunities[index];
    const typeEmoji = opp.type.includes('繁忙') ? '🔥' :
      opp.type.includes('物件') ? '📅' :
        opp.type.includes('施工') ? '🏢' : '💰';

    const sourceCompany = opp.source_company || opp.company || opp.updated_company || opp.visit_company || '会社名不明';

    const content = `
      <div style="padding: 15px; min-width: 280px; max-width: 350px;">
        <div style="margin-bottom: 12px;">
          <h3 style="margin: 0; color: #333; font-size: 15px; font-weight: 600;">
            ${typeEmoji} <strong>${Utils.escapeHtml(sourceCompany)}</strong>
          </h3>
        </div>

        <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #4285f4;">
          <p style="margin: 0; color: #333; font-size: 13px; font-weight: 600; margin-bottom: 6px;">
            ${Utils.escapeHtml(opp.summary)}
          </p>
          <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.5;">
            ${Utils.escapeHtml(opp.detail)}
          </p>
        </div>

        <div style="padding: 10px; background: #e8f5e9; border-radius: 6px;">
          <p style="margin: 0; color: #2e7d32; font-size: 11px;">
            📝 ${Utils.escapeHtml(opp.source_salesman)}<br>
            📅 ${Utils.formatDate(opp.date)}
          </p>
        </div>
      </div>
    `;

    window.app.mapManager.infoWindow.setContent(content);
    window.app.mapManager.infoWindow.setPosition(window.app.mapManager.map.getCenter());
    window.app.mapManager.infoWindow.open(window.app.mapManager.map);
  }

  /**
   * Display new cases in left sidebar
   * @param {Array} cases - Array of case objects
   */
  displayNewCases(cases) {
    this.newCases = cases;
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
        <div class="new-case-name">${Utils.escapeHtml(caseData.projectName)}</div>
        ${caseData.contractor ? `<div class="new-case-contractor">🏗️ ${Utils.escapeHtml(caseData.contractor)}</div>` : ''}
        <div class="new-case-info">📍 ${Utils.escapeHtml(caseData.address)}</div>
        <div class="new-case-price">💰 ${caseData.price.toLocaleString()}円</div>
        ${caseData.url ? `<a href="${Utils.escapeHtml(caseData.url)}" target="_blank" class="new-case-link" onclick="event.stopPropagation();">🔗 詳細を見る →</a>` : ''}
      `;
      item.onclick = () => window.app.registerNewCase(index);
      container.appendChild(item);
    });
  }

  /**
   * Display locations in right sidebar
   * @param {Array} locations - Array of location objects
   * @param {boolean} highlightNew - Whether to highlight new items
   */
  displayLocations(locations, highlightNew = false) {
    const sidebar = document.getElementById('sidebar-content');
    sidebar.innerHTML = '';

    if (locations.length === 0) {
      sidebar.innerHTML = '<div style="padding: 20px; text-align: center; color: #666; font-size: 13px;">検索結果がありません</div>';
      return;
    }

    locations.forEach((loc, index) => {
      const shape = Utils.getMarkerShape(loc.kubun);
      const color = Utils.getMarkerColor(loc.visitHistory);
      const visitStatus = Utils.getVisitStatus(loc.visitHistory);

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

      item.innerHTML = `
        <div class="location-name">
          ${shapeIndicatorContent}
          ${index + 1}. ${Utils.escapeHtml(loc.company)}
          ${highlightNew && index === locations.length - 1 ? '<span class="update-badge">NEW</span>' : ''}
        </div>
        <div class="location-address">${Utils.escapeHtml(loc.address)}</div>
        ${loc.memo ? `<div class="location-memo">📝 ${Utils.escapeHtml(loc.memo)}</div>` : ''}
        <div>
          ${loc.kubun ? `<span class="location-kubun ${kubunClass}">${Utils.escapeHtml(loc.kubun)}</span>` : ''}
          <span class="visit-status ${visitStatus.class}">${visitStatus.label}</span>
        </div>
      `;
      item.onclick = () => {
        window.app.mapManager.map.setCenter({ lat: loc.lat, lng: loc.lng });
        window.app.mapManager.map.setZoom(CONFIG.DETAIL_ZOOM);
        window.app.mapManager.showLocationInfo(loc, window.app.mapManager.markers[index]);
        this.highlightItem(index);
      };
      sidebar.appendChild(item);
    });

    document.getElementById('count').textContent = locations.length;
  }

  /**
   * Highlight sidebar item
   * @param {number} index - Item index
   */
  highlightItem(index) {
    document.querySelectorAll('.location-item').forEach(item => {
      item.classList.remove('active');
    });
    const item = document.getElementById(`item-${index}`);
    if (item) {
      item.classList.add('active');
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Handle search input
   * @param {string} query - Search query
   */
  handleSearch(query) {
    const kubunFilter = document.getElementById('kubun-filter').value;
    window.app.filterLocations(query.toLowerCase(), kubunFilter);
  }

  /**
   * Update stats panel
   * @param {Object} stats - Stats data
   */
  updateStats(stats) {
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
}

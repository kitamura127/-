/**
 * Data Manager
 * Handles all data loading and management
 */
class DataManager {
  constructor() {
    this.allLocations = [];
    this.lastDataCount = 0;
    this.spreadsheetUrl = '';
    this.currentSalesman = 'self';
    this.salesmanList = [];
  }

  /**
   * Load spreadsheet URL
   */
  loadSpreadsheetUrl() {
    if (Utils.isGASAvailable()) {
      google.script.run
        .withSuccessHandler((url) => {
          this.spreadsheetUrl = url;
        })
        .withFailureHandler((error) => {
          console.error('スプレッドシートURL取得エラー:', error);
        })
        .getSpreadsheetUrl();
    }
  }

  /**
   * Load salesman list
   */
  loadSalesmanList() {
    if (Utils.isGASAvailable()) {
      google.script.run
        .withSuccessHandler((list) => {
          this.salesmanList = list;
          this.createSalesmanSwitcher();
        })
        .withFailureHandler((error) => {
          console.error('営業マン一覧取得エラー:', error);
          this.salesmanList = [{ name: '自分', url: '', isSelf: true }];
          this.createSalesmanSwitcher();
        })
        .getSalesmanList();
    }
  }

  /**
   * Create salesman switcher dropdown
   */
  createSalesmanSwitcher() {
    const select = document.getElementById('salesman-select');
    select.innerHTML = '';

    this.salesmanList.forEach((salesman, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = (salesman.isSelf ? '👤 ' : '👥 ') + salesman.name;
      if (salesman.isSelf) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  /**
   * Switch to different salesman's data
   */
  switchSalesman() {
    const select = document.getElementById('salesman-select');
    const index = parseInt(select.value);
    const salesman = this.salesmanList[index];

    if (salesman.isSelf) {
      this.currentSalesman = 'self';
      document.getElementById('stats-panel').style.display = 'block';
      this.loadData();
      this.loadStats();
    } else {
      this.currentSalesman = index;
      document.getElementById('stats-panel').style.display = 'none';
      this.loadOtherSalesmanData(salesman.url);
    }
  }

  /**
   * Load other salesman's data
   * @param {string} url - URL to fetch data from
   */
  loadOtherSalesmanData(url) {
    this.showLoading();

    fetch(url + '?mode=data')
      .then(response => response.json())
      .then(data => {
        this.onDataLoaded(data, false);
      })
      .catch(error => {
        console.error('データ取得エラー:', error);
        this.showError('他の営業マンのデータを取得できませんでした: ' + error.message);
        this.hideLoading();
      });
  }

  /**
   * Load main data
   * @param {boolean} silent - Whether to show loading indicator
   */
  loadData(silent = false) {
    if (!silent) {
      this.showLoading();
    }

    if (this.currentSalesman !== 'self') {
      const salesman = this.salesmanList[this.currentSalesman];
      if (salesman) {
        this.loadOtherSalesmanData(salesman.url);
      }
      return;
    }

    if (Utils.isGASAvailable()) {
      google.script.run
        .withSuccessHandler((data) => this.onDataLoaded(data, silent))
        .withFailureHandler(this.onError.bind(this))
        .getMapData();
    } else {
      this.onError(new Error('データソースに接続できません'));
    }
  }

  /**
   * Handle loaded data
   * @param {Array} data - Location data array
   * @param {boolean} silent - Whether it was a silent load
   */
  onDataLoaded(data, silent = false) {
    this.hideLoading();

    if (!data || data.length === 0) {
      if (!silent) {
        this.showError('表示できるデータがありません。座標が登録されている営業先を追加してください。');
      }
      return;
    }

    const hasNewData = data.length > this.lastDataCount;
    this.lastDataCount = data.length;

    this.allLocations = data;
    this.displayLocations(data, hasNewData);

    if (!silent) {
      window.app.mapManager.centerMap();
    }

    if (hasNewData && silent) {
      Utils.showNotification('🎉 新しい営業先が追加されました！');
    }
  }

  /**
   * Handle data load error
   * @param {Error} error - Error object
   */
  onError(error) {
    this.hideLoading();
    this.showError('データの読み込みに失敗しました: ' + (error.message || error));
  }

  /**
   * Display locations on map and sidebar
   * @param {Array} locations - Location data array
   * @param {boolean} highlightNew - Whether to highlight new items
   */
  displayLocations(locations, highlightNew = false) {
    window.app.mapManager.addMarkers(locations, highlightNew);
    window.app.sidebarManager.displayLocations(locations, highlightNew);
  }

  /**
   * Filter locations by search query and kubun
   * @param {string} query - Search query
   * @param {string} kubunFilter - Kubun filter value
   */
  filterLocations(query, kubunFilter) {
    let filtered = this.allLocations;

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

    this.displayLocations(filtered);
    if (filtered.length > 0) {
      window.app.mapManager.centerMap();
    }
  }

  /**
   * Load monthly statistics
   */
  loadStats() {
    if (Utils.isGASAvailable()) {
      google.script.run
        .withSuccessHandler((stats) => {
          window.app.sidebarManager.updateStats(stats);
        })
        .withFailureHandler((error) => {
          console.error('統計データ取得エラー:', error);
        })
        .getMonthlyStats();
    }
  }

  /**
   * Edit monthly target goal
   */
  editTargetGoal() {
    if (!Utils.isGASAvailable()) {
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
            this.loadStats();
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

  /**
   * Add visit record
   * @param {number} row - Row number in spreadsheet
   */
  addVisit(row) {
    const dateInput = document.getElementById(`visit-date-${row}`);
    const noteInput = document.getElementById(`visit-note-${row}`);

    const visitDate = dateInput.value;
    const visitNote = noteInput.value.trim();

    if (!visitDate) {
      alert('訪問日を選択してください');
      return;
    }

    if (Utils.isGASAvailable()) {
      const btn = event.target;
      btn.disabled = true;
      btn.textContent = '追加中...';

      google.script.run
        .withSuccessHandler(() => {
          this.loadData();
          this.loadStats();
          window.app.mapManager.infoWindow.close();
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

  /**
   * Load insights data
   */
  loadInsights() {
    if (Utils.isGASAvailable()) {
      google.script.run
        .withSuccessHandler((data) => {
          window.app.sidebarManager.displayInsights(data);
        })
        .withFailureHandler((error) => {
          console.error('インサイト取得エラー:', error);
          window.app.sidebarManager.displayInsights(null);
        })
        .getIntelligenceInsights();
    } else {
      window.app.sidebarManager.displayInsights(null);
    }
  }

  /**
   * Load new cases
   */
  loadNewCases() {
    if (Utils.isGASAvailable()) {
      google.script.run
        .withSuccessHandler((cases) => {
          window.app.sidebarManager.displayNewCases(cases);
        })
        .withFailureHandler((error) => {
          console.error('新着案件取得エラー:', error);
          window.app.sidebarManager.displayNewCases([]);
        })
        .getNewCases();
    } else {
      window.app.sidebarManager.displayNewCases([]);
    }
  }

  /**
   * Register a new case
   * @param {number} index - Case index
   */
  registerCase(index) {
    const item = document.querySelectorAll('.new-case-item')[index];
    const caseData = window.app.sidebarManager.newCases[index];

    if (!confirm(`「${caseData.projectName}」\nをスプレッドシートに登録しますか？`)) {
      return;
    }

    item.classList.add('registering');

    if (Utils.isGASAvailable()) {
      google.script.run
        .withSuccessHandler(() => {
          window.app.mapManager.showLocationStatus('✅ 登録完了！スプレッドシートに追加しました', 'success');
          this.loadNewCases();
          this.loadData();
        })
        .withFailureHandler((error) => {
          alert('登録に失敗しました: ' + error.message);
          item.classList.remove('registering');
        })
        .registerCase(index);
    }
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    document.getElementById('loading').classList.remove('hidden');
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    const sidebar = document.getElementById('sidebar-content');
    sidebar.innerHTML = `<div class="error-message">${message}</div>`;
  }
}

/**
 * Main Application
 * Integrates all modules and handles global app logic
 */
class App {
  constructor() {
    this.mapManager = new MapManager();
    this.sidebarManager = new SidebarManager();
    this.dataManager = new DataManager();
  }

  /**
   * Initialize the application
   */
  init() {
    this.mapManager.init();
    this.sidebarManager.init();
    this.dataManager.loadSpreadsheetUrl();
    this.dataManager.loadSalesmanList();
    this.dataManager.loadData();
    this.dataManager.loadStats();
    this.dataManager.loadInsights();
    this.dataManager.loadNewCases();

    // Set up auto-refresh intervals
    this.setupAutoRefresh();

    // Set up cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * Set up auto-refresh intervals
   */
  setupAutoRefresh() {
    // Refresh new cases every minute
    setInterval(() => {
      this.dataManager.loadNewCases();
    }, CONFIG.REFRESH_INTERVALS.NEW_CASES);

    // Refresh insights every 5 minutes
    setInterval(() => {
      this.dataManager.loadInsights();
    }, CONFIG.REFRESH_INTERVALS.INSIGHTS);
  }

  /**
   * Filter locations by query and kubun
   * @param {string} query - Search query
   * @param {string} kubunFilter - Kubun filter value
   */
  filterLocations(query, kubunFilter) {
    this.dataManager.filterLocations(query, kubunFilter);
  }

  /**
   * Add visit record
   * @param {number} row - Row number
   */
  addVisit(row) {
    this.dataManager.addVisit(row);
  }

  /**
   * Register new case
   * @param {number} index - Case index
   */
  registerNewCase(index) {
    this.dataManager.registerCase(index);
  }

  /**
   * Clean up resources on page unload
   */
  cleanup() {
    this.mapManager.stopLocationTracking();
  }
}

// Global functions for HTML onclick handlers
function initMap() {
  window.app = new App();
  window.app.init();
}

function toggleLeftSidebar() {
  window.app.sidebarManager.toggleLeftSidebar();
}

function toggleSidebar() {
  window.app.sidebarManager.toggleRightSidebar();
}

function toggleSheet() {
  window.app.sidebarManager.toggleSheet();
}

function switchLeftTab(tabName) {
  window.app.sidebarManager.switchLeftTab(tabName);
}

function refreshLeftSidebar() {
  window.app.sidebarManager.refreshLeftSidebar();
}

function centerMap() {
  window.app.mapManager.centerMap();
}

function toggleCurrentLocation() {
  window.app.mapManager.toggleCurrentLocation();
}

function filterByKubun() {
  const query = document.getElementById('search').value.toLowerCase();
  const kubunFilter = document.getElementById('kubun-filter').value;
  window.app.filterLocations(query, kubunFilter);
}

function switchSalesman() {
  window.app.dataManager.switchSalesman();
}

function editTargetGoal() {
  window.app.dataManager.editTargetGoal();
}

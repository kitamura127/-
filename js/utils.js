/**
 * Utility Functions
 */
const Utils = {
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Format date as YYYY/MM/DD
   * @param {string} dateStr - Date string
   * @returns {string} Formatted date
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  },

  /**
   * Format date as M/D
   * @param {string} dateStr - Date string
   * @returns {string} Formatted short date
   */
  formatShortDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  },

  /**
   * Get today's date in YYYY-MM-DD format
   * @returns {string} Today's date
   */
  getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Get marker shape based on kubun (category)
   * @param {string} kubun - Category
   * @returns {string} Shape name
   */
  getMarkerShape(kubun) {
    return CONFIG.MARKER_SHAPES[kubun] || CONFIG.MARKER_SHAPES['default'];
  },

  /**
   * Get marker color based on visit history
   * @param {Array} visitHistory - Visit history array
   * @returns {string} Color hex code
   */
  getMarkerColor(visitHistory) {
    if (!visitHistory || visitHistory.length === 0) {
      return CONFIG.MARKER_COLORS.URGENT;
    }

    const lastVisit = new Date(visitHistory[visitHistory.length - 1].date);
    const today = new Date();
    const daysDiff = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));

    if (daysDiff <= CONFIG.VISIT_STATUS.RECENT_THRESHOLD) {
      return CONFIG.MARKER_COLORS.RECENT;
    } else if (daysDiff <= CONFIG.VISIT_STATUS.WARNING_THRESHOLD) {
      return CONFIG.MARKER_COLORS.WARNING;
    } else {
      return CONFIG.MARKER_COLORS.URGENT;
    }
  },

  /**
   * Get visit status based on visit history
   * @param {Array} visitHistory - Visit history array
   * @returns {Object} Status object with label and class
   */
  getVisitStatus(visitHistory) {
    if (!visitHistory || visitHistory.length === 0) {
      return { label: '訪問必要', class: 'status-urgent' };
    }

    const lastVisit = new Date(visitHistory[visitHistory.length - 1].date);
    const today = new Date();
    const daysDiff = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));

    if (daysDiff <= CONFIG.VISIT_STATUS.RECENT_THRESHOLD) {
      return { label: `${daysDiff}日前`, class: 'status-recent' };
    } else if (daysDiff <= CONFIG.VISIT_STATUS.WARNING_THRESHOLD) {
      return { label: `${daysDiff}日前`, class: 'status-warning' };
    } else {
      return { label: `${daysDiff}日前`, class: 'status-urgent' };
    }
  },

  /**
   * Create Google Maps marker icon
   * @param {string} shape - Shape type
   * @param {string} color - Color hex code
   * @returns {Object} Google Maps icon object
   */
  createMarkerIcon(shape, color) {
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
  },

  /**
   * Create current location icon
   * @returns {Object} Google Maps icon object
   */
  createCurrentLocationIcon() {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285f4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 8
    };
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise} Promise resolving on success
   */
  copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
  },

  /**
   * Show temporary notification
   * @param {string} message - Message to display
   * @param {number} duration - Duration in milliseconds
   */
  showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    const rightOffset = window.sidebarVisible ? '370px' : '20px';
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
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), duration);
  },

  /**
   * Check if Google Apps Script environment is available
   * @returns {boolean} True if available
   */
  isGASAvailable() {
    return typeof google !== 'undefined' && google.script && google.script.run;
  },

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

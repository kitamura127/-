/**
 * Application Configuration
 */
const CONFIG = {
  // Google Maps API Key
  GOOGLE_MAPS_API_KEY: 'AIzaSyAqJN_eFQZj8B2aFpHl__2xJiKFpJvUfrE',

  // Default map settings
  DEFAULT_MAP_CENTER: { lat: 35.6762, lng: 139.6503 },
  DEFAULT_ZOOM: 10,
  MAX_ZOOM: 16,
  DETAIL_ZOOM: 17,
  TRACKING_ZOOM: 15,

  // Sidebar widths
  LEFT_SIDEBAR_WIDTH: 320,
  RIGHT_SIDEBAR_WIDTH: 340,

  // Marker shapes for different kubun (categories)
  MARKER_SHAPES: {
    'タネ未満': 'circle',
    '戦略予材': 'star',
    '現場': 'triangle',
    'その他': 'square',
    'default': 'circle'
  },

  // Visit status thresholds (in days)
  VISIT_STATUS: {
    RECENT_THRESHOLD: 30,
    WARNING_THRESHOLD: 90
  },

  // Marker colors
  MARKER_COLORS: {
    RECENT: '#9e9e9e',
    WARNING: '#ffc107',
    URGENT: '#f44336'
  },

  // Auto-refresh intervals (in milliseconds)
  REFRESH_INTERVALS: {
    NEW_CASES: 60000,      // 1 minute
    INSIGHTS: 300000       // 5 minutes
  },

  // Location tracking options
  LOCATION_OPTIONS: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  },

  // Map styles (dark theme)
  MAP_STYLES: [
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
};

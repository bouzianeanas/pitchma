// ============================================
// PITCHMA - DESIGN SYSTEM
// ============================================

export const COLORS = {
  primary: '#00C853',      // Green (grass)
  primaryDark: '#009624',
  primaryLight: '#E8F5E9',
  secondary: '#1565C0',    // Blue
  accent: '#FF6D00',       // Orange for CTAs
  
  // Backgrounds
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F0',
  
  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  
  // Status
  success: '#00C853',
  warning: '#FFB300',
  error: '#E53935',
  info: '#1E88E5',
  
  // Booking status colors
  statusPending: '#FFB300',
  statusConfirmed: '#00C853',
  statusCancelled: '#E53935',
  statusCompleted: '#6B7280',
  
  // Borders
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  // Morocco flag colors
  moroccoRed: '#C1272D',
  moroccoGreen: '#006233',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    xxl: 26,
    xxxl: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Sport type config
export const SPORT_CONFIG = {
  football: { icon: 'soccer', label: 'Football', color: '#00C853' },
  basketball: { icon: 'basketball', label: 'Basketball', color: '#FF6D00' },
  tennis: { icon: 'tennis', label: 'Tennis', color: '#FFB300' },
  padel: { icon: 'tennis-ball', label: 'Padel', color: '#1565C0' },
  volleyball: { icon: 'volleyball', label: 'Volleyball', color: '#E53935' },
};

export const SURFACE_LABELS = {
  natural_grass: 'Gazon naturel',
  artificial_turf: 'Gazon synthétique',
  concrete: 'Béton',
  indoor: 'Indoor',
};

export const STATUS_COLORS = {
  available: COLORS.success,
  booked: COLORS.error,
  blocked: COLORS.textLight,
  pending: COLORS.warning,
  confirmed: COLORS.success,
  cancelled: COLORS.error,
  completed: COLORS.textSecondary,
};

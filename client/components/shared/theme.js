// Shared color scheme and styling constants for consistent design
export const theme = {
  // Colors
  colors: {
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    secondaryLight: '#94a3b8',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceLight: '#f1f5f9',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      light: '#94a3b8',
      white: '#ffffff',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Typography
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Border radius
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  },
};

// Common component styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonSecondary: {
    backgroundColor: '#64748b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },

  text: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },

  textSmall: {
    fontSize: 14,
    color: '#94a3b8',
  },
};

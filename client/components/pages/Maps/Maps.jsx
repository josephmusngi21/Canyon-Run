import React, { useState, useMemo, useCallback, useRef } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  Dimensions,
  PanResponder
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { theme } from '../../shared/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function SimplifiedMaps({ runData = null }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentView, setCurrentView] = useState('map'); // 'map' or 'elevation'
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  
  // Touch tracking
  const lastTouchDistance = useRef(0);
  const isPinching = useRef(false);

  // Map settings
  const mapWidth = Math.min(screenWidth - 40, 350);
  const mapHeight = 280;
  const padding = 30; // Reduced padding for better zoom level
  const maxZoom = 15;
  const minZoom = 0.5;

  // Empty state
  if (!runData || !runData.coordinates || runData.coordinates.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Route Data</Text>
          <Text style={styles.emptyText}>
            Complete a tracking session to view the route map
          </Text>
        </View>
      </View>
    );
  }

  // Process coordinates - simplified
  const processedCoordinates = useMemo(() => {
    try {
      const validCoords = runData.coordinates.filter(coord => 
        coord && 
        typeof coord.latitude === 'number' && 
        typeof coord.longitude === 'number' &&
        !isNaN(coord.latitude) && 
        !isNaN(coord.longitude)
      );

      if (validCoords.length <= 50) return validCoords;
      
      // Simplify for performance
      const step = Math.ceil(validCoords.length / 50);
      return validCoords.filter((_, index) => 
        index === 0 || 
        index === validCoords.length - 1 || 
        index % step === 0
      );
    } catch (error) {
      return [];
    }
  }, [runData.coordinates]);

  // Calculate map bounds with better zoom level
  const mapBounds = useMemo(() => {
    if (processedCoordinates.length === 0) return null;

    const latitudes = processedCoordinates.map(p => p.latitude);
    const longitudes = processedCoordinates.map(p => p.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);
    
    const dataWidth = maxLon - minLon;
    const dataHeight = maxLat - minLat;
    
    if (dataWidth === 0 || dataHeight === 0) return null;
    
    // Reduced margin for better initial zoom
    const marginFactor = 0.15; // Reduced from 0.3 to 0.15
    const widthMargin = dataWidth * marginFactor;
    const heightMargin = dataHeight * marginFactor;
    
    const expandedMinLat = minLat - heightMargin;
    const expandedMaxLat = maxLat + heightMargin;
    const expandedMinLon = minLon - widthMargin;
    const expandedMaxLon = maxLon + widthMargin;
    
    const expandedDataWidth = expandedMaxLon - expandedMinLon;
    const expandedDataHeight = expandedMaxLat - expandedMinLat;
    
    const availableWidth = mapWidth - 2 * padding;
    const availableHeight = mapHeight - 2 * padding;
    const scale = Math.min(availableWidth / expandedDataWidth, availableHeight / expandedDataHeight);
    
    const offsetX = (availableWidth - expandedDataWidth * scale) / 2 + padding;
    const offsetY = (availableHeight - expandedDataHeight * scale) / 2 + padding;
    
    return {
      minLat: expandedMinLat, 
      maxLat: expandedMaxLat, 
      minLon: expandedMinLon, 
      maxLon: expandedMaxLon,
      scale, offsetX, offsetY
    };
  }, [processedCoordinates, mapWidth, mapHeight, padding]);

  // Coordinate transformation
  const geoToScreen = useCallback((lat, lon) => {
    if (!mapBounds) return { x: 0, y: 0 };
    
    const baseX = mapBounds.offsetX + (lon - mapBounds.minLon) * mapBounds.scale;
    const baseY = mapHeight - (mapBounds.offsetY + (lat - mapBounds.minLat) * mapBounds.scale);
    
    const centerX = mapWidth / 2;
    const centerY = mapHeight * 0.65; // Lower center for better bottom visibility
    
    const x = centerX + (baseX - centerX) * zoom + panX;
    const y = centerY + (baseY - centerY) * zoom + panY;
    
    return { x, y };
  }, [mapBounds, mapHeight, mapWidth, zoom, panX, panY]);

  // Generate path data
  const pathData = useMemo(() => {
    if (!mapBounds || processedCoordinates.length === 0) return "";
    
    return processedCoordinates.map((point, i) => {
      const { x, y } = geoToScreen(point.latitude, point.longitude);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [processedCoordinates, geoToScreen]);

  // Touch distance calculation
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
    );
  };

  // Pan responder for zoom
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
    onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
    
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      if (touches.length === 2) {
        isPinching.current = true;
        lastTouchDistance.current = getTouchDistance(touches);
      }
    },
    
    onPanResponderMove: (evt) => {
      const touches = evt.nativeEvent.touches;
      
      if (touches.length === 2 && isPinching.current) {
        const currentDistance = getTouchDistance(touches);
        
        if (lastTouchDistance.current > 0) {
          const scaleRatio = currentDistance / lastTouchDistance.current;
          const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * scaleRatio));
          setZoom(newZoom);
        }
        lastTouchDistance.current = currentDistance;
      }
    },
    
    onPanResponderRelease: () => {
      isPinching.current = false;
    }
  });

  // Navigation functions
  const basePanStep = 25;
  const maxPan = 500;
  const zoomMultiplier = Math.max(1, zoom * 0.1);
  const panStep = basePanStep * zoomMultiplier;

  const moveUp = () => setPanY(prev => Math.min(maxPan, prev + panStep));
  const moveDown = () => setPanY(prev => Math.max(-maxPan, prev - panStep));
  const moveLeft = () => setPanX(prev => Math.min(maxPan, prev + panStep));
  const moveRight = () => setPanX(prev => Math.max(-maxPan, prev - panStep));
  
  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Dynamic sizing functions
  const getRouteThickness = () => {
    const zoomFactor = 1 / zoom;
    const calculatedThickness = 4 * zoomFactor;
    return Math.max(3, Math.min(8, calculatedThickness));
  };

  const getMarkerSize = () => {
    const zoomFactor = 1 / zoom;
    const calculatedSize = 8 * zoomFactor;
    return Math.max(4, Math.min(12, calculatedSize));
  };

  // Find closest point for tap
  const findClosestPoint = useCallback((touchX, touchY) => {
    if (!mapBounds) return null;
    
    let closestPoint = null;
    let minDistance = Infinity;
    
    processedCoordinates.forEach(point => {
      const { x, y } = geoToScreen(point.latitude, point.longitude);
      const distance = Math.sqrt(Math.pow(touchX - x, 2) + Math.pow(touchY - y, 2));
      
      if (distance < minDistance && distance <= 30) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    return closestPoint;
  }, [processedCoordinates, geoToScreen, mapBounds]);

  // Handle tap
  const handleTap = useCallback((evt) => {
    try {
      const { locationX, locationY } = evt.nativeEvent;
      const closestPoint = findClosestPoint(locationX, locationY);
      
      if (closestPoint) {
        setSelectedPoint(closestPoint);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Tap error:", error);
    }
  }, [findClosestPoint]);

  // Render elevation view
  const renderElevationView = () => {
    const elevations = processedCoordinates
      .map(coord => coord.altitude)
      .filter(alt => alt != null && !isNaN(alt));

    if (elevations.length === 0) {
      return (
        <View style={styles.elevationContainer}>
          <Text style={styles.elevationTitle}>Elevation Profile</Text>
          <Text style={styles.noDataText}>No elevation data available</Text>
        </View>
      );
    }

    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    const elevationRange = maxElevation - minElevation;

    const elevationPath = elevations.map((elevation, index) => {
      const x = (index / (elevations.length - 1)) * (mapWidth - 40) + 20;
      const y = mapHeight - 40 - ((elevation - minElevation) / elevationRange) * (mapHeight - 80);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <View style={styles.elevationContainer}>
        <Text style={styles.elevationTitle}>Elevation Profile</Text>
        <Svg width={mapWidth} height={mapHeight} style={styles.svg}>
          <Path 
            d={elevationPath} 
            fill="none" 
            stroke="#2563eb" 
            strokeWidth="3"
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.elevationStats}>
          <Text style={styles.statText}>Min: {minElevation.toFixed(1)}m</Text>
          <Text style={styles.statText}>Max: {maxElevation.toFixed(1)}m</Text>
          <Text style={styles.statText}>Range: {elevationRange.toFixed(1)}m</Text>
        </View>
      </View>
    );
  };

  if (!mapBounds || processedCoordinates.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: No valid coordinates found</Text>
      </View>
    );
  }

  const startCoord = processedCoordinates[0];
  const endCoord = processedCoordinates[processedCoordinates.length - 1];
  const startScreen = geoToScreen(startCoord.latitude, startCoord.longitude);
  const endScreen = geoToScreen(endCoord.latitude, endCoord.longitude);

  return (
    <View style={styles.container}>
      {/* View Switcher */}
      <View style={styles.viewSwitcher}>
        <TouchableOpacity 
          style={[styles.switchButton, currentView === 'map' && styles.activeSwitchButton]}
          onPress={() => setCurrentView('map')}
        >
          <Text style={[styles.switchButtonText, currentView === 'map' && styles.activeSwitchButtonText]}>
            🗺️ Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.switchButton, currentView === 'elevation' && styles.activeSwitchButton]}
          onPress={() => setCurrentView('elevation')}
        >
          <Text style={[styles.switchButtonText, currentView === 'elevation' && styles.activeSwitchButtonText]}>
            📈 Elevation
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        {currentView === 'map' ? 'Route Map' : 'Elevation Profile'}
      </Text>
      <Text style={styles.subtitle}>{runData.location || 'Canyon Run'}</Text>

      {currentView === 'map' ? (
        <>
          {/* Controls */}
          <View style={styles.controls}>
            <Text style={styles.zoomText}>{zoom.toFixed(1)}x zoom</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetView}>
              <Text style={styles.resetText}>Reset View</Text>
            </TouchableOpacity>
          </View>
          
          {/* Navigation Controls */}
          <View style={styles.navigationControls}>
            <View style={styles.navButtonsContainer}>
              <TouchableOpacity style={styles.navButton} onPress={moveUp}>
                <Text style={styles.navButtonText}>↑</Text>
              </TouchableOpacity>
              <View style={styles.navMiddleRow}>
                <TouchableOpacity style={styles.navButton} onPress={moveLeft}>
                  <Text style={styles.navButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.navCenter} />
                <TouchableOpacity style={styles.navButton} onPress={moveRight}>
                  <Text style={styles.navButtonText}>→</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.navButton} onPress={moveDown}>
                <Text style={styles.navButtonText}>↓</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            <View
              style={[styles.svgContainer, { width: mapWidth, height: mapHeight }]}
              {...panResponder.panHandlers}
            >
              <Svg 
                width={mapWidth} 
                height={mapHeight} 
                style={styles.svg}
                onTouchEnd={handleTap}
              >
                <Path 
                  d={pathData} 
                  fill="none" 
                  stroke="#2563eb" 
                  strokeWidth={getRouteThickness()}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle 
                  cx={startScreen.x} 
                  cy={startScreen.y} 
                  r={getMarkerSize()} 
                  fill="#10b981" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                />
                <Circle 
                  cx={endScreen.x} 
                  cy={endScreen.y} 
                  r={getMarkerSize()} 
                  fill="#ef4444" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                />
              </Svg>
            </View>
          </View>

          <Text style={styles.instructionText}>
            Pinch to zoom • Use arrow buttons to navigate • Tap trail for details
          </Text>
        </>
      ) : (
        renderElevationView()
      )}

      {/* Modal for point details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Point Details</Text>
            
            {selectedPoint && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Latitude:</Text>
                  <Text style={styles.value}>{selectedPoint.latitude.toFixed(6)}°</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Longitude:</Text>
                  <Text style={styles.value}>{selectedPoint.longitude.toFixed(6)}°</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Elevation:</Text>
                  <Text style={styles.value}>
                    {selectedPoint.altitude ? `${selectedPoint.altitude.toFixed(1)} m` : 'N/A'}
                  </Text>
                </View>
                
                {selectedPoint.timestamp && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Time:</Text>
                    <Text style={styles.value}>
                      {new Date(selectedPoint.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              </>
            )}
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    margin: theme.spacing.sm,
    width: '100%',
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  switchButton: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  activeSwitchButton: {
    backgroundColor: theme.colors.primary,
  },
  switchButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  activeSwitchButtonText: {
    color: theme.colors.text.white,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  zoomText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  resetButton: {
    backgroundColor: theme.colors.text.secondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  resetText: {
    color: theme.colors.text.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  navigationControls: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  navButtonsContainer: {
    alignItems: 'center',
  },
  navMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
  },
  navButton: {
    backgroundColor: theme.colors.surfaceLight,
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xxs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navButtonText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  navCenter: {
    width: 36,
    height: 36,
  },
  mapContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.default,
    marginBottom: theme.spacing.md,
  },
  svgContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  svg: {
    backgroundColor: theme.colors.surface,
  },
  instructionText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  elevationContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.default,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  elevationTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  elevationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: theme.spacing.md,
  },
  statText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  noDataText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    margin: theme.spacing.lg,
    maxWidth: 320,
    width: '100%',
    ...theme.shadows.large,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  value: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  closeButtonText: {
    color: theme.colors.text.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

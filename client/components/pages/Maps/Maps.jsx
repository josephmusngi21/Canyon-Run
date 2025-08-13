import React, { useState, useMemo, useCallback } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  PanResponder,
  Dimensions 
} from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";
import exampleData from "../../jsonCanyon.json";

const { width: screenWidth } = Dimensions.get('window');

export default function Maps() {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });

  const mapWidth = Math.min(screenWidth - 40, 350);
  const mapHeight = 250;
  const padding = 20;
  const hoverRadius = 30; // Increased for better mobile touch

  // Ensure JSON structure is valid
  if (!exampleData || Object.keys(exampleData).length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: Invalid JSON structure</Text>
      </View>
    );
  }

  const runId = Object.keys(exampleData)[0];
  const runData = exampleData[runId];

  if (!runData || !runData.coordinates || runData.coordinates.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: No coordinates found in run data</Text>
      </View>
    );
  }

  // Process and simplify coordinates for performance
  const processedCoordinates = useMemo(() => {
    try {
      const coords = runData.coordinates.map((p, index) => ({
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
        altitude: parseFloat(p.altitude) || 0,
        meters: parseFloat(p.meters) || 0,
        index: index,
      }));

      // Filter out invalid coordinates
      const validCoords = coords.filter(coord => 
        !isNaN(coord.latitude) && !isNaN(coord.longitude) &&
        coord.latitude !== 0 && coord.longitude !== 0
      );

      if (validCoords.length === 0) {
        console.log("No valid coordinates found");
        return [];
      }

      // Intelligent coordinate reduction for performance
      const totalPoints = validCoords.length;
      let step = 1;
      
      if (totalPoints > 200) step = Math.floor(totalPoints / 200);
      else if (totalPoints > 100) step = Math.floor(totalPoints / 100);
      
      const simplified = validCoords.filter((_, index) => 
        index === 0 || 
        index === totalPoints - 1 || 
        index % step === 0
      );
      
      console.log(`Processed ${totalPoints} coordinates, simplified to ${simplified.length}`);
      return simplified;
    } catch (error) {
      console.error("Error processing coordinates:", error);
      return [];
    }
  }, [runData.coordinates]);

  // Calculate map bounds and transformations
  const mapBounds = useMemo(() => {
    if (processedCoordinates.length === 0) {
      console.log("No processed coordinates for map bounds");
      return null;
    }

    try {
      const latitudes = processedCoordinates.map(p => p.latitude);
      const longitudes = processedCoordinates.map(p => p.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLon = Math.min(...longitudes);
      const maxLon = Math.max(...longitudes);
      
      const dataWidth = maxLon - minLon;
      const dataHeight = maxLat - minLat;
      
      if (dataWidth === 0 || dataHeight === 0) {
        console.log("Invalid data dimensions");
        return null;
      }
      
      const availableWidth = mapWidth - 2 * padding;
      const availableHeight = mapHeight - 2 * padding;
      const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight);
      
      const offsetX = (availableWidth - dataWidth * scale) / 2 + padding;
      const offsetY = (availableHeight - dataHeight * scale) / 2 + padding;
      
      console.log(`Map bounds calculated: ${minLat}, ${maxLat}, ${minLon}, ${maxLon}`);
      return {
        minLat, maxLat, minLon, maxLon,
        scale, offsetX, offsetY
      };
    } catch (error) {
      console.error("Error calculating map bounds:", error);
      return null;
    }
  }, [processedCoordinates, mapWidth, mapHeight, padding]);

  // Transform geographic coordinates to screen coordinates
  const geoToScreen = useCallback((lat, lon) => {
    if (!mapBounds) return { x: 0, y: 0 };
    
    const x = mapBounds.offsetX + (lon - mapBounds.minLon) * mapBounds.scale;
    const y = mapHeight - (mapBounds.offsetY + (lat - mapBounds.minLat) * mapBounds.scale);
    
    return { x, y };
  }, [mapBounds, mapHeight]);

  // Generate path data for the trail
  const pathData = useMemo(() => {
    if (!mapBounds || processedCoordinates.length === 0) return "";
    
    return processedCoordinates.map((point, i) => {
      const x = mapBounds.offsetX + (point.longitude - mapBounds.minLon) * mapBounds.scale;
      const y = mapHeight - (mapBounds.offsetY + (point.latitude - mapBounds.minLat) * mapBounds.scale);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [processedCoordinates, mapBounds, mapHeight]);

  // Find closest point to touch/mouse position
  const findClosestPoint = useCallback((touchX, touchY) => {
    if (!mapBounds) return null;
    
    let closestPoint = null;
    let minDistance = Infinity;
    
    processedCoordinates.forEach((point) => {
      const { x, y } = geoToScreen(point.latitude, point.longitude);
      const distance = Math.sqrt(Math.pow(x - touchX, 2) + Math.pow(y - touchY, 2));
      
      if (distance < minDistance && distance <= hoverRadius) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    return closestPoint;
  }, [processedCoordinates, geoToScreen, mapBounds, hoverRadius]);

  // Simplified pan responder for better mobile compatibility
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false, // Disable move to avoid conflicts
    
    onPanResponderGrant: (evt) => {
      try {
        const { locationX, locationY } = evt.nativeEvent;
        const closestPoint = findClosestPoint(locationX, locationY);
        
        if (closestPoint) {
          setSelectedPoint(closestPoint);
          setModalVisible(true);
        }
      } catch (error) {
        console.error("Touch error:", error);
      }
    },
    
    onPanResponderRelease: () => {
      setHoveredPoint(null);
    },
    
    onPanResponderTerminate: () => {
      setHoveredPoint(null);
    }
  }), [findClosestPoint]);

  // Get start and end coordinates
  const startCoord = useMemo(() => {
    if (runData.start) {
      return {
        latitude: parseFloat(runData.start.latitude),
        longitude: parseFloat(runData.start.longitude),
        altitude: parseFloat(runData.start.altitude) || 0,
        meters: parseFloat(runData.start.meters) || 0
      };
    }
    return processedCoordinates[0] || null;
  }, [runData.start, processedCoordinates]);

  const endCoord = useMemo(() => {
    if (runData.end) {
      return {
        latitude: parseFloat(runData.end.latitude),
        longitude: parseFloat(runData.end.longitude),
        altitude: parseFloat(runData.end.altitude) || 0,
        meters: parseFloat(runData.end.meters) || 0
      };
    }
    return processedCoordinates[processedCoordinates.length - 1] || null;
  }, [runData.end, processedCoordinates]);

  if (!mapBounds || processedCoordinates.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: No valid coordinates found</Text>
        <Text style={styles.errorText}>
          Processed: {processedCoordinates.length} coordinates
        </Text>
        <Text style={styles.errorText}>
          Map bounds: {mapBounds ? "✓" : "✗"}
        </Text>
      </View>
    );
  }

  const startScreen = geoToScreen(startCoord.latitude, startCoord.longitude);
  const endScreen = geoToScreen(endCoord.latitude, endCoord.longitude);
  const hoveredScreen = hoveredPoint ? geoToScreen(hoveredPoint.latitude, hoveredPoint.longitude) : null;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <TouchableOpacity 
          style={[styles.svgContainer, { width: mapWidth, height: mapHeight }]}
          onPress={(evt) => {
            try {
              const { locationX, locationY } = evt.nativeEvent;
              const closestPoint = findClosestPoint(locationX, locationY);
              
              if (closestPoint) {
                setSelectedPoint(closestPoint);
                setModalVisible(true);
              }
            } catch (error) {
              console.error("Touch error:", error);
            }
          }}
          activeOpacity={0.9}
        >
          <Svg width={mapWidth} height={mapHeight} style={styles.svg}>
            {/* Trail path */}
            <Path 
              d={pathData} 
              fill="none" 
              stroke="#2563eb" 
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Start marker */}
            <Circle 
              cx={startScreen.x} 
              cy={startScreen.y} 
              r={7} 
              fill="#10b981" 
              stroke="#ffffff" 
              strokeWidth={2}
            />

            {/* End marker */}
            <Circle 
              cx={endScreen.x} 
              cy={endScreen.y} 
              r={7} 
              fill="#ef4444" 
              stroke="#ffffff" 
              strokeWidth={2}
            />

            {/* Debug: Show a few sample points */}
            {processedCoordinates.slice(0, 5).map((point, index) => {
              const screenPos = geoToScreen(point.latitude, point.longitude);
              return (
                <Circle 
                  key={index}
                  cx={screenPos.x} 
                  cy={screenPos.y} 
                  r={3} 
                  fill="rgba(255, 0, 0, 0.5)" 
                />
              );
            })}
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Coordinate Information Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Location Details</Text>
            
            {selectedPoint && (
              <View style={styles.infoContainer}>
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
                
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Distance:</Text>
                  <Text style={styles.value}>
                    {selectedPoint.meters ? `${selectedPoint.meters.toFixed(1)} m` : 'N/A'}
                  </Text>
                </View>
              </View>
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

      {/* Instructions */}
      <Text style={styles.instructions}>
        Tap anywhere on the trail to view coordinates • Debug mode with sample points
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    margin: 10,
  },
  mapContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  svgContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  svg: {
    backgroundColor: '#fafbfc',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    padding: 20,
  },
  instructions: {
    marginTop: 16,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '88%',
    maxWidth: 340,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1e293b',
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  closeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

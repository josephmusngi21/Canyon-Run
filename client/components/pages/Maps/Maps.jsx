import React from "react";
import { StyleSheet, View, Text } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import exampleData from "../../jsonCanyon.json";

// Helper function for distance calculation
const haversine = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export default function Maps() {
  const width = 600;
  const height = 300;
  const padding = 40;

  // Ensure JSON structure is valid
  if (!exampleData || Object.keys(exampleData).length === 0) {
    return <Text>Error: Invalid JSON structure</Text>;
  }

  const runId = Object.keys(exampleData)[0];
  const runData = exampleData[runId];

  // Parse coordinates
  const coordinates = runData.coordinates.map((p) => ({
    latitude: parseFloat(p.latitude),
    longitude: parseFloat(p.longitude),
  }));

  if (coordinates.length === 0) {
    return <Text>Error: No coordinates found</Text>;
  }

  const minLon = Math.min(...coordinates.map((p) => p.longitude));
  const maxLon = Math.max(...coordinates.map((p) => p.longitude));
  const minLat = Math.min(...coordinates.map((p) => p.latitude));
  const maxLat = Math.max(...coordinates.map((p) => p.latitude));

  const dataWidth = maxLon - minLon;
  const dataHeight = maxLat - minLat;

  const boxWidth = width - 2 * padding;
  const boxHeight = height - 2 * padding;
  const scale = Math.min(boxWidth / dataWidth, boxHeight / dataHeight);

  const offsetX = (boxWidth - dataWidth * scale) / 2 + padding;
  const offsetY = (boxHeight - dataHeight * scale) / 2 + padding;

  const x = (lon) => offsetX + (lon - minLon) * scale;
  const y = (lat) => height - (offsetY + (lat - minLat) * scale);

  // Start and End Points
  const startCoord = runData.start
    ? { latitude: parseFloat(runData.start.latitude), longitude: parseFloat(runData.start.longitude) }
    : coordinates[0];

  const endCoord = runData.end
    ? { latitude: parseFloat(runData.end.latitude), longitude: parseFloat(runData.end.longitude) }
    : coordinates[coordinates.length - 1];

  // Path Segmentation
  const threshold = 100; // meters
  let segments = [];
  let currentSegment = [];

  for (let i = 0; i < coordinates.length; i++) {
    const point = coordinates[i];
    if (i > 0) {
      const prev = coordinates[i - 1];
      const dist = haversine(prev.latitude, prev.longitude, point.latitude, point.longitude);
      if (dist > threshold) {
        if (currentSegment.length > 1) segments.push(currentSegment);
        currentSegment = [];
      }
    }
    currentSegment.push(point);
  }
  if (currentSegment.length > 1) segments.push(currentSegment);

  return (
    <View style={styles.altitudeContainer}>
      <Svg width={width} height={height} style={styles.svgStyle}>
        {/* Path segments */}
        {segments.map((segment, idx) => {
          const pathData = segment.map((point, i) => {
            const px = x(point.longitude);
            const py = y(point.latitude);
            return `${i === 0 ? "M" : "L"} ${px} ${py}`;
          }).join(" ");

          return <Path key={idx} d={pathData} fill="none" stroke="#0074d9" strokeWidth={2} />;
        })}

        {/* Start marker */}
        <Circle cx={x(startCoord.longitude)} cy={y(startCoord.latitude)} r={6} fill="#2ecc40" stroke="#222" strokeWidth={2} />
        <Text x={x(startCoord.longitude) + 10} y={y(startCoord.latitude) - 10} fontSize="14" fill="#2ecc40">Start</Text>

        {/* End marker */}
        <Circle cx={x(endCoord.longitude)} cy={y(endCoord.latitude)} r={6} fill="#ff4136" stroke="#222" strokeWidth={2} />
        <Text x={x(endCoord.longitude) + 10} y={y(endCoord.latitude) - 10} fontSize="14" fill="#ff4136">End</Text>
      </Svg>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  altitudeContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  svgStyle: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
});

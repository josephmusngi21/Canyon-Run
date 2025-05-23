import React from "react";
import { StyleSheet, View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import exampleData from "./../../jsonCanyon.json";

export default function Altitude({ maxWidth = 600, maxHeight = 300 }) {
    // Validate JSON structure
    if (!exampleData || Object.keys(exampleData).length === 0) {
        return <Text>Error: Invalid JSON structure</Text>;
    }

    const firstKey = Object.keys(exampleData)[0];
    const coordinates = exampleData[firstKey]?.coordinates;

    const altitudeData = Array.isArray(coordinates)
        ? coordinates
            .filter(point => point && point.meters != null && point.altitude != null)
            .map(point => ({
                meters: parseFloat(String(point.meters).replace(/\r/g, '').trim()),
                altitude: parseFloat(String(point.altitude).replace(/\r/g, '').trim())
            }))
        : [];

    if (!altitudeData.length) return <Text>No altitude data available</Text>;

    // Min & max values
    const minMeters = Math.min(...altitudeData.map(d => d.meters));
    const maxMeters = Math.max(...altitudeData.map(d => d.meters));
    const minAltitude = Math.min(...altitudeData.map(d => d.altitude));
    const maxAltitude = Math.max(...altitudeData.map(d => d.altitude));

    const dataWidth = maxMeters - minMeters;
    const dataHeight = maxAltitude - minAltitude;
    const dataAspect = dataWidth / dataHeight;
    const boxAspect = maxWidth / maxHeight;

    let plotWidth, plotHeight, offsetX, offsetY;
    const padding = 40;

    if (dataAspect > boxAspect) {
        plotWidth = maxWidth - 2 * padding;
        plotHeight = plotWidth / dataAspect;
        offsetX = padding;
        offsetY = (maxHeight - plotHeight) / 2;
    } else {
        plotHeight = maxHeight - 2 * padding;
        plotWidth = plotHeight * dataAspect;
        offsetY = padding;
        offsetX = (maxWidth - plotWidth) / 2;
    }

    const x = meters => offsetX + ((meters - minMeters) / dataWidth) * plotWidth;
    const y = altitude => offsetY + plotHeight - ((altitude - minAltitude) / dataHeight) * plotHeight;

    const pathData = altitudeData.map((d, i) =>
        `${i === 0 ? 'M' : 'L'} ${x(d.meters)} ${y(d.altitude)}`
    ).join(' ');

    return (
        <View style={styles.altitudeContainer}>
            <Svg width={maxWidth} height={maxHeight} style={styles.svgStyle}>
                <Path d={pathData} fill="none" stroke="#0074d9" strokeWidth={2} />
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

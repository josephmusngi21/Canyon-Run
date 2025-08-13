import React, { useMemo } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import Svg, { Path, Line, Text as SvgText } from "react-native-svg";

const { width: screenWidth } = Dimensions.get('window');

export default function Altitude({ runData = null, maxWidth = Math.min(screenWidth - 40, 350), maxHeight = 200 }) {
    
    // Use provided runData or show empty state
    if (!runData || !runData.coordinates || runData.coordinates.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No Elevation Data</Text>
                    <Text style={styles.emptyText}>
                        Complete a tracking session to view the elevation profile
                    </Text>
                </View>
            </View>
        );
    }

    const { altitudeData, pathData, stats } = useMemo(() => {
        try {
            // Process coordinates to extract altitude data
            const coords = runData.coordinates || [];
            
            const processedData = coords
                .map((point, index) => ({
                    distance: index * 10, // Approximate distance in meters (10m intervals)
                    altitude: parseFloat(point.altitude) || 0,
                    index: index
                }))
                .filter(point => !isNaN(point.altitude));

            if (processedData.length === 0) {
                return { altitudeData: [], pathData: "", stats: null };
            }

            // Calculate statistics
            const altitudes = processedData.map(d => d.altitude);
            const minAltitude = Math.min(...altitudes);
            const maxAltitude = Math.max(...altitudes);
            const elevationGain = maxAltitude - minAltitude;
            const totalDistance = processedData[processedData.length - 1].distance;

            // Calculate plot dimensions
            const padding = 40;
            const plotWidth = maxWidth - 2 * padding;
            const plotHeight = maxHeight - 2 * padding;
            
            const dataWidth = totalDistance;
            const dataHeight = elevationGain || 100; // Minimum height if no elevation change
            
            // Scale functions
            const xScale = (distance) => padding + (distance / dataWidth) * plotWidth;
            const yScale = (altitude) => padding + plotHeight - ((altitude - minAltitude) / dataHeight) * plotHeight;
            
            // Generate path data
            const pathString = processedData
                .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.distance)} ${yScale(d.altitude)}`)
                .join(' ');

            return {
                altitudeData: processedData,
                pathData: pathString,
                stats: {
                    minAltitude,
                    maxAltitude,
                    elevationGain,
                    totalDistance,
                    xScale,
                    yScale,
                    plotWidth,
                    plotHeight,
                    padding
                }
            };
        } catch (error) {
            console.error('Error processing altitude data:', error);
            return { altitudeData: [], pathData: "", stats: null };
        }
    }, [runData.coordinates, maxWidth, maxHeight]);

    if (!stats || altitudeData.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No valid elevation data available</Text>
            </View>
        );
    }

    // Generate grid lines and labels
    const gridLines = [];
    const labels = [];
    
    // Vertical grid lines (distance)
    const distanceStep = Math.max(100, Math.round(stats.totalDistance / 5 / 100) * 100);
    for (let d = 0; d <= stats.totalDistance; d += distanceStep) {
        const x = stats.xScale(d);
        gridLines.push(
            <Line
                key={`v-${d}`}
                x1={x}
                y1={stats.padding}
                x2={x}
                y2={stats.padding + stats.plotHeight}
                stroke="#e2e8f0"
                strokeWidth={1}
            />
        );
        labels.push(
            <SvgText
                key={`vl-${d}`}
                x={x}
                y={stats.padding + stats.plotHeight + 15}
                fontSize="10"
                fill="#64748b"
                textAnchor="middle"
            >
                {d}m
            </SvgText>
        );
    }
    
    // Horizontal grid lines (elevation)
    const elevationStep = Math.max(10, Math.round(stats.elevationGain / 4 / 10) * 10);
    for (let alt = stats.minAltitude; alt <= stats.maxAltitude; alt += elevationStep) {
        const y = stats.yScale(alt);
        gridLines.push(
            <Line
                key={`h-${alt}`}
                x1={stats.padding}
                y1={y}
                x2={stats.padding + stats.plotWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
            />
        );
        labels.push(
            <SvgText
                key={`hl-${alt}`}
                x={stats.padding - 5}
                y={y + 3}
                fontSize="10"
                fill="#64748b"
                textAnchor="end"
            >
                {Math.round(alt)}m
            </SvgText>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Elevation Profile</Text>
            <Text style={styles.subtitle}>{runData.location || 'Canyon Run'}</Text>
            
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Min Elevation</Text>
                    <Text style={styles.statValue}>{Math.round(stats.minAltitude)}m</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Max Elevation</Text>
                    <Text style={styles.statValue}>{Math.round(stats.maxAltitude)}m</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Elevation Gain</Text>
                    <Text style={styles.statValue}>{Math.round(stats.elevationGain)}m</Text>
                </View>
            </View>

            <View style={styles.chartContainer}>
                <Svg width={maxWidth} height={maxHeight} style={styles.svg}>
                    {/* Grid lines */}
                    {gridLines}
                    
                    {/* Elevation path */}
                    <Path 
                        d={pathData} 
                        fill="none" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    
                    {/* Labels */}
                    {labels}
                    
                    {/* Axis labels */}
                    <SvgText
                        x={maxWidth / 2}
                        y={maxHeight - 5}
                        fontSize="12"
                        fill="#374151"
                        textAnchor="middle"
                        fontWeight="600"
                    >
                        Distance (m)
                    </SvgText>
                    
                    <SvgText
                        x={15}
                        y={maxHeight / 2}
                        fontSize="12"
                        fill="#374151"
                        textAnchor="middle"
                        fontWeight="600"
                        transform={`rotate(-90, 15, ${maxHeight / 2})`}
                    >
                        Elevation (m)
                    </SvgText>
                </Svg>
            </View>
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
        width: '100%',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 16,
        paddingHorizontal: 10,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    chartContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    svg: {
        backgroundColor: '#fafbfc',
        borderRadius: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        padding: 20,
    },
});

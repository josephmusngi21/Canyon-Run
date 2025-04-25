import React from "react";
import exampleData from '../../../assets/runJson/jsonCanyon.json';

// Helper to calculate distance between two lat/lon points (approximate, in meters)
function haversine(lat1, lon1, lat2, lon2) {
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon/2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

export default function Maps() {
    const width = 600;
    const height = 300;
    const padding = 40;

    // Parse coordinates as numbers
    const coordinates = exampleData.coordinates.map(p => ({
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude)
    }));

    const minLon = Math.min(...coordinates.map(p => p.longitude));
    const maxLon = Math.max(...coordinates.map(p => p.longitude));
    const minLat = Math.min(...coordinates.map(p => p.latitude));
    const maxLat = Math.max(...coordinates.map(p => p.latitude));

    const dataWidth = maxLon - minLon;
    const dataHeight = maxLat - minLat;

    const boxWidth = width - 2 * padding;
    const boxHeight = height - 2 * padding;
    const scale = Math.min(
        boxWidth / dataWidth,
        boxHeight / dataHeight
    );

    const offsetX = (boxWidth - dataWidth * scale) / 2 + padding;
    const offsetY = (boxHeight - dataHeight * scale) / 2 + padding;

    const x = lon => offsetX + (lon - minLon) * scale;
    const y = lat => height - (offsetY + (lat - minLat) * scale);

    const filteredCoordinates = coordinates;

    // Prefer start/end from JSON fields if available, else fallback to coordinates array
    let startCoord = exampleData.start
        ? {
            latitude: parseFloat(exampleData.start.latitude),
            longitude: parseFloat(exampleData.start.longitude)
        }
        : coordinates[0];

    let endCoord = exampleData.end
        ? {
            latitude: parseFloat(exampleData.end.latitude),
            longitude: parseFloat(exampleData.end.longitude)
        }
        : coordinates[coordinates.length - 1];

    // Split into segments if distance > threshold (e.g., 100 meters)
    const threshold = 100; // meters
    let segments = [];
    let currentSegment = [];

    for (let i = 0; i < filteredCoordinates.length; i++) {
        const point = filteredCoordinates[i];
        if (i > 0) {
            const prev = filteredCoordinates[i - 1];
            const dist = haversine(prev.latitude, prev.longitude, point.latitude, point.longitude);
            if (dist > threshold) {
                if (currentSegment.length > 1) segments.push(currentSegment);
                currentSegment = [];
            }
        }
        currentSegment.push(point);
    }
    if (currentSegment.length > 1) segments.push(currentSegment);

    console.log("Start Coordinate:", startCoord);
    console.log("End Coordinate:", endCoord);

    return (
        <div className="altitude-container">
            <svg width={width} height={height} style={{ border: '1px solid #ccc', background: '#fafafa' }}>
                {/* Path segments */}
                {segments.map((segment, idx) => {
                    const pathData = segment
                        .map((point, i) => {
                            const px = x(point.longitude);
                            const py = y(point.latitude);
                            return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
                        })
                        .join(' ');
                    return (
                        <path
                            key={idx}
                            d={pathData}
                            fill="none"
                            stroke="#0074d9"
                            strokeWidth="2"
                        />
                    );
                })}
                {/* Start marker and label */}
                <circle
                    cx={x(startCoord.longitude)}
                    cy={y(startCoord.latitude)}
                    r={6}
                    fill="#2ecc40"
                    stroke="#222"
                    strokeWidth="2"
                />
                <text
                    x={x(startCoord.longitude) + 10}
                    y={y(startCoord.latitude) - 10}
                    fontSize="14"
                    fill="#2ecc40"
                    fontWeight="bold"
                >
                    Start
                </text>
                {/* End marker and label */}
                <circle
                    cx={x(endCoord.longitude)}
                    cy={y(endCoord.latitude)}
                    r={6}
                    fill="#ff4136"
                    stroke="#222"
                    strokeWidth="2"
                />
                <text
                    x={x(endCoord.longitude) + 10}
                    y={y(endCoord.latitude) - 10}
                    fontSize="14"
                    fill="#ff4136"
                    fontWeight="bold"
                >
                    End
                </text>
            </svg>
        </div>
    );
}

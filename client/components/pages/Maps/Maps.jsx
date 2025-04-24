import React from "react";
import exampleData from '../../../assets/csv/jsonCanyon.json';

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

    // Remove duplicate start/end point
    const filteredCoordinates = coordinates.length > 1 &&
        coordinates[0].latitude === coordinates[coordinates.length - 1].latitude &&
        coordinates[0].longitude === coordinates[coordinates.length - 1].longitude
        ? coordinates.slice(0, -1)
        : coordinates;

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

    return (
        <div className="altitude-container">
            <svg width={width} height={height} style={{ border: '1px solid #ccc', background: '#fafafa' }}>
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
            </svg>
        </div>
    );
}

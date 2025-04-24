import React from "react";
import exampleData from '../../../assets/csv/jsonCanyon.json';

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

    // Compute scale to fit both width and height, preserving aspect ratio
    const boxWidth = width - 2 * padding;
    const boxHeight = height - 2 * padding;
    const scale = Math.min(
        boxWidth / dataWidth,
        boxHeight / dataHeight
    );

    // Center the path in the SVG
    const offsetX = (boxWidth - dataWidth * scale) / 2 + padding;
    const offsetY = (boxHeight - dataHeight * scale) / 2 + padding;

    // Map longitude to x, latitude to y (preserving aspect ratio)
    const x = lon => offsetX + (lon - minLon) * scale;
    const y = lat => height - (offsetY + (lat - minLat) * scale);

    // Ensure coordinates are not duplicated at the start/end
    const filteredCoordinates = coordinates.length > 1 &&
        coordinates[0].latitude === coordinates[coordinates.length - 1].latitude &&
        coordinates[0].longitude === coordinates[coordinates.length - 1].longitude
        ? coordinates.slice(0, -1)
        : coordinates;
    
    const pathData = filteredCoordinates
        .map((point, i) => {
            const px = x(point.longitude);
            const py = y(point.latitude);
            return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
        })
        .join(' ');

    return (
        <div className="altitude-container">
            <svg width={width} height={height} style={{ border: '1px solid #ccc', background: '#fafafa' }}>
                {/* Path for lat/lon */}
                <path d={pathData} fill="none" stroke="#0074d9" strokeWidth="2" />
            </svg>
        </div>
    );
}

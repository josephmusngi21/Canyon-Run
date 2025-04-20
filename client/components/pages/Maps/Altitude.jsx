import React from 'react';
import exampleData from './canyon.json';    // Example JSON data file

export default function Altitude() {

    // Extract altitude and meters for graphing
    const altitudeData = exampleData.coordinates.map(point => ({
        meters: point.meters,
        altitude: point.altitude
    }));

    const width = 600;
    const height = 300;
    const padding = 40;

    // Find min/max for scaling
    const minMeters = Math.min(...altitudeData.map(d => d.meters));
    const maxMeters = Math.max(...altitudeData.map(d => d.meters));
    const minAltitude = Math.min(...altitudeData.map(d => d.altitude));
    const maxAltitude = Math.max(...altitudeData.map(d => d.altitude));

    // Scale functions
    const x = meters => padding + ((meters - minMeters) / (maxMeters - minMeters)) * (width - 2 * padding);
    const y = altitude => height - padding - ((altitude - minAltitude) / (maxAltitude - minAltitude)) * (height - 2 * padding);

    // Create SVG path
    const pathData = altitudeData.map((d, i) =>
        `${i === 0 ? 'M' : 'L'}${x(d.meters)},${y(d.altitude)}`
    ).join(' ');

    return (
        <div className="altitude-container">
            <svg width={width} height={height} style={{ border: '1px solid #ccc', background: '#fafafa' }}>
                {/* Graph path */}
                <path d={pathData} fill="none" stroke="#0074d9" strokeWidth="2" />
                {/* X-axis label */}
                <text
                    x={width / 2}
                    y={height - 5}
                    textAnchor="middle"
                    fontSize="16"
                    fill="#333"
                >
                    Meters
                </text>
                {/* Y-axis label (rotated) */}
                <text
                    x={15}
                    y={height / 2}
                    textAnchor="middle"
                    fontSize="16"
                    fill="#333"
                    transform={`rotate(-90 15,${height / 2})`}
                >
                    Elevation
                </text>
            </svg>
        </div>
    );
}
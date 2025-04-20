import React from "react";
import exampleData from './canyon.json';

export default function Maps() {
    const width = 600;
    const height = 300;
    const padding = 40;

    const coordinates = exampleData.coordinates;

    // X: index, Y: latitude (or altitude)
    const minIndex = 0;
    const maxIndex = coordinates.length - 1;
    const minLatitude = Math.min(...coordinates.map(p => p.latitude));
    const maxLatitude = Math.max(...coordinates.map(p => p.latitude));

    // Map index to x, latitude to y
    const x = idx => padding + ((idx - minIndex) / (maxIndex - minIndex)) * (width - 2 * padding);
    const y = latitude => height - padding - ((latitude - minLatitude) / (maxLatitude - minLatitude)) * (height - 2 * padding);

    const pathData = coordinates
        .map((point, i) => {
            const px = x(i);
            const py = y(point.latitude);
            return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
        })
        .join(' ');

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
                </text>
            </svg>
        </div>
    );
}

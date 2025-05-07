import React from 'react';
// import exampleData from '../../../assets/runJson/jsonCanyon.json';
import exampleData from './../../jsonCanyon.json'


export default function Altitude({ maxWidth = 600, maxHeight = 300 }) {
    // Get the first object value from the random-keyed root object
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

    if (!altitudeData.length) return <div>No data</div>;

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
        `${i === 0 ? 'M' : 'L'}${x(d.meters)},${y(d.altitude)}`
    ).join(' ');

    // Removed unused xTickValues and yTickValues

    return (
        <div className="altitude-container" style={{ maxWidth, maxHeight }}>
            <svg width={maxWidth} height={maxHeight} style={{ border: '1px solid #ccc', background: '#fafafa' }}>
                {/* Graph path */}
                <path d={pathData} fill="none" stroke="#0074d9" strokeWidth="2" />
            </svg>
        </div>
    );
}

const { time } = require('console');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const csvPath = path.join(__dirname, 'csv', '10_MetersCSV.csv');
const outputFileName = 'jsonCanyon.json';

function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter the location Canyon: ', (locationUser) => {
        // Read CSV file
        fs.readFile(csvPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading CSV file:', err);
                rl.close();
                return;
            }

            const lines = data.trim().split('\n');
            if (lines.length < 2) {
                console.error('CSV does not have enough data.');
                rl.close();
                return;
            }

            // Skip header, get first and last data lines
            const firstData = lines[1].split(',');
            const lastData = lines[lines.length - 1].split(',');

            // Build JSON structure
            const jsonOutput = {
                location: locationUser,
                distance_miles: null,
                start: {
                    meters: firstData[2] || null,
                    latitude: firstData[0] || null,
                    longitude: firstData[1] || null,
                    altitude: firstData[4] || null,
                    time: null
                },
                end: {
                    meters: lastData[2] || null,
                    latitude: lastData[0] || null,
                    longitude: lastData[1] || null,
                    altitude: lastData[4] || null,
                    time: null
                },
                coordinates: []
            };

            // Loop through each data line (skip header)
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length < 3) continue;
                jsonOutput.coordinates.push({
                    meters: parts[2] || null,
                    latitude: parts[0] || null,
                    longitude: parts[1] || null,
                    altitude: parts[4] || null,
                    time: null
                });
            }

            // Write to new JSON file
            const outputPath = path.join(__dirname, 'csv', outputFileName);
            fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
            console.log('JSON file created at:', outputPath);

            rl.close();
        });
    });
}

main();
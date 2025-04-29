//TODO: Connect to server to add to database/Json

import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

const listOfRuns = require("../../../assets/runJson/jsonCanyon.json");
const { getRunCollection, insertRun } = require('./components/api/db'); 

// To add to database
// const { getRunCollection } = require('./components/api/db');

//
// // Example usage:
// insertRun({ name: 'Test Run', distance: 5.2, date: new Date() });


export default function AddRun() {
    const [step, setStep] = useState(0);
    const [start, setStart] = useState({ lat: "", lng: "", alt: "", location: "" });
    const [end, setEnd] = useState({ lat: "", lng: "", alt: "", location: "" });
    const [added, setAdded] = useState(false);

    function handleChange(setter, field, value) {
        setter(prev => ({ ...prev, [field]: value }));
    }

    function handleSave() {
        const uniqueId = Math.random().toString(16).slice(2);

        const parsedStart = {
            latitude: parseFloat(start.lat),
            longitude: parseFloat(start.lng),
            altitude: parseFloat(start.alt)
        };
        const parsedEnd = {
            latitude: parseFloat(end.lat),
            longitude: parseFloat(end.lng),
            altitude: parseFloat(end.alt)
        };
        const location = start.location || "";
        if (Object.values(listOfRuns).some(run => run.location === location)) {
            alert("This location name already exists in the list of runs.");
            return;
        }

        if (
            isNaN(parsedStart.latitude) || isNaN(parsedStart.longitude) ||
            isNaN(parsedEnd.latitude) || isNaN(parsedEnd.longitude)
        ) {
            alert("Please enter valid numbers for latitude and longitude.");
            return;
        }

        const newRun = {
            [uniqueId]: {
                "location": location,
                "distance_miles": null,
                "start": {
                    meters: 0,
                    latitude: parsedStart.latitude,
                    longitude: parsedStart.longitude,
                    altitude: parsedStart.altitude,
                    time: null
                },
                "end": {
                    meters: null,
                    latitude: parsedEnd.latitude,
                    longitude: parsedEnd.longitude,
                    altitude: parsedEnd.altitude,
                    time: null
                },
                "coordinates": []
            }
        };

        // Directly push to the imported listOfRuns array
        try {
            // Wont work in react native during runtime, will need database or backend to work with async storage
            insertRun(newRun);

            console.log("New run added successfully:", newRun);
        } catch (error) {
            console.error("Error adding new run:", error);
        }

        setStep(0);
        setStart({ lat: "", lng: "", alt: "", location: "" });
        setEnd({ lat: "", lng: "", alt: "" });
        setAdded(true);
    }

    function renderCoords(label, coords, setCoords) {
        return (
            <View style={styles.section}>
                <Text style={styles.label}>{label} Coordinates</Text>

                <Text style={styles.label}>Latitude:</Text>
                <TextInput
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="Enter Latitude"
                    value={coords.lat}
                    onChangeText={v => {
                        const filtered = v.replace(/[^0-9.\-]/g, '').replace(/(\..*)\./g, '$1').replace(/(?!^)-/g, '');
                        handleChange(setCoords, "lat", filtered);
                    }}
                />
                <Text style={styles.label}>Longitude:</Text>
                <TextInput
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="Enter Longitude"
                    value={coords.lng}
                    onChangeText={v => {
                        const filtered = v.replace(/[^0-9.\-]/g, '').replace(/(\..*)\./g, '$1').replace(/(?!^)-/g, '');
                        handleChange(setCoords, "lng", filtered);
                    }}
                />
                <Text style={styles.label}>Altitude:</Text>
                <TextInput
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="Enter Altitude"
                    value={coords.alt}
                    onChangeText={v => {
                        const filtered = v.replace(/[^0-9.\-]/g, '').replace(/(\..*)\./g, '$1').replace(/(?!^)-/g, '');
                        handleChange(setCoords, "alt", filtered);
                    }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add Run</Text>
            {added && (
                <Text style={styles.successMsg}>Run added successfully!</Text>
            )}
            <Text style={styles.label}>Location:</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Location"
                value={start.location}
                onChangeText={v => handleChange(setStart, "location", v)}
            />
            {step === 0 && renderCoords("Start", start, setStart)}
            {step === 1 && renderCoords("End", end, setEnd)}
            {step === 0 && (
                <Button
                    title="Next"
                    onPress={() => {
                        setStep(1);
                        setAdded(false);
                    }}
                    color="#007BFF"
                />
            )}
            {step === 1 && (
                <>
                    <Button
                        title="Previous"
                        onPress={() => setStep(0)}
                        color="#6c757d"
                    />
                    <Button
                        title="Save"
                        onPress={handleSave}
                        color="#28a745"
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        width: "90%",
        fontFamily: "Arial",
    },
    title: {
        textAlign: "center",
        marginBottom: 20,
        fontSize: 20,
        fontWeight: "bolder",
    },
    section: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 5,
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 8,
        marginBottom: 10,
        width: "100%",
    },
    successMsg: {
        color: "green",
        textAlign: "center",
        marginBottom: 10,
        fontWeight: "bold",
    },
});
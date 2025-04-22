import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function AddRun({ listOfRuns, setListOfRuns }) {
    const [step, setStep] = useState(0);
    const [start, setStart] = useState({ lat: "", lng: "", alt: "" });
    const [end, setEnd] = useState({ lat: "", lng: "", alt: "" });
    const [added, setAdded] = useState(false);

    function handleChange(setter, field, value) {
        setter(prev => ({ ...prev, [field]: value }));
    }

    function handleSave() {
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

        // Validate required fields
        if (
            isNaN(parsedStart.latitude) || isNaN(parsedStart.longitude) ||
            isNaN(parsedEnd.latitude) || isNaN(parsedEnd.longitude)
        ) {
            alert("Please enter valid numbers for latitude and longitude.");
            return;
        }

        // Use location from start (add location field to start state if needed)
        const location = start.location || "";

        const newRun = {
            location,
            distance_miles: null,
            start: parsedStart,
            end: parsedEnd,
            coordinates: [null]
        };

        setListOfRuns([...listOfRuns, newRun]);

        setStep(0);
        setStart({ lat: "", lng: "", alt: "", location: "" });
        setEnd({ lat: "", lng: "", alt: "" });
        setAdded(true);
    }

    function renderCoords(label, coords, setCoords) {
        return (
            <View style={styles.section}>
                <Text style={styles.label}>{label} Coordinates</Text>

                <Text style={styles.label}>Location:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Location"
                    value={coords.location}
                />

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
            {step === 0 && renderCoords("Start", start, setStart)}
            {step === 1 && renderCoords("End", end, setEnd)}
            {step === 0 && (
                <Button
                    title="Next"
                    onPress={() => {
                        setStep(1);
                        setAdded(false); // Reset added on navigation
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
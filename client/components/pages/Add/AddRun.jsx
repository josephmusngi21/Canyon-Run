import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function AddRun({ addRun = () => {} }) {
    // addRun = {meters: 0, latitude: 32.3269, longitude: -110.7084, altitude: 2500}
    const [step, setStep] = useState(0);
    const [start, setStart] = useState({ lat: "", lng: "", alt: "" });
    const [end, setEnd] = useState({ lat: "", lng: "", alt: "" });

    function handleChange(setter, field, value) {
        setter(prev => ({ ...prev, [field]: value }));
    }

    function handleSave() {
        // Convert string inputs to numbers and validate
        const parsedStart = {
            lat: parseFloat(start.lat),
            lng: parseFloat(start.lng),
            alt: parseFloat(start.alt)
        };
        const parsedEnd = {
            lat: parseFloat(end.lat),
            lng: parseFloat(end.lng),
            alt: parseFloat(end.alt)
        };
    
        // Basic validation to ensure lat/lng are numbers
        if (
            isNaN(parsedStart.lat) || isNaN(parsedStart.lng) ||
            isNaN(parsedEnd.lat) || isNaN(parsedEnd.lng)
        ) {
            alert("Please enter valid numbers for latitude and longitude.");
            return;
        }
    
        addRun({ start: parsedStart, end: parsedEnd });
        setStep(0);
        setStart({ lat: "", lng: "", alt: "" });
        setEnd({ lat: "", lng: "", alt: "" });

        console.log('updated addrun' , addRun)
    }

    function renderCoords(label, coords, setCoords) {
        return (
            <View style={styles.section}>
                <Text style={styles.label}>{label} Coordinates</Text>
                <Text style={styles.label}>Latitude:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Latitude"
                    value={coords.lat}
                    onChangeText={v => handleChange(setCoords, "lat", v)}
                />
                <Text style={styles.label}>Longitude:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Longitude"
                    value={coords.lng}
                    onChangeText={v => handleChange(setCoords, "lng", v)}
                />
                <Text style={styles.label}>Altitude:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Altitude"
                    value={coords.alt}
                    onChangeText={v => handleChange(setCoords, "alt", v)}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add Run</Text>
            {step === 0 && renderCoords("Start", start, setStart)}
            {step === 1 && renderCoords("End", end, setEnd)}
            {step === 0 && (
                <Button
                    title="Next"
                    onPress={() => setStep(1)}
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
});

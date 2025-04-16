import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function AddRun() {
    const [initial, setInitial] = useState(true);

    function startCoords() {
        return (
            <View style={styles.section}>
                <Text style={styles.label}>Start Coordinates</Text>
                <Text style={styles.label}>Latitude:</Text>
                <TextInput style={styles.input} placeholder="Enter Latitude" />
                <Text style={styles.label}>Longitude:</Text>
                <TextInput style={styles.input} placeholder="Enter Longitude" />
                <Text style={styles.label}>Altitude:</Text>
                <TextInput style={styles.input} placeholder="Enter Altitude" />
            </View>
        );
    }

    function endCoords() {
        return (
            <View style={styles.section}>
                <Text style={styles.label}>End Coordinates</Text>
                <Text style={styles.label}>Latitude:</Text>
                <TextInput style={styles.input} placeholder="Enter Latitude" />
                <Text style={styles.label}>Longitude:</Text>
                <TextInput style={styles.input} placeholder="Enter Longitude" />
                <Text style={styles.label}>Altitude:</Text>
                <TextInput style={styles.input} placeholder="Enter Altitude" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add Run</Text>
            {initial ? startCoords() : endCoords()}
            <Button
                title={initial ? "Next" : "Previous"}
                onPress={() => setInitial(!initial)}
                color="#007BFF"
            />
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

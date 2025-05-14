import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
const listOfRuns = require("./../../jsonCanyon.json");


// A reusable input field for numeric values
const InputField = ({ label, value, onChangeText }) => (
  <>
    <Text style={styles.label}>{label}:</Text>
    <TextInput
      keyboardType="numeric"
      style={styles.input}
      placeholder={`Enter ${label}`}
      value={value}
      onChangeText={onChangeText}
    />
  </>
);

export default function AddRun() {
  const [step, setStep] = useState(0);
  const [start, setStart] = useState({
    lat: "",
    lng: "",
    alt: "",
    location: "",
  });
  const [end, setEnd] = useState({ lat: "", lng: "", alt: "" });
  const [added, setAdded] = useState(false);

  // Helper for sanitizing and updating coordinate fields
  const updateCoords = (setter, field, value) => {
    const cleaned = value
      .replace(/[^0-9.\-]/g, "")
      .replace(/(\..*)\./g, "$1")
      .replace(/(?!^)-/g, "");
    setter((prev) => ({ ...prev, [field]: cleaned }));
  };

  // Renders coordinate inputs for either the start or end point.
  const renderCoords = (label, coords, setter) => (
    <View style={styles.section}>
      <Text style={styles.label}>{label} Coordinates</Text>
      <InputField
        label="Latitude"
        value={coords.lat}
        onChangeText={(v) => updateCoords(setter, "lat", v)}
      />
      <InputField
        label="Longitude"
        value={coords.lng}
        onChangeText={(v) => updateCoords(setter, "lng", v)}
      />
      <InputField
        label="Altitude"
        value={coords.alt}
        onChangeText={(v) => updateCoords(setter, "alt", v)}
      />
    </View>
  );

  const handleSave = () => {
    const uniqueId = Math.random().toString(16).slice(2);
    const parsedStart = {
      latitude: parseFloat(start.lat),
      longitude: parseFloat(start.lng),
      altitude: parseFloat(start.alt),
    };
    const parsedEnd = {
      latitude: parseFloat(end.lat),
      longitude: parseFloat(end.lng),
      altitude: parseFloat(end.alt),
    };
    const { location } = start;

    // Check for duplicate location names
    if (Object.values(listOfRuns).some((run) => run.location === location)) {
      alert("This location name already exists in the list of runs.");
      return;
    }

    // Check that coordinates are valid numbers.
    if (
      isNaN(parsedStart.latitude) ||
      isNaN(parsedStart.longitude) ||
      isNaN(parsedEnd.latitude) ||
      isNaN(parsedEnd.longitude)
    ) {
      alert("Please enter valid numbers for latitude and longitude.");
      return;
    }

    const newRun = {
      [uniqueId]: {
        location,
        distance_miles: null,
        start: { meters: 0, ...parsedStart, time: null },
        end: { meters: null, ...parsedEnd, time: null },
        coordinates: [],
      },
    };

    try {
      // Note: Directly modifying the imported JSON is for demonstration.
      Object.assign(listOfRuns, newRun);
      console.log("New run added successfully:", newRun);
    } catch (error) {
      console.error("Error adding new run:", error);
    }

    // Reset form state
    setStep(0);
    setStart({ lat: "", lng: "", alt: "", location: "" });
    setEnd({ lat: "", lng: "", alt: "" });
    setAdded(true);
  };

  // An array representing our two steps:
  const steps = [
    renderCoords("Start", start, setStart),
    renderCoords("End", end, setEnd),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Run</Text>
      <View style={styles.imageContainer}>
        <Text>Hello</Text>
      </View>


      {added && <Text style={styles.successMsg}>Run added successfully!</Text>}


      <Text style={styles.label}>Location:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Location"
        value={start.location}
        onChangeText={(v) => setStart((prev) => ({ ...prev, location: v }))}
      />


      {steps[step]}
      <View style={styles.buttonContainer}>
        {step > 0 && (
          <Button
            title="Previous"
            onPress={() => setStep(step - 1)}
            color="#6c757d"
          />
        )}


        {step < steps.length - 1 ? (
          <Button
            title="Next"
            onPress={() => {
              setStep(step + 1);
              setAdded(false);
            }}
            color="#007BFF"
          />
        ) : (
          <Button title="Save" onPress={handleSave} color="#28a745" />
        )}


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    margin: 0,
    width: "100%",
    fontFamily: "Arial",
  },
  imageContainer: {
    backgroundColor: "black",
    width: "100%",
    height: 275,
    marginVertical: 20,
  },
  title: {
    textAlign: "left",
    marginBottom: 10,
    fontSize: 40,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
  },
  input: {
    padding: 8,
    marginBottom: 10,
    width: 275,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  successMsg: {
    color: "green",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

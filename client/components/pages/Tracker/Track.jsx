import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Alert, Button } from "react-native";
import * as Location from "expo-location";

// Track component receives startCoord and endCoord as props
export default function Track(startCoord, endCoord) {
    // State to track if location permission is granted
    const [locationGranted, setLocationGranted] = useState(false);
    // State to store user's current location
    const [userLocation, setUserLocation] = useState(null);
    // State to track if tracking is active
    const [tracking, setTracking] = useState(false);
    // Json of coordinates
    const [coordinatesJson, setCoordinatesJson] = useState({});

    // Request location permission on component mount
    useEffect(() => {
        const requestLocationPermission = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission to access location was denied");
                return;
            }
            if (status === "granted") {
                setLocationGranted(true);
            } else {
                setLocationGranted(false);
                Alert.alert("Permission to access location was denied");
            }
        };
        requestLocationPermission();
    }, []);

    // Function to get the user's current location
    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation(location.coords);
        } catch (error) {
            Alert.alert("Error getting location", error.message);
        }
    };

    // Log user location if available
    if (userLocation) {
        const { longitude, latitude, altitude } = userLocation;
        console.log('Coords:', { longitude, latitude, altitude });
    }

    // Log the routeJson state
    console.log('Route JSON:', routeJson);

    return (
        <div className="track-container">
            <h1>Track</h1>
            {userLocation ? (
                <>
                    <p>{userLocation.longitude}</p>
                    <p>{userLocation.latitude}</p>
                    <p>{userLocation.altitude}</p>
                </>
            ) : (
                <p>Loading location...</p>
            )}
        </div>
    );
}

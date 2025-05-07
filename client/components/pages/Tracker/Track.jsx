import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Alert, Button } from "react-native";
import * as Location from "expo-location";

<<<<<<< HEAD
export default function Track(startCoord, endCoord) {
    const [locationGranted, setLocationGranted] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [routeJson, setRouteJson] = useState([]); // Initialize as array
    const [tracking, setTracking] = useState(false);

=======
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
>>>>>>> 6ee6f31f0a21e4763ea3aabac79cc6f85f02e776
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

<<<<<<< HEAD
=======
    // Function to get the user's current location
>>>>>>> 6ee6f31f0a21e4763ea3aabac79cc6f85f02e776
    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation(location.coords);
        } catch (error) {
            Alert.alert("Error getting location", error.message);
        }
    };

<<<<<<< HEAD
        // Tracking should start with false
    while (tracking) {
        if ([userLocation.coords.longitude, userLocation.coords.latitude].includes(null)) {
            Alert.alert("Error: Coordinates are null.");
            return;
        }
        const newRoute = {
            longitude: userLocation.coords.longitude,
            latitude: userLocation.coords.latitude,
            altitude: userLocation.coords.altitude,
        };
        setRouteJson((prevRoute) => [...prevRoute, newRoute]);

    }


    useEffect(() => {
        if (locationGranted) {
            getCurrentLocation();
        }
    }, [locationGranted]);

=======
    // Log user location if available
>>>>>>> 6ee6f31f0a21e4763ea3aabac79cc6f85f02e776
    if (userLocation) {
        const { longitude, latitude, altitude } = userLocation;
        console.log('Coords:', { longitude, latitude, altitude });
    }

<<<<<<< HEAD
    console.log('Route JSON:', routeJson); // Log the routeJson
=======
    // Log the routeJson state
    console.log('Route JSON:', routeJson);
>>>>>>> 6ee6f31f0a21e4763ea3aabac79cc6f85f02e776

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

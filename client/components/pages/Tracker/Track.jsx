import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Alert, Button } from "react-native";
import * as Location from "expo-location";

export default function Track(startCoord, endCoord) {
    const [locationGranted, setLocationGranted] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [routeJson, setRouteJson] = useState([]); // Initialize as array
    const [tracking, setTracking] = useState(false);

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

    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation(location.coords);
        } catch (error) {
            Alert.alert("Error getting location", error.message);
        }
    };

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

    if (userLocation) {
        const { longitude, latitude, altitude } = userLocation;
        console.log('Coords:', { longitude, latitude, altitude });
    }

    console.log('Route JSON:', routeJson); // Log the routeJson

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

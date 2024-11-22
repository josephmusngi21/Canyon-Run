import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Alert, Button } from "react-native";
import * as Location from "expo-location";

export default function Geolocation() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [hasReachedStart, setHasReachedStart] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [displayStart, setDisplayStart] = useState(true);
  const [displayEnd, setDisplayEnd] = useState(true);

  useEffect(() => {
    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      setLocationGranted(true);

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      checkProximity(location.coords);

      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 2,
        },
        (location) => {
          setUserLocation(location);
          checkProximity(location.coords);
        }
      );

      return () => locationSubscription.remove();
    };

    requestLocationPermission();
  }, []);

  const checkProximity = (coords) => {
    if (!startLocation || !endLocation) return;

    const distanceToStart = calculateDistance(coords, startLocation.coords);
    const distanceToEnd = calculateDistance(coords, endLocation.coords);

    if (distanceToStart < 0.02 && !hasReachedStart) { // radius of starting point
      setHasReachedStart(true);
      Alert.alert("You are within 20 meters of the starting location");
    }

    if (distanceToEnd < 0.02 && !hasReachedEnd) { // radius of ending point
      setHasReachedEnd(true);
      Alert.alert("You are within 20 meters of the ending location");
    }
  };

  const calculateDistance = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const lat1 = coords1.latitude;
    const lon1 = coords1.longitude;
    const lat2 = coords2.latitude;
    const lon2 = coords2.longitude;

    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return distance;
  };

  const handlePress = async (titlxe) => {
    let location = await Location.getCurrentPositionAsync({});
    if (title === 'Start') {
      setStartLocation(location);
      setDisplayStart(false);
    } else if (title === 'End') {
      setEndLocation(location);
      setDisplayEnd(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.show}>
        <Text>User Location:</Text>
        {userLocation ? (
          <Text>
            Latitude: {userLocation.coords.latitude}, Longitude:{" "}
            {userLocation.coords.longitude}
          </Text>
        ) : (
          <Text>Fetching location...</Text>
        )}
      </View>

      <View style={styles.buttons}>
        {startLocation === null ? (
          <Button title="Start" onPress={() => handlePress('Start')} />
        ) : (
          <Text>
            Start Location Set: Latitude: {startLocation.coords.latitude}, Longitude: {startLocation.coords.longitude}
          </Text>
        )}
        {endLocation === null ? (
          <Button title="End" onPress={() => handlePress('End')} />
        ) : (
          <Text>
            End Location Set: Latitude: {endLocation.coords.latitude}, Longitude: {endLocation.coords.longitude}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

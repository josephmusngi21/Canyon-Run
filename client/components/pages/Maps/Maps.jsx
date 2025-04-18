import React from "react";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";   //  using Leaflet for maps

export default function Maps() {
    // This file will grab a json data file from the server and plot it as a map
    // The json data file will be in the format of:
    // {
    //     "runName": "Example Run",
    //     "coordinates": [
    //         {
    //             "longitude": -122.4194,
    //             "latitude": 37.7749,
    //             "altitude": 30
    //         },
    //         {
    //             "longitude": -122.4195,
    //             "latitude": 37.7750,
    //             "altitude": 35
    //         }
    //     ]
    // }
    
    const [routeData, setRouteData] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);

    useEffect(() => {
        // Fetch the JSON data from the server API endpoint
        fetch("/api/getRouteData")
            .then((response) => response.json())
            .then((data) => setRouteData(data))
            .catch((error) => console.error("Error fetching route data:", error));
    }, []);

    if (!routeData) {
        return <p>Loading...</p>;
    }

    const coordinates = routeData.coordinates.map(coord => [coord.latitude, coord.longitude]);

    return (
        <MapContainer center={coordinates[0]} zoom={13} style={{ height: "100vh", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Polyline positions={coordinates} color="blue" />
        </MapContainer>
    );
    
    return (
        <>

        </>
    )
}
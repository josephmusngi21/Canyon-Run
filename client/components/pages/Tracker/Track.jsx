import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, Alert, Button, TouchableOpacity, Share, Clipboard, TextInput, Modal, ScrollView } from "react-native";
import * as Location from "expo-location";
import { loadRuns, saveRun, updateRunLocation, getCurrentFileInfo, exportCurrentFile, deleteRun } from '../../../utils/dataManager';

export default function Track({ initialSavedRuns = {}, onFileManagerRequest }) {
    // State management
    const [locationGranted, setLocationGranted] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [routeJson, setRouteJson] = useState([]);
    const [tracking, setTracking] = useState(false);
    const [trackingInterval, setTrackingInterval] = useState(5);
    const [lastRecordedLocation, setLastRecordedLocation] = useState(null);
    const [savedRuns, setSavedRuns] = useState(initialSavedRuns);
    const [showSavedRuns, setShowSavedRuns] = useState(false);
    const [editingRunId, setEditingRunId] = useState(null);
    const [canyonNameInput, setCanyonNameInput] = useState('');
    const [currentFileInfo, setCurrentFileInfo] = useState({ name: 'No file loaded', isLoaded: false });
    const [hasStoppedTracking, setHasStoppedTracking] = useState(false); // New state for tracking completion
    const locationSubscription = useRef(null);

    // Distance calculation using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    };

    const startTracking = async () => {
        if (!locationGranted) {
            Alert.alert("Location permission not granted");
            return;
        }

        setTracking(true);
        setRouteJson([]);
        setLastRecordedLocation(null);

        try {
            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 1,
                },
                (location) => {
                    const { longitude, latitude, altitude } = location.coords;
                    setUserLocation(location.coords);

                    if (!lastRecordedLocation) {
                        const newRoute = { longitude, latitude, altitude, timestamp: Date.now() };
                        setRouteJson(prev => [...prev, newRoute]);
                        setLastRecordedLocation({ latitude, longitude });
                    } else {
                        const distance = calculateDistance(
                            lastRecordedLocation.latitude,
                            lastRecordedLocation.longitude,
                            latitude,
                            longitude
                        );

                        if (distance >= trackingInterval) {
                            const newRoute = { longitude, latitude, altitude, timestamp: Date.now() };
                            setRouteJson(prev => [...prev, newRoute]);
                            setLastRecordedLocation({ latitude, longitude });
                        }
                    }
                }
            );
        } catch (error) {
            Alert.alert("Error starting tracking", error.message);
            setTracking(false);
        }
    };

    const stopTracking = () => {
        setTracking(false);
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        
        if (routeJson.length > 0) {
            setHasStoppedTracking(true); // Set this so save button appears
            Alert.alert(
                "Tracking Stopped", 
                `Recorded ${routeJson.length} points. You can now save this route using the Save button below.`,
                [{ text: "OK" }]
            );
        } else {
            Alert.alert("Tracking stopped", "No points were recorded");
        }
    };

    // Load saved runs from file
    const loadSavedRuns = async () => {
        try {
            const runs = await loadRuns();
            setSavedRuns(runs);
            setCurrentFileInfo(getCurrentFileInfo());
        } catch (error) {
            console.error('Error loading saved runs:', error);
        }
    };

    // Manual save function for current tracked data
    const handleManualSave = async () => {
        if (routeJson.length === 0) {
            Alert.alert('No Data', 'No tracking data to save');
            return;
        }

        Alert.alert(
            'Save Current Track',
            `Save ${routeJson.length} recorded points?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Save', 
                    onPress: async () => {
                        try {
                            const routeData = {
                                points: routeJson,
                                totalPoints: routeJson.length,
                                interval: trackingInterval,
                                canyonName: ''
                            };
                            const runId = await saveRun(routeData);
                            Alert.alert('Success', `Track saved with ID: ${runId.substr(0, 8)}`);
                            await loadSavedRuns(); // Refresh the saved runs
                            setRouteJson([]); // Clear current tracking data
                            setHasStoppedTracking(false); // Hide save button
                        } catch (error) {
                            Alert.alert('Error', 'Failed to save track: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const shareRouteData = async (runId, runData) => {
        try {
            const shareText = `Canyon Run Data - ${runData.location}\nDistance: ${runData.distance_miles} miles\nStart: ${runData.start.latitude}, ${runData.start.longitude}\nEnd: ${runData.end.latitude}, ${runData.end.longitude}`;
            await Share.share({
                message: shareText,
                title: 'Canyon Run Route Data',
            });
        } catch (error) {
            Alert.alert('Error sharing data', error.message);
        }
    };

    const copyRouteToClipboard = async (runId, runData) => {
        try {
            const jsonString = JSON.stringify({ [runId]: runData }, null, 2);
            await Clipboard.setString(jsonString);
            Alert.alert('Copied!', 'Route data copied to clipboard');
        } catch (error) {
            Alert.alert('Error copying data', error.message);
        }
    };

    // Export current file to user's chosen location
    const handleExportCurrentFile = async () => {
        try {
            const result = await exportCurrentFile();
            if (result.success) {
                Alert.alert('Success', 'File exported successfully! You can now save it to your preferred location.');
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            console.error('Error exporting current file:', error);
            Alert.alert('Error', 'Failed to export file');
        }
    };

    // Delete a run with confirmation
    const handleDeleteRun = async (runId, runData) => {
        Alert.alert(
            'Delete Run',
            `Are you sure you want to delete "${runData.location}"?\n\nThis action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteRun(runId);
                            await loadSavedRuns(); // Refresh the saved runs
                            Alert.alert('Deleted', 'Run deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete run: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    // Effects
    useEffect(() => {
        const requestLocationPermission = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationGranted(status === "granted");
            if (status === "granted") {
                try {
                    const location = await Location.getCurrentPositionAsync({});
                    setUserLocation(location.coords);
                } catch (error) {
                    Alert.alert("Error getting location", error.message);
                }
            } else {
                Alert.alert("Permission to access location was denied");
            }
        };
        requestLocationPermission();
        
        // Set initial file info and runs
        setCurrentFileInfo(getCurrentFileInfo());
        setSavedRuns(initialSavedRuns);
    }, [initialSavedRuns]);

    useEffect(() => {
        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
        };
    }, []);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Track Your Run</Text>
            </View>
            
            <View style={styles.currentFileDisplay}>
                <Text style={styles.currentFileLabel}>Working File:</Text>
                <Text style={styles.currentFileName}>
                    {currentFileInfo?.name || 'Default runs file'}
                </Text>
                <Text style={styles.fileNote}>
                    (Local copy - use "Save File As..." to export changes)
                </Text>
            </View>

            <View style={styles.infoContainer}>
                {userLocation ? (
                    <>
                        <Text style={styles.coordText}>Latitude: {userLocation.latitude?.toFixed(6)}</Text>
                        <Text style={styles.coordText}>Longitude: {userLocation.longitude?.toFixed(6)}</Text>
                        <Text style={styles.coordText}>Altitude: {userLocation.altitude?.toFixed(2)}m</Text>
                        <Text style={styles.coordText}>Points Recorded: {routeJson.length}</Text>
                    </>
                ) : (
                    <Text style={styles.loadingText}>Loading location...</Text>
                )}
            </View>
            
            {!tracking && (
                <View style={styles.settingsContainer}>
                    <Text style={styles.label}>Tracking Interval:</Text>
                    <View style={styles.intervalButtonsContainer}>
                        {[2.5, 5, 10].map((interval) => (
                            <TouchableOpacity
                                key={interval}
                                style={[
                                    styles.intervalButton,
                                    trackingInterval === interval && styles.selectedIntervalButton
                                ]}
                                onPress={() => setTrackingInterval(interval)}
                                disabled={tracking}
                            >
                                <Text style={[
                                    styles.intervalButtonText,
                                    trackingInterval === interval && styles.selectedIntervalButtonText
                                ]}>
                                    {interval}m
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.buttonContainer}>
                {!tracking ? (
                    <Button
                        title="Start Tracking"
                        onPress={startTracking}
                        disabled={!locationGranted}
                        color="#4CAF50"
                    />
                ) : (
                    <Button
                        title="Stop Tracking"
                        onPress={stopTracking}
                        color="#f44336"
                    />
                )}
            </View>

            {/* Manual Save Button - shows when tracking is completed and there's data */}
            {hasStoppedTracking && routeJson.length > 0 && (
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity 
                        style={styles.saveTrackButton}
                        onPress={handleManualSave}
                    >
                        <Text style={styles.saveTrackButtonText}>
                            Save Current Track ({routeJson.length} points)
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Saved Runs - Hidden during tracking */}
            {Object.keys(savedRuns).length > 0 && !tracking && (
                <View style={styles.savedRoutesContainer}>
                    <View style={styles.savedRoutesHeader}>
                        <Text style={styles.savedRoutesTitle}>Saved Runs ({Object.keys(savedRuns).length})</Text>
                        <TouchableOpacity 
                            style={styles.toggleButton}
                            onPress={() => setShowSavedRuns(!showSavedRuns)}
                        >
                            <Text style={styles.toggleButtonText}>
                                {showSavedRuns ? 'Hide Details' : 'Show Details'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {showSavedRuns ? (
                        <ScrollView style={styles.routesList} showsVerticalScrollIndicator={false}>
                            {Object.entries(savedRuns).map(([runId, runData]) => (
                                <View key={runId} style={styles.routeDetailsContainer}>
                                    <Text style={styles.routeDetailTitle}>
                                        {runData.location} (ID: {runId.substr(0, 8)})
                                    </Text>
                                    <Text style={styles.routeDetailDate}>
                                        Distance: {runData.distance_miles} miles
                                    </Text>
                                    
                                    <View style={styles.coordinatesContainer}>
                                        <Text style={styles.coordinatesTitle}>Start Point:</Text>
                                        <Text style={styles.coordinateText}>Lat: {parseFloat(runData.start.latitude).toFixed(6)}</Text>
                                        <Text style={styles.coordinateText}>Lng: {parseFloat(runData.start.longitude).toFixed(6)}</Text>
                                        <Text style={styles.coordinateText}>Alt: {parseFloat(runData.start.altitude).toFixed(2)}m</Text>
                                    </View>
                                    
                                    <View style={styles.coordinatesContainer}>
                                        <Text style={styles.coordinatesTitle}>End Point:</Text>
                                        <Text style={styles.coordinateText}>Lat: {parseFloat(runData.end.latitude).toFixed(6)}</Text>
                                        <Text style={styles.coordinateText}>Lng: {parseFloat(runData.end.longitude).toFixed(6)}</Text>
                                        <Text style={styles.coordinateText}>Alt: {parseFloat(runData.end.altitude).toFixed(2)}m</Text>
                                    </View>

                                    <View style={styles.routeActionsContainer}>
                                        <TouchableOpacity 
                                            style={styles.editButton}
                                            onPress={() => {
                                                setEditingRunId(runId);
                                                setCanyonNameInput(runData.location || '');
                                            }}
                                        >
                                            <Text style={styles.editButtonText}>Edit Name</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.shareButton}
                                            onPress={() => shareRouteData(runId, runData)}
                                        >
                                            <Text style={styles.shareButtonText}>Share</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.copyButton}
                                            onPress={() => copyRouteToClipboard(runId, runData)}
                                        >
                                            <Text style={styles.copyButtonText}>Copy</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteRun(runId, runData)}
                                        >
                                            <Text style={styles.deleteButtonText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View>
                            {Object.entries(savedRuns).slice(-5).reverse().map(([runId, runData]) => (
                                <View key={runId} style={styles.simpleRouteItem}>
                                    <Text style={styles.simpleRouteText}>
                                        {runData.location || 'Unknown Canyon'}
                                    </Text>
                                </View>
                            ))}
                            {Object.keys(savedRuns).length > 5 && (
                                <Text style={styles.moreRunsText}>
                                    +{Object.keys(savedRuns).length - 5} more runs...
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            )}

            {/* Save File Button - Always available when not tracking */}
            {!tracking && (
                <View style={styles.fileActionsContainer}>
                    <TouchableOpacity style={styles.saveFileButton} onPress={handleExportCurrentFile}>
                        <Text style={styles.saveFileButtonText}>Save File As...</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal
                visible={editingRunId !== null}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setEditingRunId(null);
                    setCanyonNameInput('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Canyon Name</Text>
                        <TextInput
                            style={styles.nameInput}
                            value={canyonNameInput}
                            onChangeText={setCanyonNameInput}
                            placeholder="Enter canyon name..."
                            maxLength={50}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.cancelButton} 
                                onPress={() => {
                                    setEditingRunId(null);
                                    setCanyonNameInput('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.saveButton} 
                                onPress={async () => {
                                    if (editingRunId) {
                                        try {
                                            await updateRunLocation(editingRunId, canyonNameInput);
                                            await loadSavedRuns(); // Refresh the data
                                            setEditingRunId(null);
                                            setCanyonNameInput('');
                                            Alert.alert('Success', 'Canyon name updated!');
                                        } catch (error) {
                                            Alert.alert('Error', 'Failed to update canyon name');
                                        }
                                    }
                                }}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
        marginTop: 35,
        backgroundColor: '#f5f5f5',
        width: '100%',
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    header: {
        paddingTop: 40,
        paddingBottom: 10,
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    settingsContainer: {
        marginBottom: 20,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    intervalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    intervalButton: {
        backgroundColor: '#e0e0e0',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        minWidth: 60,
        alignItems: 'center',
    },
    selectedIntervalButton: {
        backgroundColor: '#2196F3',
    },
    intervalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    selectedIntervalButtonText: {
        color: 'white',
    },
    buttonContainer: {
        marginBottom: 20,
        width: '100%',
    },
    infoContainer: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
    },
    coordText: {
        fontSize: 14,
        marginBottom: 5,
        fontFamily: 'monospace',
        color: '#555',
    },
    loadingText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
    },
    savedRoutesContainer: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
    },
    savedRoutesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    exportButtonsContainer: {
        marginBottom: 15,
    },
    fileActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
        width: '100%',
    },
    fileActionButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    fileActionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    routeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    routeItemText: {
        flex: 1,
        fontSize: 14,
        color: '#555',
    },
    routeActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-end',
    },
    actionButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    savedRoutesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    toggleButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    toggleButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    simpleRouteItem: {
        padding: 8,
        marginVertical: 2,
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
    },
    simpleRouteText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    moreRunsText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 5,
        padding: 5,
    },
    routesList: {
        maxHeight: 400,
    },
    routeDetailsContainer: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        marginBottom: 15,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    routeDetailTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    routeDetailDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    coordinatesContainer: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    coordinatesTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    coordinateText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#555',
        marginBottom: 2,
    },
    routeActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    editButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    editButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    shareButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    copyButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    copyButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#f44336',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteActionButton: {
        backgroundColor: '#f44336',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        width: '80%',
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    nameInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    cancelButton: {
        backgroundColor: '#f44336',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    // Header Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    currentFileDisplay: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
        width: '100%',
    },
    currentFileLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    currentFileName: {
        fontSize: 16,
        color: '#1976D2',
        fontWeight: '600',
    },
    fileNote: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 5,
    },
    // Save Button Styles
    saveButtonContainer: {
        marginVertical: 15,
        width: '100%',
    },
    saveTrackButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    saveTrackButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    saveFileButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginLeft: 10,
        flex: 1,
    },
    saveFileButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

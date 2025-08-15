import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, Alert, Button, TouchableOpacity, TextInput, Modal, ScrollView } from "react-native";
import * as Location from "expo-location";
import { loadRuns, saveRun, updateRunLocation, getCurrentFileInfo, exportCurrentFile, deleteRun } from '../../../utils/dataManager';
import { theme, commonStyles } from '../../shared/theme';

export default function Track({ initialSavedRuns = {}, onFileManagerRequest, onRunSelect, onRunsUpdate }) {
    // State management
    const [locationGranted, setLocationGranted] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [routeJson, setRouteJson] = useState([]);
    const [tracking, setTracking] = useState(false);
    const [trackingInterval, setTrackingInterval] = useState(5);
    const [timeUnit, setTimeUnit] = useState('m'); // 'm' for meters, 's' for seconds
    const [showTrackingOptions, setShowTrackingOptions] = useState(false);
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

    // Calculate time taken for a run
    const calculateTimeTaken = (runData) => {
        if (!runData.coordinates || runData.coordinates.length < 2) {
            return 'N/A';
        }

        const startTime = runData.coordinates[0].timestamp;
        const endTime = runData.coordinates[runData.coordinates.length - 1].timestamp;
        const durationMs = endTime - startTime;
        
        if (durationMs <= 0) {
            return 'N/A';
        }

        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const startTracking = async () => {
        if (!locationGranted) {
            Alert.alert("Location permission not granted");
            return;
        }

        setTracking(true);
        setRouteJson([]);
        setLastRecordedLocation(null);
        setShowTrackingOptions(false); // Hide options when tracking starts

        try {
            // Convert interval to meters if using time-based tracking
            const intervalInMs = timeUnit === 's' ? trackingInterval * 1000 : trackingInterval * 60000;
            let lastRecordTime = 0;

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 1,
                },
                (location) => {
                    const { longitude, latitude, altitude } = location.coords;
                    setUserLocation(location.coords);
                    const currentTime = Date.now();

                    if (!lastRecordedLocation) {
                        const newRoute = { longitude, latitude, altitude, timestamp: currentTime };
                        setRouteJson(prev => [...prev, newRoute]);
                        setLastRecordedLocation({ latitude, longitude });
                        lastRecordTime = currentTime;
                    } else {
                        let shouldRecord = false;

                        if (timeUnit === 'm' || timeUnit === 's') {
                            // Time-based recording
                            shouldRecord = (currentTime - lastRecordTime) >= intervalInMs;
                        } else {
                            // Distance-based recording (original logic)
                            const distance = calculateDistance(
                                lastRecordedLocation.latitude,
                                lastRecordedLocation.longitude,
                                latitude,
                                longitude
                            );
                            shouldRecord = distance >= trackingInterval;
                        }

                        if (shouldRecord) {
                            const newRoute = { longitude, latitude, altitude, timestamp: currentTime };
                            setRouteJson(prev => [...prev, newRoute]);
                            setLastRecordedLocation({ latitude, longitude });
                            lastRecordTime = currentTime;
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
            // Notify parent component of runs update
            if (onRunsUpdate) {
                onRunsUpdate(runs);
            }
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

    // Update tracking interval when time unit changes
    useEffect(() => {
        if (timeUnit === 'm') {
            setTrackingInterval(5); // Default to 5 meters
        } else if (timeUnit === 's') {
            setTrackingInterval(0.5); // Default to 0.5 seconds
        }
    }, [timeUnit]);

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
                <View style={styles.trackingContainer}>
                    {!showTrackingOptions ? (
                        // Collapsed state - Show "Start Tracking" with expand arrow
                        <TouchableOpacity 
                            style={styles.startTrackingCollapsed}
                            onPress={() => setShowTrackingOptions(true)}
                        >
                            <Text style={styles.startTrackingCollapsedText}>Start Tracking</Text>
                            <Text style={styles.expandArrow}>→</Text>
                        </TouchableOpacity>
                    ) : (
                        // Expanded state - Show all options
                        <View style={styles.trackingOptionsExpanded}>
                            <View style={styles.trackingHeader}>
                                <Text style={styles.trackingTitle}>Tracking Settings</Text>
                                <TouchableOpacity 
                                    style={styles.collapseButton}
                                    onPress={() => setShowTrackingOptions(false)}
                                >
                                    <Text style={styles.collapseArrow}>×</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Time Unit Selection */}
                            <View style={styles.timeUnitContainer}>
                                <Text style={styles.label}>Record every:</Text>
                                <View style={styles.timeUnitButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.timeUnitButton,
                                            timeUnit === 'm' && styles.selectedTimeUnitButton
                                        ]}
                                        onPress={() => setTimeUnit('m')}
                                    >
                                        <Text style={[
                                            styles.timeUnitButtonText,
                                            timeUnit === 'm' && styles.selectedTimeUnitButtonText
                                        ]}>
                                            Meters
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.timeUnitButton,
                                            timeUnit === 's' && styles.selectedTimeUnitButton
                                        ]}
                                        onPress={() => setTimeUnit('s')}
                                    >
                                        <Text style={[
                                            styles.timeUnitButtonText,
                                            timeUnit === 's' && styles.selectedTimeUnitButtonText
                                        ]}>
                                            Seconds
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Interval Selection */}
                            <View style={styles.intervalContainer}>
                                <Text style={styles.label}>Interval ({timeUnit === 'm' ? 'meters' : 'seconds'}):</Text>
                                <View style={styles.intervalButtonsContainer}>
                                    {timeUnit === 'm' ? (
                                        [2.5, 5, 10].map((interval) => (
                                            <TouchableOpacity
                                                key={interval}
                                                style={[
                                                    styles.intervalButton,
                                                    trackingInterval === interval && styles.selectedIntervalButton
                                                ]}
                                                onPress={() => setTrackingInterval(interval)}
                                            >
                                                <Text style={[
                                                    styles.intervalButtonText,
                                                    trackingInterval === interval && styles.selectedIntervalButtonText
                                                ]}>
                                                    {interval}{timeUnit}
                                                </Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        [0.25, 0.5, 1].map((interval) => (
                                            <TouchableOpacity
                                                key={interval}
                                                style={[
                                                    styles.intervalButton,
                                                    trackingInterval === interval && styles.selectedIntervalButton
                                                ]}
                                                onPress={() => setTrackingInterval(interval)}
                                            >
                                                <Text style={[
                                                    styles.intervalButtonText,
                                                    trackingInterval === interval && styles.selectedIntervalButtonText
                                                ]}>
                                                    {interval}{timeUnit}
                                                </Text>
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            </View>

                            {/* Start Tracking Button */}
                            <TouchableOpacity
                                style={[styles.startTrackingButton, !locationGranted && styles.disabledButton]}
                                onPress={startTracking}
                                disabled={!locationGranted}
                            >
                                <Text style={[styles.startTrackingButtonText, !locationGranted && styles.disabledButtonText]}>
                                    Start Tracking
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {tracking && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.stopTrackingButton}
                        onPress={stopTracking}
                    >
                        <Text style={styles.stopTrackingButtonText}>Stop Tracking</Text>
                    </TouchableOpacity>
                </View>
            )}

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
                                    <Text style={styles.routeDetailTime}>
                                        Time: {calculateTimeTaken(runData)}
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
                                            style={styles.viewButton}
                                            onPress={() => onRunSelect && onRunSelect(runData)}
                                        >
                                            <Text style={styles.viewButtonText}>View Map</Text>
                                        </TouchableOpacity>
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
        backgroundColor: theme.colors.background,
        paddingTop: theme.spacing.xl,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxl,
    },
    header: {
        paddingTop: theme.spacing.xxxl,
        paddingBottom: theme.spacing.md,
        width: '100%',
    },
    title: {
        ...commonStyles.title,
        color: theme.colors.text.primary,
    },
    settingsContainer: {
        ...commonStyles.card,
        marginBottom: theme.spacing.xl,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: theme.spacing.md,
        color: '#374151',
        letterSpacing: -0.2,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    intervalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
        gap: 12,
    },
    intervalButton: {
        backgroundColor: '#f8fafc',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 20,
        flex: 1,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    selectedIntervalButton: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    intervalButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
        letterSpacing: -0.2,
    },
    selectedIntervalButtonText: {
        color: '#ffffff',
    },
    // New collapsible tracking styles
    trackingContainer: {
        marginBottom: theme.spacing.lg,
        width: '100%',
    },
    startTrackingCollapsed: {
        backgroundColor: '#10b981',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 0,
    },
    startTrackingCollapsedText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: -0.3,
    },
    expandArrow: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        opacity: 0.9,
    },
    trackingOptionsExpanded: {
        backgroundColor: '#ffffff',
        padding: theme.spacing.xl,
        borderRadius: 20,
        marginBottom: theme.spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    trackingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    trackingTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    collapseButton: {
        backgroundColor: '#f8fafc',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    collapseArrow: {
        fontSize: 20,
        fontWeight: '600',
        color: '#64748b',
        lineHeight: 20,
    },
    timeUnitContainer: {
        marginBottom: theme.spacing.xl,
    },
    timeUnitButtons: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 4,
        marginTop: theme.spacing.md,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    timeUnitButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 2,
        backgroundColor: 'transparent',
    },
    selectedTimeUnitButton: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    timeUnitButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
        letterSpacing: -0.2,
    },
    selectedTimeUnitButtonText: {
        color: '#1e293b',
    },
    intervalContainer: {
        marginBottom: theme.spacing.xl,
    },
    startTrackingButton: {
        backgroundColor: '#10b981',
        paddingVertical: 18,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 0,
        marginTop: theme.spacing.md,
    },
    startTrackingButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: -0.3,
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
        borderColor: '#6b7280',
    },
    disabledButtonText: {
        color: '#d1d5db',
    },
    stopTrackingButton: {
        backgroundColor: '#dc2626',
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        ...theme.shadows.default,
        borderWidth: 2,
        borderColor: '#b91c1c',
    },
    stopTrackingButtonText: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#ffffff',
    },
    buttonContainer: {
        marginBottom: theme.spacing.lg,
        width: '100%',
    },
    infoContainer: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.default,
        width: '100%',
    },
    coordText: {
        fontSize: theme.typography.fontSize.sm,
        marginBottom: theme.spacing.xs,
        fontFamily: 'monospace',
        color: theme.colors.text.secondary,
    },
    loadingText: {
        fontSize: theme.typography.fontSize.md,
        textAlign: 'center',
        color: theme.colors.text.secondary,
    },
    savedRoutesContainer: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        marginTop: theme.spacing.lg,
        ...theme.shadows.default,
        width: '100%',
    },
    savedRoutesTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.lg,
        color: theme.colors.text.primary,
    },
    exportButtonsContainer: {
        marginBottom: theme.spacing.lg,
    },
    fileActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: theme.spacing.lg,
        width: '100%',
    },
    fileActionButton: {
        backgroundColor: theme.colors.warning,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        flex: 1,
        marginHorizontal: theme.spacing.xs,
        alignItems: 'center',
    },
    fileActionButtonText: {
        color: theme.colors.text.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    routeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    routeItemText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    routeActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
        justifyContent: 'flex-end',
    },
    actionButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.sm,
    },
    actionButtonText: {
        color: theme.colors.text.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    savedRoutesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    toggleButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.sm,
    },
    toggleButtonText: {
        color: theme.colors.text.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    simpleRouteItem: {
        padding: theme.spacing.xs,
        marginVertical: theme.spacing.xxs,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.sm,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    simpleRouteText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    moreRunsText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: theme.spacing.xs,
        padding: theme.spacing.xs,
    },
    routesList: {
        maxHeight: 500,
    },
    routeDetailsContainer: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.success,
    },
    routeDetailTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    routeDetailDate: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    routeDetailTime: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.lg,
        fontWeight: theme.typography.fontWeight.medium,
    },
    coordinatesContainer: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
    },
    coordinatesTitle: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    coordinateText: {
        fontSize: theme.typography.fontSize.xs,
        fontFamily: 'monospace',
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xxs,
    },
    routeActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    viewButton: {
        backgroundColor: theme.colors.secondary,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.sm,
        minWidth: 80,
        alignItems: 'center',
    },
    viewButtonText: {
        color: theme.colors.text.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    editButton: {
        backgroundColor: '#1976d2',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.sm,
        minWidth: 80,
        alignItems: 'center',
    },
    editButtonText: {
        color: theme.colors.text.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    deleteButton: {
        backgroundColor: '#d32f2f',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.sm,
        minWidth: 80,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: theme.colors.text.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    deleteActionButton: {
        backgroundColor: theme.colors.error,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        padding: theme.spacing.xl,
        borderRadius: theme.borderRadius.xl,
        width: '85%',
        maxWidth: 350,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        color: '#1e293b',
    },
    nameInput: {
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        marginBottom: theme.spacing.lg,
        backgroundColor: '#f8fafc',
        color: '#1e293b',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
        gap: theme.spacing.md,
    },
    cancelButton: {
        backgroundColor: '#ef4444',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        flex: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cancelButtonText: {
        color: '#ffffff',
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    saveButton: {
        backgroundColor: '#10b981',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        flex: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    saveButtonText: {
        color: theme.colors.text.white,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    // Header Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
    },
    currentFileDisplay: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
        alignItems: 'center',
        width: '100%',
    },
    currentFileLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    currentFileName: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    fileNote: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: theme.spacing.xs,
    },
    // Save Button Styles
    saveButtonContainer: {
        marginVertical: theme.spacing.lg,
        width: '100%',
    },
    saveTrackButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        ...theme.shadows.default,
    },
    saveTrackButtonText: {
        color: theme.colors.text.white,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    saveFileButton: {
        backgroundColor: '#f59e0b',
        paddingVertical: 14,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    saveFileButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

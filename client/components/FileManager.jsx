import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { loadRunsFromFile, createNewRunsFile, getCurrentFileInfo } from '../utils/dataManager';

export default function FileManager({ onFileReady }) {
    const [currentFileInfo, setCurrentFileInfo] = useState({ name: 'No file loaded', isLoaded: false });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if there's already a file loaded
        const fileInfo = getCurrentFileInfo();
        setCurrentFileInfo(fileInfo);
        if (fileInfo.isLoaded) {
            onFileReady(true);
        }
    }, []);

    const handleLoadFromFile = async () => {
        setIsLoading(true);
        try {
            const loadedRuns = await loadRunsFromFile();
            if (loadedRuns) {
                const fileInfo = getCurrentFileInfo();
                setCurrentFileInfo(fileInfo);
                onFileReady(true, loadedRuns);
            }
        } catch (error) {
            console.error('Error loading file:', error);
            Alert.alert('Error', 'Failed to load file. Please try again.');
        }
        setIsLoading(false);
    };

    const handleCreateNewFile = async () => {
        setIsLoading(true);
        try {
            const result = await createNewRunsFile();
            if (result.success) {
                if (result.requiresLoad) {
                    // User needs to load the file they just saved
                    Alert.alert(
                        'File Created', 
                        result.message + ' Use "Load Existing File" to open it.',
                        [{ text: 'OK' }]
                    );
                } else {
                    // File was created in app folder
                    const fileInfo = getCurrentFileInfo();
                    setCurrentFileInfo(fileInfo);
                    onFileReady(true, {});
                }
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            console.error('Error creating file:', error);
            Alert.alert('Error', 'Failed to create new file. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Canyon Run Tracker</Text>
            <Text style={styles.subtitle}>Choose how to manage your run data</Text>
            
            <View style={styles.optionsContainer}>
                <TouchableOpacity 
                    style={[styles.optionButton, styles.loadButton]} 
                    onPress={handleLoadFromFile}
                    disabled={isLoading}
                >
                    <Text style={styles.optionIcon}>📁</Text>
                    <Text style={styles.optionTitle}>Load Existing File</Text>
                    <Text style={styles.optionDescription}>
                        Open a previously saved runs file from your device
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.optionButton, styles.createButton]} 
                    onPress={handleCreateNewFile}
                    disabled={isLoading}
                >
                    <Text style={styles.optionIcon}>📄</Text>
                    <Text style={styles.optionTitle}>Create New File</Text>
                    <Text style={styles.optionDescription}>
                        Create a new empty runs file and choose where to save it on your device
                    </Text>
                </TouchableOpacity>
            </View>

            {isLoading && (
                <Text style={styles.loadingText}>Processing...</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
        maxWidth: 400,
    },
    optionButton: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loadButton: {
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    createButton: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    optionIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    optionDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#1976D2',
        marginTop: 20,
    },
});

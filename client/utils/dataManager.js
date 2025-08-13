import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

let CURRENT_FILE_PATH = null;

const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 12);
};

const convertToRequiredFormat = (routeData) => {
  const uniqueId = generateUniqueId();
  const firstPoint = routeData.points[0];
  const lastPoint = routeData.points[routeData.points.length - 1];
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distanceMiles = calculateDistance(
    firstPoint.latitude, firstPoint.longitude,
    lastPoint.latitude, lastPoint.longitude
  );

  return {
    [uniqueId]: {
      location: routeData.canyonName || "Unknown Canyon",
      distance_miles: distanceMiles.toFixed(6),
      start: {
        meters: "0.0000000",
        latitude: firstPoint.latitude.toString(),
        longitude: firstPoint.longitude.toString(),
        altitude: (firstPoint.altitude || 0).toString(),
        time: new Date(firstPoint.timestamp).toISOString()
      },
      end: {
        meters: ((routeData.points.length - 1) * routeData.interval).toString() + ".0000000",
        latitude: lastPoint.latitude.toString(),
        longitude: lastPoint.longitude.toString(),
        altitude: (lastPoint.altitude || 0).toString(),
        time: new Date(lastPoint.timestamp).toISOString()
      },
      coordinates: routeData.points.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
        altitude: point.altitude || 0,
        timestamp: point.timestamp
      }))
    }
  };
};

// Create a new JSON file and let user choose location
export const createNewRunsFile = async () => {
  try {
    // Create initial empty runs structure
    const emptyRuns = {};
    const jsonContent = JSON.stringify(emptyRuns, null, 2);
    
    // Create a temporary file with a user-friendly name
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `canyon_runs_${timestamp}.json`;
    const tempPath = FileSystem.documentDirectory + fileName;
    
    // Write the empty runs file
    await FileSystem.writeAsStringAsync(tempPath, jsonContent);
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      // Share the file so user can save it wherever they want
      await Sharing.shareAsync(tempPath, {
        mimeType: 'application/json',
        dialogTitle: 'Save your new Canyon Runs file',
        UTI: 'public.json'
      });
      
      // After sharing, ask user to load the file they just saved
      return { 
        success: true, 
        message: `Created ${fileName}. Please load it from where you saved it.`,
        requiresLoad: true
      };
    } else {
      // Fallback: use the app directory
      CURRENT_FILE_PATH = tempPath;
      return { 
        success: true, 
        message: `Created ${fileName} in app folder`,
        requiresLoad: false
      };
    }
  } catch (error) {
    console.error('Error creating new runs file:', error);
    return { success: false, message: 'Failed to create new file' };
  }
};

// Let user choose and load an existing JSON file
export const loadRunsFromFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true, // Copy to writable location
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(asset.uri);
      const runsData = JSON.parse(fileContent);
      
      // Validate the format (basic check)
      if (typeof runsData === 'object') {
        // Copy to app's document directory for writing
        const fileName = asset.name || 'loaded_runs.json';
        const writablePath = FileSystem.documentDirectory + fileName;
        
        // Write to writable location
        await FileSystem.writeAsStringAsync(writablePath, fileContent);
        
        // Store the writable file path for future saves
        CURRENT_FILE_PATH = writablePath;
        console.log('File loaded and copied to writable location:', writablePath);
        return runsData;
      } else {
        throw new Error('Invalid JSON file format');
      }
    } else if (result.type === 'success') {
      // Handle older DocumentPicker API
      const fileContent = await FileSystem.readAsStringAsync(result.uri);
      const runsData = JSON.parse(fileContent);
      
      if (typeof runsData === 'object') {
        // Copy to writable location
        const fileName = result.name || 'loaded_runs.json';
        const writablePath = FileSystem.documentDirectory + fileName;
        
        await FileSystem.writeAsStringAsync(writablePath, fileContent);
        CURRENT_FILE_PATH = writablePath;
        console.log('File loaded and copied to writable location:', writablePath);
        return runsData;
      } else {
        throw new Error('Invalid JSON file format');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading runs from file:', error);
    throw error;
  }
};

// Load runs from current file or create new if none exists
export const loadRuns = async () => {
  try {
    if (!CURRENT_FILE_PATH) {
      // No file loaded yet, create a new one
      await createNewRunsFile();
      return {};
    }
    
    const fileInfo = await FileSystem.getInfoAsync(CURRENT_FILE_PATH);
    if (fileInfo.exists) {
      const fileContent = await FileSystem.readAsStringAsync(CURRENT_FILE_PATH);
      return JSON.parse(fileContent);
    } else {
      // File doesn't exist anymore, create new
      await createNewRunsFile();
      return {};
    }
  } catch (error) {
    console.error('Error loading runs:', error);
    return {};
  }
};

// Save a new run to the current file
export const saveRun = async (routeData) => {
  try {
    if (!CURRENT_FILE_PATH) {
      throw new Error('No file selected');
    }
    
    console.log('Saving run to:', CURRENT_FILE_PATH);
    
    const existingRuns = await loadRuns();
    console.log('Existing runs loaded:', Object.keys(existingRuns).length);
    
    const newRunData = convertToRequiredFormat(routeData);
    const updatedRuns = { ...existingRuns, ...newRunData };
    
    console.log('Total runs after adding new:', Object.keys(updatedRuns).length);
    
    await FileSystem.writeAsStringAsync(CURRENT_FILE_PATH, JSON.stringify(updatedRuns, null, 2));
    console.log('File written successfully');
    
    return Object.keys(newRunData)[0]; // Return the unique ID
  } catch (error) {
    console.error('Error saving run:', error);
    throw error;
  }
};

// Update canyon name for a specific run
export const updateRunLocation = async (runId, newLocation) => {
  try {
    if (!CURRENT_FILE_PATH) {
      throw new Error('No file selected');
    }
    
    const existingRuns = await loadRuns();
    if (existingRuns[runId]) {
      existingRuns[runId].location = newLocation;
      await FileSystem.writeAsStringAsync(CURRENT_FILE_PATH, JSON.stringify(existingRuns, null, 2));
    }
  } catch (error) {
    console.error('Error updating run location:', error);
    throw error;
  }
};

// Delete a specific run
export const deleteRun = async (runId) => {
  try {
    if (!CURRENT_FILE_PATH) {
      throw new Error('No file selected');
    }
    
    const existingRuns = await loadRuns();
    delete existingRuns[runId];
    await FileSystem.writeAsStringAsync(CURRENT_FILE_PATH, JSON.stringify(existingRuns, null, 2));
  } catch (error) {
    console.error('Error deleting run:', error);
    throw error;
  }
};

export const exportCurrentFile = async () => {
  try {
    if (!CURRENT_FILE_PATH) {
      return { success: false, message: 'No file loaded' };
    }

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      // Share the current file so user can save it wherever they want
      await Sharing.shareAsync(CURRENT_FILE_PATH, {
        mimeType: 'application/json',
        dialogTitle: 'Save your updated Canyon Runs file',
        UTI: 'public.json'
      });
      
      return { 
        success: true, 
        message: 'File shared successfully'
      };
    } else {
      return { success: false, message: 'Sharing not available' };
    }
  } catch (error) {
    console.error('Error exporting current file:', error);
    return { success: false, message: 'Failed to export file' };
  }
};

export const getCurrentFileInfo = () => {
  if (CURRENT_FILE_PATH) {
    const fileName = CURRENT_FILE_PATH.split('/').pop();
    return {
      path: CURRENT_FILE_PATH,
      name: fileName,
      isLoaded: true
    };
  }
  return {
    path: null,
    name: 'No file loaded',
    isLoaded: false
  };
};

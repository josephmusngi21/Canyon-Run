import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Track from './components/pages/Tracker/Track';
import FileManager from './components/FileManager';

export default function App() {
  const [fileReady, setFileReady] = useState(false);
  const [savedRuns, setSavedRuns] = useState({});

  const handleFileReady = (ready, runsData = {}) => {
    setFileReady(ready);
    setSavedRuns(runsData);
  };

  return (
    <View style={styles.container}>
      {!fileReady ? (
        <FileManager onFileReady={handleFileReady} />
      ) : (
        <Track 
          initialSavedRuns={savedRuns} 
          onFileManagerRequest={() => setFileReady(false)} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});

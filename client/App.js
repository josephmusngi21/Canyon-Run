import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import AddRun from './components/pages/Add/AddRun';
import Track from './components/pages/Tracker/Track';
import Maps from './components/pages/Maps/Maps';
import Altitude from './components/pages/Maps/Altitude';

import exampleData from './components/pages/Maps/canyon.json'; // Example JSON data file

export default function App() {
  const [listOfRuns, setListOfRuns] = useState(exampleData.coordinates[0]);
  // const [isAuthenticated, setIsAuthenticated] = useState(true);

  // const handleLogin = () => {
  //   setIsAuthenticated(true);
  // };

  return (
    <View style={styles.container}>
      <Track />
      <AddRun listOfRuns={listOfRuns} />
      {/* {(() => {
        try {
          return <Maps />;
        } catch (error) {
          console.error('Error rendering Maps:', error);
          return null;
        }
      })()} */}
      {/* <Altitude />
      <Maps /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { StyleSheet, View, Text } from 'react-native';
import React, { useState } from 'react';
//Maps
import Maps from './components/pages/Maps/Maps';
//Altitude
import Altitude from './components/pages/Maps/Altitude';
//AddRun
import AddRun from './components/pages/Add/AddRun';
import { Button } from 'react-native-web';

export default function App() {
  const [display, setDisplay] = useState(false);

  return (
    <View style={styles.container}>
    {display ? <View><Maps/><Altitude/>
    <Button title="Hide Maps" onPress={() => setDisplay(false)} />
    </View> : 
    <Button title="Show Maps" onPress={() => setDisplay(true)} />}
      {/* <Maps />
      <Altitude /> */}
      <AddRun />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
  },
});
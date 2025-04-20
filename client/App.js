import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
// import Geolocation from './components/Geolocation';
// import Register from './components/Register/Register';
// import Login from './components/Login/Login';
import { useState } from 'react';

import AddRun from './components/pages/Add/AddRun';
import Maps from './components/pages/Maps/Maps';
import Altitude from './components/pages/Maps/Altitude';

export default function App() {
  // const [isAuthenticated, setIsAuthenticated] = useState(true);

  // const handleLogin = () => {
  //   setIsAuthenticated(true);
  // };

  return (
    <View style={styles.container}>
      {/* <AddRun />
      {(() => {
        try {
          return <Maps />;
        } catch (error) {
          console.error('Error rendering Maps:', error);
          return null;
        }
      })()} */}
      <Altitude />
      <Maps />
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

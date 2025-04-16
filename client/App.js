import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
// import Geolocation from './components/Geolocation';
// import Register from './components/Register/Register';
// import Login from './components/Login/Login';
import { useState } from 'react';

import AddRun from './components/pages/Add/AddRun';

export default function App() {
  // const [isAuthenticated, setIsAuthenticated] = useState(true);

  // const handleLogin = () => {
  //   setIsAuthenticated(true);
  // };

  return (
    <View style={styles.container}>
      {/* {!isAuthenticated ? (
        <>
          <Login onLogin={handleLogin} />
          <Register />
        </>
      ) : (
        <Geolocation />
      )} */}
      {/* <Geolocation /> */}
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
  },
});

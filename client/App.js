import { StyleSheet, View, Text } from 'react-native';

//Maps
import Maps from './components/pages/Maps/Maps';
// //Altitude
import Altitude from './components/pages/Maps/Altitude';
// //AddRun
import AddRun from './components/pages/Add/AddRun';

export default function App() {
  return (
    <View style={styles.container}>
      <Maps />
      <Altitude />
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
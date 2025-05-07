import * as React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';

export default function App() {
  console.log('Made it to App.js');

  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
      <Button title="Press Me" onPress={() => console.log("Button Pressed")} />
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

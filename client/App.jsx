import { StyleSheet, View, Text, Button, ScrollView } from "react-native";
import React, { useState } from "react";
// Components
import Maps from "./components/pages/Maps/Maps";
import Altitude from "./components/pages/Maps/Altitude";
import AddRun from "./components/pages/Add/AddRun";

export default function App() {
  const [display, setDisplay] = useState(false);

  const showingMaps = () => {


    return (
      <View style={styles.mapContainer}>
        <Maps />
        <Altitude />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* <ScrollView styles={styles.scrollContainer}>
        {display ? (
          <View>
            <Button 
            title="Hide"
            onPress={() => {
              setDisplay(!display);
            }}
            />
          </View>
        ) : (
          <Button 
          title="Show"
          onPress={() => {
            setDisplay(!display);
          }}
          />
        )}
      </ScrollView> */}
      <AddRun />
      {/* <Maps /> */}
      {/* <Text>Hello</Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50, // Extra padding for better scrolling
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  mapContainer: {
    width: "90%",
    minHeight: 500, // Allows scrolling
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
});

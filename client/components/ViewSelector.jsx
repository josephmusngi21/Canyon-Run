import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Track from './pages/Tracker/Track';
import Maps from './pages/Maps/Maps';
import Altitude from './pages/Maps/Altitude';

const VIEWS = {
  TRACKER: 'tracker',
  MAPS: 'maps',
  ALTITUDE: 'altitude'
};

export default function ViewSelector({ initialSavedRuns = {}, onFileManagerRequest }) {
  const [currentView, setCurrentView] = useState(VIEWS.TRACKER);
  const [selectedRunData, setSelectedRunData] = useState(null);
  const [savedRuns, setSavedRuns] = useState(initialSavedRuns);

  // Handle when a run is selected for viewing
  const handleRunSelect = (runData) => {
    setSelectedRunData(runData);
    setCurrentView(VIEWS.MAPS);
  };

  // Handle when saved runs are updated in Track component
  const handleRunsUpdate = (updatedRuns) => {
    setSavedRuns(updatedRuns);
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[
          styles.tab,
          currentView === VIEWS.TRACKER && styles.activeTab
        ]}
        onPress={() => setCurrentView(VIEWS.TRACKER)}
      >
        <Text style={[
          styles.tabText,
          currentView === VIEWS.TRACKER && styles.activeTabText
        ]}>
          📍 Tracker
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          currentView === VIEWS.MAPS && styles.activeTab
        ]}
        onPress={() => setCurrentView(VIEWS.MAPS)}
      >
        <Text style={[
          styles.tabText,
          currentView === VIEWS.MAPS && styles.activeTabText
        ]}>
          🗺️ Map
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          currentView === VIEWS.ALTITUDE && styles.activeTab
        ]}
        onPress={() => setCurrentView(VIEWS.ALTITUDE)}
      >
        <Text style={[
          styles.tabText,
          currentView === VIEWS.ALTITUDE && styles.activeTabText
        ]}>
          📈 Elevation
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case VIEWS.TRACKER:
        return (
          <Track 
            initialSavedRuns={savedRuns} 
            onFileManagerRequest={onFileManagerRequest}
            onRunSelect={handleRunSelect}
            onRunsUpdate={handleRunsUpdate}
          />
        );
      case VIEWS.MAPS:
        return selectedRunData ? (
          <Maps runData={selectedRunData} />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No run selected. Go to the Tracker tab and select "View Map" on a saved run.
            </Text>
          </View>
        );
      case VIEWS.ALTITUDE:
        return selectedRunData ? (
          <Altitude runData={selectedRunData} />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No run selected. Go to the Tracker tab and select "View Map" on a saved run to see elevation data.
            </Text>
          </View>
        );
      default:
        return (
          <Track 
            initialSavedRuns={initialSavedRuns} 
            onFileManagerRequest={onFileManagerRequest}
            onRunSelect={handleRunSelect}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderTabBar()}
      <View style={styles.content}>
        {renderCurrentView()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingTop: 50, // Account for status bar
    paddingHorizontal: 15,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

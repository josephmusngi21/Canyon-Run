import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Track from './pages/Tracker/Track';
import SimplifiedMaps from './pages/Maps/Maps';
import { theme } from './shared/theme';

const VIEWS = {
  TRACKER: 'tracker',
  MAPS: 'maps'
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
          <SimplifiedMaps runData={selectedRunData} />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No run selected. Go to the Tracker tab and select "View Map" on a saved run.
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
    backgroundColor: theme.colors.backgroundLight,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingTop: 50, // Account for status bar
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    ...theme.shadows.default,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.text.white,
  },
  content: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

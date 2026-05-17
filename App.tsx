import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  isDirectoryPickerSupported,
  listDirectory,
  pickDirectory,
} from './src/native/DirectoryPicker';
import type {
  DirectoryEntry,
  DirectorySelection,
} from './src/native/DirectoryPicker';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';
  const [directory, setDirectory] = useState<DirectorySelection | null>(null);
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const colors = useMemo(
    () => ({
      background: isDarkMode ? '#111418' : '#f6f7f9',
      border: isDarkMode ? '#303741' : '#d8dde5',
      buttonBackground: isDarkMode ? '#e8eef7' : '#17202c',
      buttonText: isDarkMode ? '#111418' : '#ffffff',
      meta: isDarkMode ? '#a8b3c2' : '#637083',
      rowBackground: isDarkMode ? '#1a1f26' : '#ffffff',
      text: isDarkMode ? '#f4f7fb' : '#111827',
    }),
    [isDarkMode],
  );

  const handlePickDirectory = useCallback(async () => {
    if (!isDirectoryPickerSupported()) {
      Alert.alert(
        'Directory picker unavailable',
        'This platform needs a native DirectoryPicker module before it can browse folders.',
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const selectedDirectory = await pickDirectory();

      if (!selectedDirectory) {
        return;
      }

      const selectedEntries = await listDirectory(selectedDirectory.path);
      setDirectory(selectedDirectory);
      setEntries(selectedEntries);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not read the selected directory.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: safeAreaInsets.bottom + 24,
          paddingLeft: safeAreaInsets.left + 24,
          paddingRight: safeAreaInsets.right + 24,
          paddingTop: safeAreaInsets.top + 24,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, {color: colors.text}]}>Directory</Text>
          <Text
            numberOfLines={1}
            style={[styles.selectedPath, {color: colors.meta}]}>
            {directory?.path ?? 'No directory selected'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={handlePickDirectory}
          style={({pressed}) => [
            styles.pickButton,
            {backgroundColor: colors.buttonBackground},
            pressed && styles.pickButtonPressed,
            isLoading && styles.pickButtonDisabled,
          ]}>
          <Text style={[styles.pickButtonText, {color: colors.buttonText}]}>
            {directory ? 'Change' : 'Choose'}
          </Text>
        </Pressable>
      </View>

      {errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : null}

      <View style={[styles.list, {borderColor: colors.border}]}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator />
            <Text style={[styles.emptyText, {color: colors.meta}]}>
              Reading directory...
            </Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={item => item.path}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, {color: colors.meta}]}>
                  Choose a directory to show its files and folders.
                </Text>
              </View>
            }
            renderItem={({item}) => (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.rowBackground,
                    borderColor: colors.border,
                  },
                ]}>
                <Text style={styles.entryIcon}>
                  {item.isDirectory ? 'Folder' : 'File'}
                </Text>
                <View style={styles.entryTextGroup}>
                  <Text
                    numberOfLines={1}
                    style={[styles.entryName, {color: colors.text}]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.entryMeta, {color: colors.meta}]}>
                    {item.isDirectory ? 'Folder' : formatBytes(item.size)}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

function formatBytes(size: number | null): string {
  if (size === null) {
    return 'File';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    minHeight: 220,
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  entryIcon: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 52,
    textTransform: 'uppercase',
  },
  entryMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  errorMessage: {
    color: '#b42318',
    fontSize: 14,
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flex: 1,
  },
  pickButton: {
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 92,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  pickButtonDisabled: {
    opacity: 0.6,
  },
  pickButtonPressed: {
    opacity: 0.85,
  },
  pickButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedPath: {
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
  },
});

export default App;

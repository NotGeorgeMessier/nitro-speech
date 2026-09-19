/**
 * @format
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  ErrorDictionary,
  PermissionStatus,
  SpeechRecognitionError,
  useRecognizer,
  useVoiceInputVolume,
  type SpeechRecognitionConfig,
} from 'react-native-nitro-speech';

function permissionLabel(status: PermissionStatus): string {
  return PermissionStatus[status] ?? `unknown (${status})`;
}

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
  const insets = useSafeAreaInsets();
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState('unknown');
  const [progressMs, setProgressMs] = useState<number | null>(null);
  const [onDevicePrefer, setOnDevicePrefer] = useState(false);
  const [onDeviceAvailable, setOnDeviceAvailable] = useState<boolean | null>(
    null,
  );
  const volume = useVoiceInputVolume();

  const callbacks = useMemo(
    () => ({
      onReadyForSpeech: () => {
        setIsListening(true);
        setError(null);
      },
      onRecordingStopped: () => {
        setIsListening(false);
        setProgressMs(null);
      },
      onResult: (batches: string[]) => {
        setResults([...batches]);
      },
      onAutoFinishProgress: (timeLeftMs: number) => {
        setProgressMs(timeLeftMs);
      },
      onError: (code: SpeechRecognitionError) => {
        const info = ErrorDictionary[code];
        setError(info?.message ?? `Error ${code}`);
        setIsListening(false);
      },
      onPermissionDenied: () => {
        setError('Permission denied');
        setIsListening(false);
      },
    }),
    [],
  );

  const {
    startListening,
    stopListening,
    getPermissions,
    onDeviceRecognitionAvailable,
    prewarm,
  } = useRecognizer(callbacks);

  const refreshStatus = useCallback(() => {
    setPermission(permissionLabel(getPermissions()));
    setOnDeviceAvailable(onDeviceRecognitionAvailable('en-US'));
  }, [getPermissions, onDeviceRecognitionAvailable]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const onToggleListen = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    setError(null);
    setResults([]);
    setProgressMs(null);

    const config: SpeechRecognitionConfig = {
      locale: 'en-US',
      autoFinishRecognitionMs: 8000,
      autoFinishProgressIntervalMs: 1000,
      startHapticFeedbackStyle: 'none',
      stopHapticFeedbackStyle: 'none',
      ...(onDevicePrefer ? {onDevice: 'prefer'} : {}),
    };

    startListening(config);
  }, [isListening, onDevicePrefer, startListening, stopListening]);

  const onPrewarm = useCallback(() => {
    setError(null);
    void prewarm(
      {
        locale: 'en-US',
        ...(onDevicePrefer ? {onDevice: 'prefer'} : {}),
      },
      {requestPermission: true, loadOnDeviceModel: onDevicePrefer},
    ).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  }, [onDevicePrefer, prewarm]);

  return (
    <View style={[styles.screen, {paddingTop: insets.top}]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Nitro Speech</Text>
        <Text style={styles.subtitle}>Happy-path listen demo</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Permission</Text>
          <Text testID="permission-status" style={styles.value}>
            {permission}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Listening</Text>
          <Text testID="listening-status" style={styles.value}>
            {isListening ? 'yes' : 'no'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>On-device service</Text>
          <Text testID="on-device-status" style={styles.value}>
            {onDeviceAvailable == null
              ? 'unknown'
              : onDeviceAvailable
                ? 'available'
                : 'unavailable'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Volume</Text>
          <Text testID="volume-status" style={styles.value}>
            {volume.smoothedVolume.toFixed(2)}
          </Text>
        </View>
        {progressMs != null && (
          <View style={styles.row}>
            <Text style={styles.label}>Auto-finish</Text>
            <Text style={styles.value}>{Math.round(progressMs / 1000)}s</Text>
          </View>
        )}

        <Pressable
          testID="check-permissions-button"
          style={styles.button}
          onPress={refreshStatus}>
          <Text style={styles.buttonText}>Check permissions</Text>
        </Pressable>

        <Pressable
          testID="toggle-on-device-button"
          style={[styles.button, onDevicePrefer && styles.buttonOn]}
          onPress={() => setOnDevicePrefer(value => !value)}>
          <Text style={styles.buttonText}>
            On-device prefer: {onDevicePrefer ? 'on' : 'off'}
          </Text>
        </Pressable>

        <Pressable
          testID="prewarm-button"
          style={styles.button}
          onPress={onPrewarm}>
          <Text style={styles.buttonText}>Prewarm</Text>
        </Pressable>

        <Pressable
          testID="toggle-listening-button"
          style={[styles.button, isListening && styles.buttonStop]}
          onPress={onToggleListen}>
          <Text style={styles.buttonText}>
            {isListening ? 'Stop listening' : 'Start listening'}
          </Text>
        </Pressable>

        {error != null && (
          <View testID="error-banner" style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {results.length > 0 && (
          <View testID="results-banner" style={styles.resultBox}>
            <Text style={styles.resultTitle}>Results</Text>
            {results.map((line, index) => (
              <Text key={`${index}-${line}`} style={styles.resultText}>
                {line}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.hint}>
          Emulators produce silence only. On Android, stop within 3s of start
          to avoid the native speech-timeout error.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#94a3b8',
    fontSize: 15,
  },
  value: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonOn: {
    backgroundColor: '#0f766e',
  },
  buttonStop: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 14,
  },
  resultBox: {
    backgroundColor: '#14532d',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  resultTitle: {
    color: '#bbf7d0',
    fontWeight: '700',
    marginBottom: 4,
  },
  resultText: {
    color: '#dcfce7',
    fontSize: 15,
  },
  hint: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
});

export default App;

import React, { useCallback, useState } from 'react'
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native'
import {
  SpeechRecognizer,
  ErrorDictionary,
  SpeechRecognitionError,
  PermissionStatus,
} from 'react-native-nitro-speech'

export default function App() {
  const [isActive, setIsActive] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown')

  const checkPermissions = useCallback(() => {
    const status = SpeechRecognizer.getPermissions()
    const statusName = PermissionStatus[status] ?? 'UNKNOWN'
    setPermissionStatus(statusName)
    return status
  }, [])

  const startListening = useCallback(() => {
    setError(null)
    setResults([])

    SpeechRecognizer.onReadyForSpeech = () => {
      setIsActive(true)
    }

    SpeechRecognizer.onRecordingStopped = () => {
      setIsActive(false)
    }

    SpeechRecognizer.onResult = (batches) => {
      setResults([...batches])
    }

    SpeechRecognizer.onError = (err: SpeechRecognitionError) => {
      const errorInfo = ErrorDictionary[err]
      setError(errorInfo?.message ?? `Unknown error: ${err}`)
      setIsActive(false)
    }

    SpeechRecognizer.onPermissionDenied = () => {
      setError('Permission denied')
      setIsActive(false)
    }

    SpeechRecognizer.startListening({
      locale: 'en-US',
      autoFinishRecognitionMs: 8000,
      autoFinishProgressIntervalMs: 1000,
    })
  }, [])

  const stopListening = useCallback(() => {
    SpeechRecognizer.stopListening()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>NitroSpeech Example</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Permission Status:</Text>
          <Text style={styles.statusValue}>{permissionStatus}</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Active:</Text>
          <Text style={styles.statusValue}>{isActive ? 'Yes' : 'No'}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={checkPermissions}
          testID="check-permissions-button"
        >
          <Text style={styles.buttonText}>Check Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isActive && styles.buttonActive]}
          onPress={isActive ? stopListening : startListening}
          testID="toggle-listening-button"
        >
          <Text style={styles.buttonText}>
            {isActive ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Results:</Text>
            {results.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  resultsContainer: {
    backgroundColor: '#E5F5E5',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
})

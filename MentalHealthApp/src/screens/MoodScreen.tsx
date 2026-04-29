import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

const moodColor = (value: number) => {
  if (value <= 3) return '#d32f2f';
  if (value <= 6) return '#f57c00';
  return '#388e3c';
};

export default function MoodScreen() {
  const navigation = useNavigation();
  const [moodScore, setMoodScore] = useState(5);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const payload = {
        mood_score: moodScore,
        note: note.trim() || undefined,
      };

      await apiClient.post('/mood', payload);
      setSuccessMessage('Mood logged successfully.');
      setTimeout(() => {
        navigation.goBack();
      }, 900);
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Unable to save mood. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>How are you feeling?</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Mood score</Text>
          <Text style={styles.scoreValue}>{moodScore}</Text>
        </View>

        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={moodScore}
            minimumTrackTintColor={moodColor(moodScore)}
            maximumTrackTintColor="#b2dfdb"
            thumbTintColor={moodColor(moodScore)}
            onValueChange={setMoodScore}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Very Low</Text>
            <Text style={styles.sliderLabel}>Great</Text>
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>What's on your mind?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Write a short note..."
            placeholderTextColor="#757575"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Submit Mood</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#e0f2f1',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#e0f2f1',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#004d40',
    marginBottom: 24,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#00796b',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: '800',
    color: '#004d40',
  },
  sliderContainer: {
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#004d40',
  },
  inputWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#004d40',
    marginBottom: 12,
  },
  textInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#b2dfdb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f1f8f7',
    color: '#004d40',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#00897b',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    color: '#388e3c',
    marginBottom: 12,
    textAlign: 'center',
  },
});

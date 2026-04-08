import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { answerQuestion, setLatestScore } from '../store/assessmentSlice';
import apiClient from '../api/client';
import { RootState } from '../store';

export default function AssessmentScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const currentAnswers = useSelector((state: RootState) => state.assessments.currentAnswers);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await apiClient.get('/assessments/questions');
      setQuestions(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load assessment questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (score: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    dispatch(answerQuestion({ questionId: currentQuestion.id, score }));

    // Animate out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(async () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        await submitAssessment(score, currentQuestion.id);
      }
    });
  };

  const submitAssessment = async (lastScore: number, lastQuestionId: string) => {
    setSubmitting(true);
    try {
      // Need to include the last answer eagerly since Redux state might not have flushed in time
      const finalAnswers = { ...currentAnswers, [lastQuestionId]: lastScore };
      const response = await apiClient.post('/assessments', { responses: finalAnswers });
      
      // Assume backend returns: { id: ..., scores: { anxiety: x, depression: y, stress: z } }
      dispatch(setLatestScore(response.data.scores));
      navigation.replace('Results'); // Use replace to prevent going back to assessment
    } catch (error) {
      Alert.alert('Error', 'Failed to submit assessment results.');
      setSubmitting(false);
    }
  };

  const getProgressWidth = () => {
    if (questions.length === 0) return '0%';
    return `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4db6ac" />
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4db6ac" />
        <Text style={styles.submittingText}>Analyzing your results...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>No questions available.</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: getProgressWidth() as any }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <Text style={styles.questionCounter}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          
          <Text style={styles.questionText}>
            {currentQuestion.text}
          </Text>

          <View style={styles.likertContainer}>
            {[1, 2, 3, 4, 5].map((score) => (
              <TouchableOpacity
                key={score}
                style={styles.likertButton}
                onPress={() => handleAnswer(score)}
              >
                <Text style={styles.likertText}>{score}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.labelsContainer}>
            <Text style={styles.labelText}>Never</Text>
            <Text style={styles.labelText}>Always</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressContainer: { height: 6, backgroundColor: '#e0e0e0', width: '100%' },
  progressBar: { height: '100%', backgroundColor: '#4db6ac' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  submittingText: { marginTop: 16, fontSize: 16, color: '#4db6ac', fontWeight: '500' },
  questionCounter: { fontSize: 14, color: '#757575', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  questionText: { fontSize: 24, color: '#263238', fontWeight: '500', marginBottom: 48, lineHeight: 32 },
  likertContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  likertButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  likertText: { fontSize: 18, fontWeight: '600', color: '#00897b' },
  labelsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  labelText: { fontSize: 12, color: '#9e9e9e' },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import apiClient from '../api/client';
import { getSeverityLabel } from '../services/scoring';

const { width: screenWidth } = Dimensions.get('window');

interface AssessmentRecord {
  id: number;
  depression_score: number;
  anxiety_score: number;
  created_at: string;
}

const formatDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
};

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<AssessmentRecord[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await apiClient.get<AssessmentRecord[]>('/assessments/history?days=30');
        setRecords(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Unable to load assessment history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const chartData = {
    labels: records.map(record => formatDateLabel(record.created_at)),
    datasets: [
      {
        data: records.map(record => record.depression_score),
        color: () => '#ef5350',
        strokeWidth: 2,
        label: 'Depression',
      },
      {
        data: records.map(record => record.anxiety_score),
        color: () => '#42a5f5',
        strokeWidth: 2,
        label: 'Anxiety',
      },
    ],
    legend: ['Depression', 'Anxiety'],
  };

  const recentRecord = records[records.length - 1];

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#00897b" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (records.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Complete more assessments to see your trend</Text>
        <Text style={styles.emptySubtitle}>Your history will appear here after two or more assessments.</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Assessment')}>
          <Text style={styles.emptyButtonText}>Take Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Assessment History</Text>

      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={260}
        yAxisSuffix=""
        chartConfig={{
          backgroundGradientFrom: '#e0f2f1',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 77, 64, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 77, 64, ${opacity})`,
          style: {
            borderRadius: 20,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#ffffff',
          },
        }}
        bezier
        style={styles.chart}
        fromZero
        withShadow={false}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Most Recent Scores</Text>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Depression</Text>
            <Text style={styles.scoreValue}>{recentRecord.depression_score}</Text>
            <Text style={styles.severityText}>{getSeverityLabel(recentRecord.depression_score, 'depression')}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Anxiety</Text>
            <Text style={styles.scoreValue}>{recentRecord.anxiety_score}</Text>
            <Text style={styles.severityText}>{getSeverityLabel(recentRecord.anxiety_score, 'anxiety')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#e0f2f1',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f2f1',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#004d40',
    marginBottom: 20,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 20,
  },
  summaryCard: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004d40',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreItem: {
    width: '48%',
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#00796b',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#004d40',
  },
  severityText: {
    marginTop: 8,
    fontSize: 14,
    color: '#004d40',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#004d40',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#00695c',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#00897b',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    textAlign: 'center',
  },
});

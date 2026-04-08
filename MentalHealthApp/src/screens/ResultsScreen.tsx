import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { BarChart } from 'react-native-chart-kit';
import { checkHighRisk, getCategoryMessage } from '../services/scoring';

const screenWidth = Dimensions.get('window').width;

export default function ResultsScreen({ navigation }: any) {
  const latestScore = useSelector((state: RootState) => state.assessments.latestScore);

  if (!latestScore) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>No results found. Please take an assessment.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Assessment')}>
          <Text style={styles.primaryButtonText}>Start Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isHighRisk = checkHighRisk(latestScore);

  const data = {
    labels: ['Anxiety', 'Depression', 'Stress'],
    datasets: [
      {
        data: [latestScore.anxiety, latestScore.depression, latestScore.stress]
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: '#e0f2f1',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 137, 123, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 14,
      fontWeight: 'bold',
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Your Assessment Results</Text>
      
      <View style={styles.chartContainer}>
        <BarChart
          data={data}
          width={screenWidth - 48}
          height={260}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          showValuesOnTopOfBars
          style={styles.chart}
        />
      </View>

      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>Breakdown</Text>
        
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Anxiety: {latestScore.anxiety}</Text>
          <Text style={styles.categoryDesc}>{getCategoryMessage('anxiety', latestScore.anxiety)}</Text>
        </View>
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Depression: {latestScore.depression}</Text>
          <Text style={styles.categoryDesc}>{getCategoryMessage('depression', latestScore.depression)}</Text>
        </View>
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Stress: {latestScore.stress}</Text>
          <Text style={styles.categoryDesc}>{getCategoryMessage('stress', latestScore.stress)}</Text>
        </View>
      </View>

      {isHighRisk && (
        <View style={styles.crisisContainer}>
          <Text style={styles.crisisWarning}>Important Warning</Text>
          <Text style={styles.crisisText}>
            Your results indicate severe levels of distress. You don't have to go through this alone.
          </Text>
          <TouchableOpacity 
            style={styles.crisisButton} 
            onPress={() => navigation.navigate('Crisis Support')}
          >
            <Text style={styles.crisisButtonText}>Connect to Crisis Support</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Dashboard')}>
        <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f8f6',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#004d40',
    marginBottom: 24,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 32,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  breakdownContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#263238',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4db6ac',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00695c',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 14,
    color: '#546e7a',
    lineHeight: 20,
  },
  crisisContainer: {
    backgroundColor: '#ffebee',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef9a9a',
    marginBottom: 32,
  },
  crisisWarning: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 8,
  },
  crisisText: {
    fontSize: 14,
    color: '#b71c1c',
    marginBottom: 16,
    lineHeight: 20,
  },
  crisisButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  crisisButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#00897b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

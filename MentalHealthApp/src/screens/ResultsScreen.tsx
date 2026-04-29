import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Modal, Linking, FlatList } from 'react-native';
import * as Localization from 'expo-localization';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { BarChart } from 'react-native-chart-kit';
import { checkHighRisk, getCategoryMessage, getSeverityLabel } from '../services/scoring';
import { helplines, defaultHelpline, HelplineConfig } from '../config/crisisHelplines';

const screenWidth = Dimensions.get('window').width;

export default function ResultsScreen({ navigation, route }: any) {
  const latestScore = useSelector((state: RootState) => state.assessments.latestScore);
  const mlResult = route?.params?.mlResult;
  const [modalVisible, setModalVisible] = useState(false);
  const [showOtherCountries, setShowOtherCountries] = useState(false);
  const [selectedHelpline, setSelectedHelpline] = useState<HelplineConfig | null>(null);

  const countryCode = (Localization.region || 'GLOBAL').toUpperCase();
  const primaryHelpline = helplines[countryCode] || defaultHelpline;

  const openCrisisModal = () => {
    setSelectedHelpline(primaryHelpline);
    setShowOtherCountries(false);
    setModalVisible(true);
  };

  const closeCrisisModal = () => {
    setModalVisible(false);
  };

  const dialNumber = (phone: string) => {
    const digits = phone.replace(/[^0-9+]/g, '');
    if (!digits) return;
    Linking.openURL(`tel:${digits}`);
  };

  const renderHelplineItem = ({ item }: { item: HelplineConfig }) => (
    <View style={styles.countryItem}>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryDetails}>{item.description}</Text>
      <Text style={styles.countryPhone}>{item.phone}</Text>
    </View>
  );

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

  const isHighRisk = checkHighRisk({ anxiety: latestScore.anxiety, depression: latestScore.depression }, latestScore.answers);

  const getBarColor = (score: number, category: 'anxiety' | 'depression') => {
    const severity = getSeverityLabel(score, category);
    switch (severity) {
      case 'Minimal': return '#4db6ac';
      case 'Mild': return '#fff176';
      case 'Moderate': return '#ffb74d';
      case 'Moderately Severe':
      case 'Severe': return '#ef5350';
      default: return '#4db6ac';
    }
  };

  const data = {
    labels: ['Anxiety', 'Depression'],
    datasets: [
      {
        data: [latestScore.anxiety, latestScore.depression]
      }
    ],
    barColors: [getBarColor(latestScore.anxiety, 'anxiety'), getBarColor(latestScore.depression, 'depression')]
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

      <View style={styles.severityContainer}>
        <Text style={[styles.severityText, { color: getBarColor(latestScore.anxiety, 'anxiety') }]}>
          Anxiety: {getSeverityLabel(latestScore.anxiety, 'anxiety')}
        </Text>
        <Text style={[styles.severityText, { color: getBarColor(latestScore.depression, 'depression') }]}>
          Depression: {getSeverityLabel(latestScore.depression, 'depression')}
        </Text>
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
      </View>

      {mlResult?.label && (
        <View style={styles.aiContainer}>
          <Text style={styles.aiTitle}>AI Insight</Text>
          <Text style={styles.aiText}>
            {mlResult.label} ({Math.round((mlResult.confidence ?? 0) * 100)}% confidence)
          </Text>
        </View>
      )}

      {isHighRisk && (
        <View style={styles.crisisContainer}>
          <Text style={styles.crisisWarning}>Important Warning</Text>
          <Text style={styles.crisisText}>
            Your results indicate severe levels of distress. You don't have to go through this alone.
          </Text>
          <TouchableOpacity 
            style={styles.crisisButton} 
            onPress={openCrisisModal}
          >
            <Text style={styles.crisisButtonText}>Connect to Crisis Support</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crisis Support</Text>
              <TouchableOpacity onPress={closeCrisisModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            {selectedHelpline ? (
              <View style={styles.helplineCard}>
                <Text style={styles.helplineName}>{selectedHelpline.name}</Text>
                <Text style={styles.helplineDesc}>{selectedHelpline.description}</Text>
                <Text style={styles.helplinePhone}>{selectedHelpline.phone}</Text>
                <TouchableOpacity style={styles.callButton} onPress={() => dialNumber(selectedHelpline.phone)}>
                  <Text style={styles.callButtonText}>Call Now</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity style={styles.otherButton} onPress={() => setShowOtherCountries(!showOtherCountries)}>
              <Text style={styles.otherButtonText}>{showOtherCountries ? 'Hide other countries' : 'Show other countries'}</Text>
            </TouchableOpacity>

            {showOtherCountries && (
              <FlatList
                data={Object.values(helplines)}
                keyExtractor={(item) => item.name}
                renderItem={renderHelplineItem}
                style={styles.countryList}
              />
            )}
          </View>
        </View>
      </Modal>

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
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  severityText: {
    fontSize: 16,
    fontWeight: '600',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#f1f8f6',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#b2dfdb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#004d40',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: '#00796b',
    fontWeight: '700',
  },
  helplineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#4db6ac',
    marginBottom: 16,
  },
  helplineName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00796b',
    marginBottom: 6,
  },
  helplineDesc: {
    fontSize: 14,
    color: '#455a64',
    marginBottom: 12,
  },
  helplinePhone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004d40',
    marginBottom: 16,
  },
  callButton: {
    backgroundColor: '#00796b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  otherButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  otherButtonText: {
    color: '#00695c',
    fontWeight: '700',
  },
  countryList: {
    maxHeight: 240,
  },
  countryItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cfd8dc',
    marginBottom: 12,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#004d40',
    marginBottom: 4,
  },
  countryDetails: {
    fontSize: 13,
    color: '#546e7a',
    marginBottom: 8,
  },
  countryPhone: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00796b',
  },
  aiContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#b2dfdb',
    marginBottom: 24,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00796b',
    marginBottom: 8,
  },
  aiText: {
    fontSize: 15,
    color: '#455a64',
    lineHeight: 22,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePatient } from '../contexts/PatientContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { checkMedicationInteractions } from '../services/FdaService';
import { MedicationInteraction } from '../types';

const AnalysisScreen: React.FC = () => {
  const navigation = useNavigation();
  const { patient } = usePatient();
  const [interactions, setInteractions] = useState<MedicationInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (patient && patient.medications.length > 1) {
      checkInteractions();
    }
  }, [patient]);

  const checkInteractions = async () => {
    if (!patient || patient.medications.length < 2) return;

    try {
      setLoading(true);
      setError(null);
      const medicationNames = patient.medications.map(med => med.name);
      const results = await checkMedicationInteractions(medicationNames);
      setInteractions(results);
    } catch (err) {
      console.error('Error checking interactions:', err);
      setError('Failed to check medication interactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTechnicalDetails = (index: number) => {
    setExpandedDetails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!patient) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>Please set up your profile first</Text>
        <Button
          title="Go to Profile"
          onPress={() => navigation.navigate('Profile' as never)}
          style={styles.button}
        />
      </View>
    );
  }

  if (patient.medications.length < 2) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>You need at least two medications to check for interactions</Text>
        <Button
          title="Add Medications"
          onPress={() => navigation.navigate('Medications' as never)}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={styles.title}>Safety Analysis</Text>
        <Text style={styles.subtitle}>
          This analysis helps you understand potential concerns when taking multiple medications together
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Analyzing your medications...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Try Again"
              onPress={checkInteractions}
              style={styles.retryButton}
            />
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>
              {interactions.length > 0
                ? 'Potential Interactions Found'
                : 'No Interactions Found'}
            </Text>

            {interactions.length > 0 ? (
              interactions.map((interaction, index) => (
                <Card key={index} style={styles.interactionCard}>
                  <View style={styles.interactionHeader}>
                    <Text style={styles.interactionTitle}>
                      {interaction.drug1} + {interaction.drug2}
                    </Text>
                    <View style={[
                      styles.severityBadge,
                      interaction.severity === 'minor' && styles.minorBadge,
                      interaction.severity === 'moderate' && styles.moderateBadge,
                      interaction.severity === 'major' && styles.majorBadge,
                    ]}>
                      <Text style={styles.severityText}>
                        {interaction.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Simple explanation for laypeople */}
                  <Text style={styles.simplifiedExplanation}>
                    {interaction.simplifiedExplanation} 
                    {interaction.severity === 'major' && ' This is a SERIOUS interaction that requires immediate attention.'}
                    {interaction.severity === 'moderate' && ' This is a MODERATE interaction that should be discussed with your doctor.'}
                    {interaction.severity === 'minor' && ' This is a MINOR interaction but should still be monitored.'}
                  </Text>

                  {/* Possible effects section */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionSubtitle}>What might happen:</Text>
                    {interaction.possibleEffects.map((effect, idx) => (
                      <View key={idx} style={styles.bulletPoint}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{effect}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Recommendations section */}
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionSubtitle}>What you should do:</Text>
                    {interaction.recommendations.map((recommendation, idx) => (
                      <View key={idx} style={styles.bulletPoint}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{recommendation}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Technical details that toggle on/off */}
                  <TouchableOpacity 
                    style={styles.toggleButton}
                    onPress={() => toggleTechnicalDetails(index)}
                  >
                    <Text style={styles.toggleButtonText}>
                      {expandedDetails[index] ? 'Hide Technical Details' : 'Show Technical Details'}
                    </Text>
                  </TouchableOpacity>

                  {expandedDetails[index] && (
                    <View style={styles.technicalDetails}>
                      <Text style={styles.technicalTitle}>Technical Description:</Text>
                      <Text style={styles.technicalText}>{interaction.description}</Text>
                    </View>
                  )}
                </Card>
              ))
            ) : (
              <Text style={styles.noInteractionsText}>
                Good news! No potential interactions were found between your current medications.
                However, always consult with your healthcare provider before making any changes to
                your medication regimen.
              </Text>
            )}

            {patient.medications.length > 0 && (
              <View style={styles.medicationsSection}>
                <Text style={styles.sectionTitle}>Your Medications</Text>
                {patient.medications.map((medication, index) => (
                  <View key={index} style={styles.medicationItem}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                  </View>
                ))}
              </View>
            )}

            <Button
              title="Refresh Analysis"
              onPress={checkInteractions}
              style={styles.refreshButton}
            />
          </View>
        )}
      </Card>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Disclaimer: This analysis is for informational purposes only and is not a substitute for
          professional medical advice. Always consult with your healthcare provider about potential
          drug interactions.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  button: {
    minWidth: 160,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  resultsContainer: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
    color: '#333',
  },
  interactionCard: {
    marginBottom: 16,
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  interactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#757575',
  },
  minorBadge: {
    backgroundColor: '#FFC107',
  },
  moderateBadge: {
    backgroundColor: '#FF9800',
  },
  majorBadge: {
    backgroundColor: '#F44336',
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  simplifiedExplanation: {
    fontSize: 16,
    marginVertical: 12,
    color: '#333',
  },
  sectionContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 16,
    marginRight: 8,
    color: '#555',
    marginTop: -2,
  },
  bulletText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  toggleButton: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#555',
  },
  noInteractionsText: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 24,
  },
  medicationsSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    marginTop: 16,
  },
  disclaimer: {
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  technicalDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  technicalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#555',
  },
  technicalText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default AnalysisScreen; 
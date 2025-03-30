import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePatient } from '../contexts/PatientContext';
import Button from '../components/Button';
import Card from '../components/Card';

const SymptomsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { patient } = usePatient();

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Symptoms</Text>
        <Button
          title="Add"
          onPress={() => navigation.navigate('AddSymptom' as never)}
          style={styles.addButton}
        />
      </View>

      {patient.symptoms.length > 0 ? (
        <View>
          {patient.symptoms.map(symptom => (
            <Card key={symptom.id} style={styles.card}>
              <View style={styles.symptomHeader}>
                <Text style={styles.symptomName}>{symptom.name}</Text>
                <Text style={styles.symptomSeverity}>Severity: {symptom.severity}/10</Text>
              </View>
              <Text style={styles.symptomDate}>Recorded: {symptom.dateRecorded}</Text>
              {symptom.notes && <Text style={styles.notes}>{symptom.notes}</Text>}
            </Card>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't recorded any symptoms yet</Text>
          <Button
            title="Record Symptom"
            onPress={() => navigation.navigate('AddSymptom' as never)}
            style={styles.button}
          />
        </View>
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    minWidth: 80,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  card: {
    marginBottom: 12,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  symptomSeverity: {
    color: '#E91E63',
    fontWeight: '500',
  },
  symptomDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default SymptomsScreen; 
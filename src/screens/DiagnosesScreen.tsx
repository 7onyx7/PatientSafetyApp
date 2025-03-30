import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePatient } from "../contexts/PatientContext";
import Button from "../components/Button";
import Card from "../components/Card";
import { formatDate } from "../utils/helpers";

const DiagnosesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { patient, updatePatient } = usePatient();

  const deleteDiagnosis = (id: string, name: string) => {
    Alert.alert(
      "Delete Diagnosis",
      `Are you sure you want to delete "${name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedDiagnoses =
              patient?.diagnoses.filter((d) => d.id !== id) || [];
            patient &&
              updatePatient({ ...patient, diagnoses: updatedDiagnoses });
          },
        },
      ]
    );
  };

  if (!patient) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Diagnoses</Text>
        <Text style={styles.subtitle}>
          Track and manage your medical diagnoses
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddDiagnosis" as never)}
          >
            <Text style={styles.addButtonText}>+ Add New Diagnosis</Text>
          </TouchableOpacity>
        </View>

        {patient.diagnoses.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No Diagnoses Recorded</Text>
            <Text style={styles.emptyStateText}>
              Recording your medical diagnoses helps analyze potential risks and
              provide personalized safety information.
            </Text>
          </View>
        ) : (
          <View style={styles.diagnosesContainer}>
            {patient.diagnoses.map((diagnosis) => (
              <View key={diagnosis.id} style={styles.diagnosisCard}>
                <View style={styles.diagnosisHeader}>
                  <Text style={styles.diagnosisName}>{diagnosis.name}</Text>
                </View>
                <View style={styles.diagnosisDetails}>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Diagnosed On:</Text>
                    <Text style={styles.value}>
                      {formatDate(diagnosis.diagnosedDate)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Diagnosed By:</Text>
                    <Text style={styles.value}>{diagnosis.diagnosedBy}</Text>
                  </View>
                  {diagnosis.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{diagnosis.notes}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      deleteDiagnosis(diagnosis.id, diagnosis.name)
                    }
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#0a1128",
  },
  container: {
    flex: 1,
    backgroundColor: "#0a1128",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    marginBottom: 10,
  },
  actionSection: {
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: "#4a80f5",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyStateCard: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#0f1635",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateText: {
    color: "white",
    textAlign: "center",
    lineHeight: 22,
  },
  diagnosesContainer: {
    marginBottom: 20,
  },
  diagnosisCard: {
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    backgroundColor: "#0f1635",
  },
  diagnosisHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  diagnosisName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  diagnosisDetails: {
    padding: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    color: "white",
    fontWeight: "500",
  },
  value: {
    fontSize: 15,
    color: "white",
  },
  notesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 15,
    color: "white",
    fontWeight: "500",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: "white",
    lineHeight: 20,
  },
  deleteButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "rgba(220,53,69,0.2)",
    borderRadius: 6,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ff6b6b",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
  },
});

export default DiagnosesScreen;

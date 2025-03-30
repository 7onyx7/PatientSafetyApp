import React, { useState, useContext, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { usePatient } from "../contexts/PatientContext";
import { Symptom } from "../types";

const SymptomsScreen = () => {
  const { patient, updatePatient } = usePatient();
  const [newSymptom, setNewSymptom] = useState("");
  const [newSeverity, setNewSeverity] = useState("medium");
  const [newDuration, setNewDuration] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [currentSymptom, setCurrentSymptom] = useState<Symptom | null>(null);

  if (!patient) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Symptoms</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      </View>
    );
  }

  const addSymptom = () => {
    if (newSymptom.trim() === "") {
      Alert.alert("Error", "Please enter a symptom description");
      return;
    }

    // Check if symptom already exists
    const symptomExists = patient.symptoms.some(
      (s) => s.description.toLowerCase() === newSymptom.toLowerCase()
    );

    if (symptomExists) {
      Alert.alert("Error", "This symptom has already been recorded");
      return;
    }

    const symptom: Symptom = {
      id: Date.now().toString(),
      description: newSymptom,
      severity: newSeverity as "low" | "medium" | "high",
      duration: newDuration,
      dateRecorded: new Date().toISOString(),
    };

    const updatedSymptoms = [...patient.symptoms, symptom];
    updatePatient({ ...patient, symptoms: updatedSymptoms });
    clearForm();
  };

  const updateSymptom = () => {
    if (!currentSymptom) return;
    if (newSymptom.trim() === "") {
      Alert.alert("Error", "Please enter a symptom description");
      return;
    }

    const updatedSymptoms = patient.symptoms.map((s) =>
      s.id === currentSymptom.id
        ? {
            ...s,
            description: newSymptom,
            severity: newSeverity as "low" | "medium" | "high",
            duration: newDuration,
          }
        : s
    );

    updatePatient({ ...patient, symptoms: updatedSymptoms });
    clearForm();
    setEditMode(false);
  };

  const deleteSymptom = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this symptom?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedSymptoms = patient.symptoms.filter((s) => s.id !== id);
            updatePatient({ ...patient, symptoms: updatedSymptoms });
          },
        },
      ]
    );
  };

  const editSymptom = (symptom: Symptom) => {
    setCurrentSymptom(symptom);
    setNewSymptom(symptom.description);
    setNewSeverity(symptom.severity);
    setNewDuration(symptom.duration || "");
    setEditMode(true);
  };

  const clearForm = () => {
    setNewSymptom("");
    setNewSeverity("medium");
    setNewDuration("");
    setCurrentSymptom(null);
  };

  const cancelEdit = () => {
    clearForm();
    setEditMode(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return { backgroundColor: "rgba(255, 89, 89, 0.25)", text: "#ff5959" };
      case "medium":
        return { backgroundColor: "rgba(255, 170, 0, 0.25)", text: "#ffaa00" };
      case "low":
        return { backgroundColor: "rgba(76, 175, 80, 0.25)", text: "#4caf50" };
      default:
        return { backgroundColor: "rgba(76, 175, 80, 0.25)", text: "#4caf50" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Symptoms</Text>
        <Text style={styles.subtitle}>
          Record and track your symptoms over time
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editMode ? "Update Symptom" : "Add New Symptom"}
          </Text>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter symptom description"
            placeholderTextColor="#8d8fa8"
            value={newSymptom}
            onChangeText={setNewSymptom}
          />

          <Text style={styles.label}>Severity</Text>
          <View style={styles.severityContainer}>
            {["low", "medium", "high"].map((severity) => (
              <TouchableOpacity
                key={severity}
                style={[
                  styles.severityOption,
                  newSeverity === severity && styles.selectedSeverity,
                  {
                    backgroundColor: getSeverityColor(severity).backgroundColor,
                  },
                ]}
                onPress={() => setNewSeverity(severity)}
              >
                <Text
                  style={[
                    styles.severityText,
                    newSeverity === severity && styles.selectedSeverityText,
                    { color: getSeverityColor(severity).text },
                  ]}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Duration</Text>
          <TextInput
            style={styles.input}
            placeholder="How long have you had this symptom? (e.g., 3 days)"
            placeholderTextColor="#8d8fa8"
            value={newDuration}
            onChangeText={setNewDuration}
          />

          <View style={styles.buttonContainer}>
            {editMode ? (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelEdit}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={updateSymptom}
                >
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={addSymptom}>
                <Text style={styles.buttonText}>Add Symptom</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.symptomsListContainer}>
          <Text style={styles.sectionTitle}>Recorded Symptoms</Text>

          {patient.symptoms.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No Symptoms Recorded</Text>
              <Text style={styles.emptyStateText}>
                Recording your symptoms helps track your health over time and
                can assist healthcare providers in diagnosis.
              </Text>
            </View>
          ) : (
            <FlatList
              data={patient.symptoms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.symptomCard}>
                  <View style={styles.symptomHeader}>
                    <Text style={styles.symptomDescription}>
                      {item.description}
                    </Text>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor: getSeverityColor(item.severity)
                            .backgroundColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityBadgeText,
                          { color: getSeverityColor(item.severity).text },
                        ]}
                      >
                        {item.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {item.duration && (
                    <Text style={styles.symptomDetail}>
                      Duration: {item.duration}
                    </Text>
                  )}

                  <Text style={styles.symptomDetail}>
                    Recorded: {formatDate(item.dateRecorded)}
                  </Text>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => editSymptom(item)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteSymptom(item.id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a1128",
  },
  header: {
    padding: 20,
    backgroundColor: "#0f1635",
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#b8b9cb",
  },
  formContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#1a2151",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "white",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "white",
    marginBottom: 20,
  },
  severityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  severityOption: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedSeverity: {
    borderWidth: 2,
    borderColor: "#4a80f5",
  },
  severityText: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectedSeverityText: {
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: "#4a80f5",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    flex: 1,
  },
  updateButton: {
    backgroundColor: "#4a80f5",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginRight: 10,
    flex: 1,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  symptomsListContainer: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
  },
  emptyStateCard: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#1a2151",
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  emptyStateText: {
    color: "white",
    textAlign: "center",
    lineHeight: 22,
  },
  symptomCard: {
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    backgroundColor: "#1a2151",
  },
  symptomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  symptomDescription: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 10,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  symptomDetail: {
    fontSize: 14,
    color: "white",
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 15,
  },
  editButton: {
    backgroundColor: "rgba(74, 128, 245, 0.2)",
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
    marginRight: 10,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "rgba(255, 89, 89, 0.2)",
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
    flex: 1,
  },
  editButtonText: {
    color: "#4a80f5",
    fontWeight: "bold",
  },
  deleteButtonText: {
    color: "#ff5959",
    fontWeight: "bold",
  },
  highRiskBadge: {
    backgroundColor: "rgba(255, 89, 89, 0.25)",
  },
  mediumRiskBadge: {
    backgroundColor: "rgba(255, 170, 0, 0.25)",
  },
  lowRiskBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.25)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
  },
  listContainer: {
    padding: 15,
  },
});

export default SymptomsScreen;

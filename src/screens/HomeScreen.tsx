import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { usePatient } from "../contexts/PatientContext";
import Card from "../components/Card";
import Button from "../components/Button";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { patient, loading } = usePatient();

  if (loading) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Welcome to Patient Safety App</Text>
          <Text style={styles.subtitle}>
            Keep track of your medications and health information securely.
          </Text>
          <Button
            title="Set Up Profile"
            onPress={() => navigation.navigate("Profile")}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {patient.name}</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate("Medications")}
          >
            <Text style={styles.actionTitle}>Medications</Text>
            <Text style={styles.actionCount}>{patient.medications.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate("Symptoms")}
          >
            <Text style={styles.actionTitle}>Symptoms</Text>
            <Text style={styles.actionCount}>{patient.symptoms.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate("Diagnoses")}
          >
            <Text style={styles.actionTitle}>Diagnoses</Text>
            <Text style={styles.actionCount}>{patient.diagnoses.length}</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Safety Analysis</Text>
          <Text style={styles.cardDescription}>
            Check for potential medication interactions and analyze your health
            data.
          </Text>
          <Button
            title="Run Analysis"
            onPress={() => navigation.navigate("Analysis")}
            style={styles.button}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Recent Medications</Text>
          {patient.medications.length > 0 ? (
            <>
              {patient.medications.slice(0, 3).map((medication) => (
                <View key={medication.id} style={styles.medicationItem}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <Text style={styles.medicationDosage}>
                    {medication.dosage}
                  </Text>
                </View>
              ))}
              <Button
                title="View All"
                onPress={() => navigation.navigate("Medications")}
                type="secondary"
                style={styles.viewAllButton}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No medications added yet
              </Text>
              <Button
                title="Add Medication"
                onPress={() => navigation.navigate("AddMedication")}
                type="secondary"
                style={styles.addButton}
              />
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Recent Symptoms</Text>
          {patient.symptoms.length > 0 ? (
            <>
              {patient.symptoms.slice(0, 3).map((symptom) => (
                <View key={symptom.id} style={styles.symptomItem}>
                  <Text style={styles.symptomName}>{symptom.name}</Text>
                  <Text style={styles.symptomDate}>{symptom.dateRecorded}</Text>
                </View>
              ))}
              <Button
                title="View All"
                onPress={() => navigation.navigate("Symptoms")}
                type="secondary"
                style={styles.viewAllButton}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No symptoms recorded yet
              </Text>
              <Button
                title="Record Symptom"
                onPress={() => navigation.navigate("AddSymptom")}
                type="secondary"
                style={styles.addButton}
              />
            </View>
          )}
        </Card>
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
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "white",
    paddingHorizontal: 24,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionItem: {
    flex: 1,
    backgroundColor: "#0f1635",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },
  actionTitle: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 8,
  },
  actionCount: {
    color: "#4a80f5",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "white",
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
    color: "white",
  },
  button: {
    marginTop: 8,
  },
  viewAllButton: {
    marginTop: 16,
  },
  medicationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  medicationDosage: {
    fontSize: 14,
    color: "white",
  },
  symptomItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  symptomName: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  symptomDate: {
    fontSize: 14,
    color: "white",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyStateText: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
    color: "white",
  },
  addButton: {
    minWidth: 150,
  },
});

export default HomeScreen;

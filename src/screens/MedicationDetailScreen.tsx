import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { usePatient } from "../contexts/PatientContext";
import Card from "../components/Card";
import Button from "../components/Button";
import { formatDate } from "../utils/helpers";
import { getMedicationDetails } from "../services/FdaService";

type MedicationDetailRouteProp = RouteProp<
  RootStackParamList,
  "MedicationDetail"
>;

const MedicationDetailScreen: React.FC = () => {
  const route = useRoute<MedicationDetailRouteProp>();
  const navigation = useNavigation();
  const { patient } = usePatient();
  const { medicationId } = route.params;
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const medication = patient?.medications.find((m) => m.id === medicationId);

  useEffect(() => {
    if (medication) {
      fetchMedicationDetails(medication.name);
    }
  }, [medication]);

  const fetchMedicationDetails = async (medicationName: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMedicationDetails(medicationName);
      setDetails(result);
    } catch (err) {
      console.error("Error fetching medication details:", err);
      setError("Failed to fetch medication details from FDA database.");
    } finally {
      setLoading(false);
    }
  };

  if (!medication || !patient) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Medication</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Medication not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{medication.name}</Text>
        <Text style={styles.subtitle}>Medication Details</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Dosage:</Text>
              <Text style={styles.value}>{medication.dosage}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Frequency:</Text>
              <Text style={styles.value}>{medication.frequency}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Start Date:</Text>
              <Text style={styles.value}>
                {formatDate(medication.startDate)}
              </Text>
            </View>
            {medication.endDate && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>End Date:</Text>
                <Text style={styles.value}>
                  {formatDate(medication.endDate)}
                </Text>
              </View>
            )}
            {medication.prescribedBy && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Prescribed By:</Text>
                <Text style={styles.value}>{medication.prescribedBy}</Text>
              </View>
            )}
            {medication.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notes}>{medication.notes}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>FDA Information</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#64ffda" />
              <Text style={styles.loadingText}>Fetching information...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchMedicationDetails(medication.name)}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : details ? (
            <>
              {details.warnings && (
                <View style={styles.fdaSection}>
                  <Text style={styles.fdaSectionTitle}>Warnings</Text>
                  <Text style={styles.fdaText}>
                    {details.warnings.join(" ")}
                  </Text>
                </View>
              )}
              {details.warnings_and_cautions && (
                <View style={styles.fdaSection}>
                  <Text style={styles.fdaSectionTitle}>
                    Warnings and Cautions
                  </Text>
                  <Text style={styles.fdaText}>
                    {details.warnings_and_cautions.join(" ")}
                  </Text>
                </View>
              )}
              {details.drug_interactions && (
                <View style={styles.fdaSection}>
                  <Text style={styles.fdaSectionTitle}>Drug Interactions</Text>
                  <Text style={styles.fdaText}>
                    {details.drug_interactions.join(" ")}
                  </Text>
                </View>
              )}
              {details.adverse_reactions && (
                <View style={styles.fdaSection}>
                  <Text style={styles.fdaSectionTitle}>Adverse Reactions</Text>
                  <Text style={styles.fdaText}>
                    {details.adverse_reactions.join(" ")}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>
              No FDA data available for this medication.
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate(
              "AddMedication" as never,
              { medicationId } as never
            )
          }
        >
          <Text style={styles.editButtonText}>Edit Medication</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#b8b9cb",
  },
  infoCard: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#1a2151",
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  label: {
    fontWeight: "bold",
    color: "white",
    width: 120,
    fontSize: 15,
  },
  value: {
    flex: 1,
    color: "white",
    fontSize: 15,
  },
  notesSection: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  notesLabel: {
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    fontSize: 15,
  },
  notes: {
    color: "white",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "white",
  },
  fdaSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  fdaSectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#ffffff",
  },
  fdaText: {
    fontSize: 14,
    color: "white",
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#ff7597",
    marginBottom: 16,
    fontSize: 15,
  },
  noDataText: {
    color: "white",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  retryButton: {
    backgroundColor: "rgba(100, 255, 218, 0.1)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(100, 255, 218, 0.3)",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#4a80f5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#4a80f5",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    marginBottom: 40,
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MedicationDetailScreen;

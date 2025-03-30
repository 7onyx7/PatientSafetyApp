import * as React from "react";
const { useState, useEffect } = React;
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePatient } from "../contexts/PatientContext";
import Button from "../components/Button";
import Card from "../components/Card";
import { checkMedicationInteractions } from "../services/FdaService";
import { getComprehensiveSafetyAnalysis } from "../services/MedicalSafetyService";
import { MedicationInteraction, Medication } from "../types";
import AnalysisResultsRenderer from "../components/AnalysisResultsRenderer";

// Try to import Toast, but handle gracefully if it's missing
let Toast: any;
try {
  Toast = require("react-native-toast-message").default;
} catch (e) {
  // Fallback Toast implementation using Alerts
  Toast = {
    show: ({
      type,
      text1,
      text2,
    }: {
      type: string;
      text1: string;
      text2: string;
      visibilityTime?: number;
    }) => {
      const title = text1 || "Alert";
      const message = text2 || "";
      Alert.alert(title, message);
    },
  };
}

// Add these interfaces for the medication effects
interface MedicationSymptomEffect {
  medicationName: string;
  symptomName: string;
  effect: string;
  recommendation: string;
  severity: "beneficial" | "neutral" | "concerning";
}

interface MedicationDiagnosisEffect {
  medicationName: string;
  diagnosisName: string;
  effect: string;
  recommendation: string;
  severity: "beneficial" | "neutral" | "concerning";
}

// Add new interface for medication error risks
interface MedicationErrorRisk {
  medicationName: string;
  commonErrors: string[];
  nearMisses: string[];
  preventionStrategies: string[];
  highAlertStatus: boolean;
  lookAlikeSoundAlike: string[];
  riskLevel: "low" | "medium" | "high";
}

// Add new interface for CDC healthcare-associated infection risks
interface HAIRisk {
  name: string;
  haiType: string;
  riskLevel: "low" | "medium" | "high";
  description: string;
  prevalence: string;
  mortality: string;
  mortalityRate: string;
  preventionTips: string[];
  matchedSymptoms: string[];
  matchedDiagnoses: string[];
  cdcInfo?: {
    name: string;
    description: string;
    prevalence: string;
    mortalityRate: string;
    preventionStrategies: string[];
    patientSafetyTips: string[];
    cdcResourceUrl: string;
  };
}

interface SafetyAnalysis {
  symptomSafetyData: any[];
  diagnosisSafetyData: any[];
  diagnosticErrorRisk: {
    riskLevel: "low" | "medium" | "high";
    potentialConcerns: string[];
    recommendations: string[];
  };
  medicationEffects: {
    medicationSymptomEffects: MedicationSymptomEffect[];
    medicationDiagnosisEffects: MedicationDiagnosisEffect[];
  };
  medicationErrorRisks: MedicationErrorRisk[];
  haiRisks: HAIRisk[];
  status: string;
}

const AnalysisScreen: React.FC = () => {
  const navigation = useNavigation();
  const { patient } = usePatient();
  const [interactions, setInteractions] = useState<MedicationInteraction[]>([]);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<{
    [key: string]: boolean;
  }>({});
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [infoMessage, setInfoMessage] = useState<string>("");

  useEffect(() => {
    if (patient) {
      checkInteractions();
      performSafetyAnalysis();
    }
  }, [patient]);

  const checkInteractions = async () => {
    if (!patient || patient.medications.length < 2) return;

    try {
      setLoading(true);
      setError(null);
      const medicationNames = patient.medications.map((med) => med.name);

      // Add a short delay to ensure state updates
      setTimeout(async () => {
        try {
          const results = await checkMedicationInteractions(medicationNames);
          setInteractions(results);
          setLoading(false);
        } catch (err) {
          console.error("Error checking interactions:", err);
          setError(
            "Could not check all medication interactions. Please ensure you have an internet connection and try again."
          );
          setLoading(false);
        }
      }, 300);
    } catch (err) {
      console.error("Error initiating interaction check:", err);
      setError(
        "Failed to check medication interactions. Please check your internet connection and try again."
      );
      setLoading(false);
    }
  };

  const performSafetyAnalysis = async () => {
    if (!patient || !patient.symptoms || patient.symptoms.length === 0) {
      if (Toast) {
        Toast.show({
          type: "error",
          text1: "Insufficient Data",
          text2: "Please add some symptoms to perform a safety analysis",
          visibilityTime: 3000,
        });
      } else {
        Alert.alert(
          "Insufficient Data",
          "Please add some symptoms to perform a safety analysis"
        );
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Log the data being analyzed for debugging
      console.log("Performing analysis on:", {
        symptoms: patient.symptoms,
        diagnoses: patient.diagnoses || [],
        medications: patient.medications || [],
      });

      try {
        const results = await getComprehensiveSafetyAnalysis(
          patient.symptoms,
          patient.diagnoses || [],
          patient.medications || []
        );

        // Log the results for debugging
        console.log("Analysis results:", results);

        if (results.status === "error") {
          console.error("Analysis returned with error status:", results.error);
          setError(results.error);
          setSafetyAnalysis(null);
          if (Toast) {
            Toast.show({
              type: "error",
              text1: "Analysis Error",
              text2:
                "Unable to connect to healthcare databases. Check your connection.",
              visibilityTime: 4000,
            });
          } else {
            Alert.alert(
              "Analysis Error",
              "Unable to connect to healthcare databases. Check your connection."
            );
          }
          return;
        }

        if (results.status === "partial") {
          console.warn(
            "Analysis completed with partial results:",
            results.error
          );
          if (Toast) {
            Toast.show({
              type: "warning",
              text1: "Partial Analysis",
              text2:
                "Some data couldn't be retrieved. Showing partial results.",
              visibilityTime: 4000,
            });
          } else {
            Alert.alert(
              "Partial Analysis",
              "Some data couldn't be retrieved. Showing partial results."
            );
          }
        }

        // Cast the results to match the expected type to avoid type errors
        const safeResults = {
          ...results,
          // Ensure diagnostic error risk has the expected structure
          diagnosticErrorRisk: {
            riskLevel: (results.diagnosticErrorRisk?.riskLevel || "low") as
              | "low"
              | "medium"
              | "high",
            potentialConcerns:
              results.diagnosticErrorRisk?.potentialConcerns || [],
            recommendations: results.diagnosticErrorRisk?.recommendations || [],
          },
          // Ensure all arrays exist to avoid null pointer exceptions
          symptomSafetyData: results.symptomSafetyData || [],
          diagnosisSafetyData: results.diagnosisSafetyData || [],
          medicationEffects: results.medicationEffects || {
            medicationSymptomEffects: [],
            medicationDiagnosisEffects: [],
          },
          medicationErrorRisks: results.medicationErrorRisks || [],
          haiRisks: results.haiRisks || [],
        };

        setSafetyAnalysis(safeResults);

        // Check if we have any safety concerns to highlight with proper null checks
        const hasSafetyConcerns =
          (safeResults.symptomSafetyData &&
            safeResults.symptomSafetyData.some(
              (s: any) => s && s.riskLevel && s.riskLevel !== "low"
            )) ||
          (safeResults.diagnosisSafetyData &&
            safeResults.diagnosisSafetyData.some(
              (d: any) => d && d.riskLevel && d.riskLevel !== "low"
            )) ||
          (safeResults.diagnosticErrorRisk &&
            safeResults.diagnosticErrorRisk.riskLevel !== "low") ||
          (safeResults.medicationEffects &&
            safeResults.medicationEffects.medicationSymptomEffects &&
            safeResults.medicationEffects.medicationSymptomEffects.length >
              0) ||
          (safeResults.medicationEffects &&
            safeResults.medicationEffects.medicationDiagnosisEffects &&
            safeResults.medicationEffects.medicationDiagnosisEffects.length >
              0) ||
          (safeResults.medicationErrorRisks &&
            safeResults.medicationErrorRisks.length > 0) ||
          (safeResults.haiRisks && safeResults.haiRisks.length > 0);

        if (!hasSafetyConcerns) {
          // No specific safety concerns found, but provide informative message
          if (Toast) {
            Toast.show({
              type: "success",
              text1: "No Major Safety Concerns",
              text2:
                "Continue monitoring your symptoms and consult with your healthcare provider as needed.",
              visibilityTime: 4000,
            });
          } else {
            Alert.alert(
              "No Major Safety Concerns",
              "Continue monitoring your symptoms and consult with your healthcare provider as needed."
            );
          }
        } else {
          // Safety concerns found
          if (Toast) {
            Toast.show({
              type: "info",
              text1: "Analysis Complete",
              text2: "Review the identified safety considerations below.",
              visibilityTime: 3000,
            });
          } else {
            Alert.alert(
              "Analysis Complete",
              "Review the identified safety considerations below."
            );
          }
        }
      } catch (analysisError) {
        console.error("API Error performing safety analysis:", analysisError);
        setError(
          "An unexpected error occurred when fetching analysis data. Please try again later."
        );
        setSafetyAnalysis(null);
        if (Toast) {
          Toast.show({
            type: "error",
            text1: "Analysis Error",
            text2:
              "An unexpected error occurred during analysis. Please try again later.",
            visibilityTime: 4000,
          });
        } else {
          Alert.alert(
            "Analysis Error",
            "An unexpected error occurred during analysis. Please try again later."
          );
        }
      }
    } catch (error) {
      console.error("General error performing safety analysis:", error);
      setError("An unexpected error occurred. Please try again later.");
      setSafetyAnalysis(null);
      if (Toast) {
        Toast.show({
          type: "error",
          text1: "Analysis Error",
          text2:
            "An unexpected error occurred during analysis. Please try again later.",
          visibilityTime: 4000,
        });
      } else {
        Alert.alert(
          "Analysis Error",
          "An unexpected error occurred during analysis. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTechnicalDetails = (index: number) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleSymptomDetails = (symptomName: string) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [`symptom_${symptomName}`]: !prev[`symptom_${symptomName}`],
    }));
  };

  const toggleDiagnosisDetails = (diagnosisName: string) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [`diagnosis_${diagnosisName}`]: !prev[`diagnosis_${diagnosisName}`],
    }));
  };

  if (!patient) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Safety Analysis</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Please set up your profile and add health information first
          </Text>
          <Button
            title="Go to Profile"
            onPress={() => navigation.navigate("Profile" as never)}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f5f5f5",
      }}
    >
      <View
        style={{
          padding: 16,
          backgroundColor: "#4a80f5",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#ffffff",
          }}
        >
          Safety Analysis
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#e0e0e0",
          }}
        >
          Potential health concerns and recommendations
        </Text>
      </View>

      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#4a80f5" />
          <Text
            style={{
              marginTop: 16,
              color: "#4a4a4a",
            }}
          >
            {analysisStatus || "Analyzing your health data..."}
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text
            style={{
              color: "#e74c3c",
              fontSize: 16,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {error}
          </Text>
          <Button title="Try Again" onPress={performSafetyAnalysis} />
        </View>
      ) : (
        <ScrollView
          style={{
            flex: 1,
            padding: 8,
          }}
        >
          <AnalysisResultsRenderer
            analysisResults={safetyAnalysis}
            isLoading={loading}
            error={error}
          />
        </ScrollView>
      )}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  errorText: {
    color: "white",
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#4a80f5",
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 24,
    color: "white",
    textShadowColor: "rgba(255, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "white",
    marginBottom: 16,
    fontStyle: "italic",
  },
  interactionCard: {
    marginBottom: 16,
    backgroundColor: "#112240",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  interactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  interactionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#ccd6f6",
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  minorBadge: {
    backgroundColor: "#4caf50",
  },
  moderateBadge: {
    backgroundColor: "#ff9800",
  },
  majorBadge: {
    backgroundColor: "#f44336",
  },
  severityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  simplifiedExplanation: {
    fontSize: 15,
    color: "#a8b2d1",
    marginBottom: 12,
    lineHeight: 22,
  },
  sourceText: {
    fontSize: 12,
    color: "#8892b0",
    marginBottom: 16,
    fontStyle: "italic",
  },
  sectionContainer: {
    marginBottom: 16,
  },
  bulletPoint: {
    marginRight: 8,
    fontSize: 16,
    color: "#8892b0",
    paddingVertical: 2,
  },
  bulletDot: {
    fontSize: 16,
    marginRight: 8,
    color: "#64ffda",
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: "white",
    lineHeight: 20,
  },
  toggleButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "rgba(100, 255, 218, 0.1)",
    borderRadius: 20,
    alignSelf: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(100, 255, 218, 0.3)",
  },
  toggleButtonText: {
    fontSize: 14,
    color: "#64ffda",
    fontWeight: "500",
  },
  technicalDetails: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "rgba(10, 25, 47, 0.5)",
    borderRadius: 8,
  },
  technicalText: {
    fontSize: 14,
    color: "white",
    lineHeight: 20,
  },
  noInteractionsText: {
    fontSize: 15,
    color: "white",
    fontStyle: "italic",
    padding: 12,
    lineHeight: 22,
  },
  medicationsSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  medicationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(136, 146, 176, 0.2)",
  },
  medicationName: {
    fontSize: 16,
    color: "#ccd6f6",
  },
  medicationDosage: {
    fontSize: 16,
    color: "#8892b0",
  },
  refreshButton: {
    marginTop: 24,
    backgroundColor: "#1e88e5",
  },
  disclaimer: {
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    backgroundColor: "rgba(10, 25, 47, 0.5)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(100, 255, 218, 0.2)",
  },
  disclaimerText: {
    fontSize: 12,
    color: "#8892b0",
    lineHeight: 16,
  },
  infoCard: {
    padding: 20,
    backgroundColor: "rgba(17, 34, 64, 0.8)",
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(100, 255, 218, 0.2)",
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: "white",
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: "#1e88e5",
    marginTop: 16,
    borderRadius: 30,
    paddingVertical: 12,
  },
  analysisCard: {
    padding: 20,
    backgroundColor: "rgba(17, 34, 64, 0.8)",
    borderRadius: 16,
    marginVertical: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(100, 255, 218, 0.15)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ccd6f6",
    textTransform: "capitalize",
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lowRiskBadge: {
    backgroundColor: "#4CAF50",
  },
  mediumRiskBadge: {
    backgroundColor: "#FF9800",
  },
  highRiskBadge: {
    backgroundColor: "#E91E63",
  },
  riskText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(136, 146, 176, 0.2)",
  },
  subheading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ccd6f6",
    marginBottom: 10,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: "#ff7597",
    flex: 1,
    lineHeight: 22,
  },
  recommendationText: {
    fontSize: 14,
    color: "#64ffda",
    flex: 1,
    lineHeight: 22,
  },
  followupText: {
    fontSize: 14,
    color: "#ffcb6b",
    flex: 1,
    lineHeight: 22,
  },
  diagnosticRiskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "rgba(17, 34, 64, 0.8)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(100, 255, 218, 0.2)",
  },
  diagnosticRiskTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginRight: 12,
    color: "#ccd6f6",
  },
  infoMessageContainer: {
    padding: 20,
    backgroundColor: "rgba(17, 34, 64, 0.7)",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(100, 255, 218, 0.2)",
  },
  infoMessageText: {
    fontSize: 15,
    color: "#64ffda",
    lineHeight: 22,
  },
  dataSourceText: {
    fontSize: 12,
    color: "#8892b0",
    marginTop: 12,
    fontStyle: "italic",
  },
  dataSourceInfoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(17, 34, 64, 0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(100, 255, 218, 0.2)",
  },
  dataSourceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ccd6f6",
    marginBottom: 8,
  },
  dataSourceDescription: {
    fontSize: 14,
    color: "#a8b2d1",
    marginBottom: 12,
    lineHeight: 22,
  },
  medicationEffectsCard: {
    marginTop: 16,
    backgroundColor: "rgba(17, 34, 64, 0.8)",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#7b68ee",
    padding: 20,
  },
  medicationEffectItem: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "rgba(10, 25, 47, 0.6)",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(100, 255, 218, 0.1)",
  },
  effectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  effectTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ccd6f6",
    flex: 1,
  },
  effectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  beneficialBadge: {
    backgroundColor: "#4CAF50",
  },
  neutralBadge: {
    backgroundColor: "#607D8B",
  },
  concerningBadge: {
    backgroundColor: "#E91E63",
  },
  effectBadgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 11,
  },
  effectDescription: {
    fontSize: 15,
    color: "white",
    marginBottom: 12,
    lineHeight: 22,
  },
  effectRecommendation: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
    lineHeight: 20,
  },
  medicationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ccd6f6",
    flex: 1,
  },
  highAlertBadge: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  highAlertText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  errorSection: {
    marginVertical: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ccd6f6",
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 8,
  },
  confusionText: {
    fontSize: 14,
    color: "#ff7597",
    fontStyle: "italic",
    marginLeft: 16,
    lineHeight: 20,
  },
  section: {
    marginTop: 30,
    marginBottom: 10,
  },
  effectsSection: {
    marginVertical: 12,
  },
  errorCard: {
    padding: 20,
    backgroundColor: "rgba(229, 57, 53, 0.1)",
    borderRadius: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#e53935",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e53935",
    marginBottom: 12,
  },
  haiInfoSection: {
    backgroundColor: "rgba(0, 137, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 137, 255, 0.2)",
  },
  haiDescription: {
    fontSize: 15,
    color: "#a8b2d1",
    marginBottom: 12,
    fontStyle: "italic",
    lineHeight: 22,
  },
  haiStatRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  haiStatLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ccd6f6",
    width: 100,
  },
  haiStatValue: {
    fontSize: 14,
    color: "white",
    flex: 1,
  },
  cdcLinkButton: {
    backgroundColor: "rgba(0, 102, 204, 0.8)",
    padding: 12,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 16,
  },
  cdcLinkText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  haiRiskItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
  },
  haiRiskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  haiRiskName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#ffffff",
  },
  haiStat: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  preventionHeader: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 5,
    marginBottom: 8,
  },
  preventionTip: {
    flexDirection: "row",
    marginBottom: 6,
  },
  preventionBullet: {
    fontSize: 15,
    color: "#4a80f5",
    marginRight: 8,
    marginTop: -1,
  },
  preventionText: {
    fontSize: 14,
    color: "white",
    flex: 1,
    lineHeight: 20,
  },
  cardFooter: {
    fontSize: 12,
    color: "#aaaaaa",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "right",
  },
  cardTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  cardText: {
    fontSize: 14,
    color: "white",
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "white",
    marginBottom: 10,
  },
  analysisContainer: {
    padding: 10,
  },
});

export default AnalysisScreen;

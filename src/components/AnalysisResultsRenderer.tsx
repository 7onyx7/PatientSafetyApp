import * as React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// Define the prop types
interface SafetyAnalysisProps {
  analysisResults: any;
  isLoading: boolean;
  error: string | null;
}

const AnalysisResultsRenderer: React.FC<SafetyAnalysisProps> = ({
  analysisResults,
  isLoading,
  error,
}) => {
  // Simple fallback for when there are no results
  if (!analysisResults) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No analysis results to display. Please try running the analysis again.
        </Text>
      </View>
    );
  }

  // Check if we have any data to display
  const hasData =
    analysisResults.symptomSafetyData?.length > 0 ||
    analysisResults.diagnosisSafetyData?.length > 0;

  // If no data, show a simple message
  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No safety concerns were identified in your current health data.
        </Text>
      </View>
    );
  }

  // Show a simple formatted version of the results
  return (
    <ScrollView style={styles.container}>
      {analysisResults.status === "partial" && (
        <View style={styles.warningContainer}>
          <MaterialIcons name="warning" size={20} color="#f39c12" />
          <Text style={styles.warningText}>
            Some data couldn't be retrieved. Showing partial results.
          </Text>
        </View>
      )}

      {/* Symptoms Section */}
      {analysisResults.symptomSafetyData?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptom Analysis</Text>

          {analysisResults.symptomSafetyData.map((item: any, index: number) => (
            <View key={index} style={styles.itemContainer}>
              <Text style={styles.itemTitle}>
                {item.symptomName || "Unknown"}
              </Text>
              <Text style={styles.riskText}>
                Risk Level:{" "}
                <Text style={getRiskStyle(item.riskLevel)}>
                  {item.riskLevel || "Low"}
                </Text>
              </Text>
              {item.concerns?.length > 0 && (
                <View style={styles.concernsContainer}>
                  {item.concerns.map((concern: string, i: number) => (
                    <Text key={i} style={styles.concernText}>
                      • {concern}
                    </Text>
                  ))}
                </View>
              )}
              <View style={styles.divider} />
            </View>
          ))}
        </View>
      )}

      {/* Diagnoses Section */}
      {analysisResults.diagnosisSafetyData?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis Analysis</Text>

          {analysisResults.diagnosisSafetyData.map(
            (item: any, index: number) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemTitle}>
                  {item.diagnosisName || "Unknown"}
                </Text>
                <Text style={styles.riskText}>
                  Risk Level:{" "}
                  <Text style={getRiskStyle(item.riskLevel)}>
                    {item.riskLevel || "Low"}
                  </Text>
                </Text>
                {item.managementConcerns?.length > 0 && (
                  <View style={styles.concernsContainer}>
                    <Text style={styles.subheading}>Management Concerns:</Text>
                    {item.managementConcerns.map(
                      (concern: string, i: number) => (
                        <Text key={i} style={styles.concernText}>
                          • {concern}
                        </Text>
                      )
                    )}
                  </View>
                )}
                <View style={styles.divider} />
              </View>
            )
          )}
        </View>
      )}
    </ScrollView>
  );
};

// Helper function to get risk color
const getRiskStyle = (riskLevel: string) => {
  switch (riskLevel?.toLowerCase()) {
    case "high":
      return { color: "#e74c3c", fontWeight: "bold" as const };
    case "medium":
      return { color: "#f39c12", fontWeight: "bold" as const };
    default:
      return { color: "#2ecc71", fontWeight: "bold" as const };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#7f8c8d",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff9e6",
    borderRadius: 4,
    marginBottom: 16,
  },
  warningText: {
    marginLeft: 8,
    color: "#7f8c8d",
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  riskText: {
    fontSize: 14,
    marginVertical: 4,
    color: "#34495e",
  },
  concernsContainer: {
    marginTop: 8,
    paddingLeft: 8,
  },
  subheading: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#34495e",
    marginBottom: 8,
  },
  concernText: {
    color: "#2c3e50",
    fontSize: 14,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#ecf0f1",
    marginTop: 12,
  },
});

export default AnalysisResultsRenderer;

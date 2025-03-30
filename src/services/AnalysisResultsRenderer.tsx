import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "../theme";
import { Divider, Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Interface for the safety analysis results
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
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Analyzing your health data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={40} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText}>
          Please check your connection and try again.
        </Text>
      </View>
    );
  }

  if (!analysisResults) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Tap the "Analyze" button to perform a safety analysis of your health
          data.
        </Text>
      </View>
    );
  }

  // Helper to render risk level with appropriate colors
  const renderRiskLevel = (riskLevel: string) => {
    let color;
    let icon;

    switch (riskLevel) {
      case "high":
        color = theme.colors.error;
        icon = "alert-circle";
        break;
      case "medium":
        color = theme.colors.warning;
        icon = "alert";
        break;
      case "low":
      default:
        color = theme.colors.success;
        icon = "check-circle";
        break;
    }

    return (
      <View style={styles.riskContainer}>
        <Icon name={icon} size={16} color={color} />
        <Text style={[styles.riskText, { color }]}>
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </Text>
      </View>
    );
  };

  // Check if we have any data to display
  const hasSymptomData =
    analysisResults.symptomSafetyData &&
    analysisResults.symptomSafetyData.length > 0;
  const hasDiagnosisData =
    analysisResults.diagnosisSafetyData &&
    analysisResults.diagnosisSafetyData.length > 0;
  const hasMedicationInteractions =
    analysisResults.medicationEffects &&
    (analysisResults.medicationEffects.medicationSymptomEffects.length > 0 ||
      analysisResults.medicationEffects.medicationDiagnosisEffects.length > 0);
  const hasMedicationErrorRisks =
    analysisResults.medicationErrorRisks &&
    analysisResults.medicationErrorRisks.length > 0;
  const hasHaiRisks =
    analysisResults.haiRisks && analysisResults.haiRisks.length > 0;
  const hasDiagnosticErrorRisks =
    analysisResults.diagnosticErrorRisk &&
    analysisResults.diagnosticErrorRisk.potentialConcerns.length > 0;

  // If no data at all, show a message
  const noDataAtAll =
    !hasSymptomData &&
    !hasDiagnosisData &&
    !hasMedicationInteractions &&
    !hasMedicationErrorRisks &&
    !hasHaiRisks &&
    !hasDiagnosticErrorRisks;

  if (noDataAtAll) {
    return (
      <View style={styles.noDataContainer}>
        <Icon name="information" size={40} color={theme.colors.primary} />
        <Text style={styles.noDataText}>
          No specific safety concerns were identified. This may be due to
          limited data available for analysis.
        </Text>
        <Text style={styles.noDataSubtext}>
          Continue to monitor your symptoms and consult with your healthcare
          provider as needed.
        </Text>
      </View>
    );
  }

  // Show a partial results warning if the status is "partial"
  const showPartialWarning = analysisResults.status === "partial";

  return (
    <ScrollView style={styles.container}>
      {showPartialWarning && (
        <Card style={styles.warningCard}>
          <Card.Content>
            <View style={styles.warningHeader}>
              <Icon name="alert" size={24} color={theme.colors.warning} />
              <Text style={styles.warningTitle}>Partial Results</Text>
            </View>
            <Text style={styles.warningText}>
              Some data could not be retrieved. Showing the best available
              results.
            </Text>
          </Card.Content>
        </Card>
      )}

      {hasDiagnosticErrorRisks && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="doctor" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Diagnostic Considerations</Text>
            {renderRiskLevel(analysisResults.diagnosticErrorRisk.riskLevel)}
          </View>
          <View style={styles.concernsList}>
            {analysisResults.diagnosticErrorRisk.potentialConcerns.map(
              (concern: string, i: number) => (
                <View key={i} style={styles.concernItem}>
                  <Icon
                    name="information"
                    size={16}
                    color={theme.colors.text}
                  />
                  <Text style={styles.concernText}>{concern}</Text>
                </View>
              )
            )}
          </View>

          {analysisResults.diagnosticErrorRisk.recommendations &&
            analysisResults.diagnosticErrorRisk.recommendations.length > 0 && (
              <View style={styles.recommendationsList}>
                <Text style={styles.recommendationsTitle}>
                  Recommendations:
                </Text>
                {analysisResults.diagnosticErrorRisk.recommendations.map(
                  (rec: string, i: number) => (
                    <View key={i} style={styles.recommendationItem}>
                      <Icon
                        name="check"
                        size={16}
                        color={theme.colors.success}
                      />
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  )
                )}
              </View>
            )}
        </View>
      )}

      {hasSymptomData && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon
              name="checkbox-marked-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Symptom Safety Analysis</Text>
          </View>

          {analysisResults.symptomSafetyData.map((symptom: any, i: number) => (
            <View key={i} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{symptom.symptomName}</Text>
                {renderRiskLevel(symptom.riskLevel)}
              </View>

              {symptom.concerns && symptom.concerns.length > 0 && (
                <View style={styles.concernsList}>
                  {symptom.concerns.map((concern: string, j: number) => (
                    <View key={j} style={styles.concernItem}>
                      <Icon
                        name="information"
                        size={16}
                        color={theme.colors.text}
                      />
                      <Text style={styles.concernText}>{concern}</Text>
                    </View>
                  ))}
                </View>
              )}

              {i < analysisResults.symptomSafetyData.length - 1 && (
                <Divider style={styles.divider} />
              )}
            </View>
          ))}
        </View>
      )}

      {hasDiagnosisData && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon
              name="clipboard-pulse"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Diagnosis Safety Analysis</Text>
          </View>

          {analysisResults.diagnosisSafetyData.map(
            (diagnosis: any, i: number) => (
              <View key={i} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{diagnosis.diagnosisName}</Text>
                  {renderRiskLevel(diagnosis.riskLevel)}
                </View>

                {diagnosis.managementConcerns &&
                  diagnosis.managementConcerns.length > 0 && (
                    <View style={styles.concernsList}>
                      {diagnosis.managementConcerns.map(
                        (concern: string, j: number) => (
                          <View key={j} style={styles.concernItem}>
                            <Icon
                              name="information"
                              size={16}
                              color={theme.colors.text}
                            />
                            <Text style={styles.concernText}>{concern}</Text>
                          </View>
                        )
                      )}
                    </View>
                  )}

                {i < analysisResults.diagnosisSafetyData.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            )
          )}
        </View>
      )}

      {hasMedicationInteractions && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="pill" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Medication Interactions</Text>
          </View>

          {analysisResults.medicationEffects.medicationSymptomEffects.length >
            0 && (
            <View>
              <Text style={styles.subSectionTitle}>
                Medication-Symptom Effects
              </Text>
              {analysisResults.medicationEffects.medicationSymptomEffects.map(
                (effect: any, i: number) => (
                  <View key={i} style={styles.itemContainer}>
                    <Text style={styles.interactionTitle}>
                      {effect.medicationName} → {effect.symptomName}
                    </Text>
                    <Text style={styles.interactionDescription}>
                      {effect.description}
                    </Text>
                    {i <
                      analysisResults.medicationEffects.medicationSymptomEffects
                        .length -
                        1 && <Divider style={styles.divider} />}
                  </View>
                )
              )}
            </View>
          )}

          {analysisResults.medicationEffects.medicationDiagnosisEffects.length >
            0 && (
            <View>
              <Text style={styles.subSectionTitle}>
                Medication-Diagnosis Effects
              </Text>
              {analysisResults.medicationEffects.medicationDiagnosisEffects.map(
                (effect: any, i: number) => (
                  <View key={i} style={styles.itemContainer}>
                    <Text style={styles.interactionTitle}>
                      {effect.medicationName} → {effect.diagnosisName}
                    </Text>
                    <Text style={styles.interactionDescription}>
                      {effect.description}
                    </Text>
                    {i <
                      analysisResults.medicationEffects
                        .medicationDiagnosisEffects.length -
                        1 && <Divider style={styles.divider} />}
                  </View>
                )
              )}
            </View>
          )}
        </View>
      )}

      {hasMedicationErrorRisks && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon
              name="alert-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Medication Error Risks</Text>
          </View>

          {analysisResults.medicationErrorRisks.map((risk: any, i: number) => (
            <View key={i} style={styles.itemContainer}>
              <Text style={styles.interactionTitle}>{risk.medicationName}</Text>
              <Text style={styles.interactionDescription}>
                {risk.riskDescription}
              </Text>

              {risk.recommendation && (
                <View style={styles.recommendationItem}>
                  <Icon name="check" size={16} color={theme.colors.success} />
                  <Text style={styles.recommendationText}>
                    {risk.recommendation}
                  </Text>
                </View>
              )}

              {i < analysisResults.medicationErrorRisks.length - 1 && (
                <Divider style={styles.divider} />
              )}
            </View>
          ))}
        </View>
      )}

      {hasHaiRisks && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon
              name="hospital-building"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>
              Healthcare-Associated Infection Risks
            </Text>
          </View>

          {analysisResults.haiRisks.map((risk: any, i: number) => (
            <View key={i} style={styles.itemContainer}>
              <Text style={styles.interactionTitle}>{risk.infectionType}</Text>
              <Text style={styles.interactionDescription}>
                {risk.description}
              </Text>

              {risk.preventionTips && risk.preventionTips.length > 0 && (
                <View style={styles.preventionTipsList}>
                  <Text style={styles.recommendationsTitle}>
                    Prevention Tips:
                  </Text>
                  {risk.preventionTips.map((tip: string, j: number) => (
                    <View key={j} style={styles.recommendationItem}>
                      <Icon
                        name="check"
                        size={16}
                        color={theme.colors.success}
                      />
                      <Text style={styles.recommendationText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {i < analysisResults.haiRisks.length - 1 && (
                <Divider style={styles.divider} />
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
  retryText: {
    color: theme.colors.text,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 16,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    flex: 1,
  },
  riskContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskText: {
    fontSize: 14,
    marginLeft: 4,
  },
  concernsList: {
    marginTop: 8,
  },
  concernItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  concernText: {
    color: theme.colors.text,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  recommendationsList: {
    marginTop: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  recommendationText: {
    color: theme.colors.text,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  interactionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  interactionDescription: {
    color: theme.colors.text,
    fontSize: 14,
    marginBottom: 8,
  },
  preventionTipsList: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noDataText: {
    color: theme.colors.text,
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    color: theme.colors.text,
    fontSize: 14,
    textAlign: "center",
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.warning,
    marginLeft: 8,
  },
  warningText: {
    color: theme.colors.text,
    fontSize: 14,
  },
});

export default AnalysisResultsRenderer;

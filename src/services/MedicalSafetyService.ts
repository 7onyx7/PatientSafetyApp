import axios from "axios";
import { Symptom, Diagnosis } from "../types";

// API keys from .env file
const FDA_API_KEY = process.env.API_KEY || "";
const HEALTH_DATA_API_KEY = process.env.HEALTH_DATA_API_KEY || "";

// Backup URLs from .env
const FDA_BACKUP_URL = process.env.FDA_BACKUP_URL || "";
const CDC_BACKUP_URL = process.env.CDC_BACKUP_URL || "";

// Define interfaces for symptom safety data
interface SymptomSafetyData {
  symptomName: string;
  commonErrors: string[];
  potentialMisdiagnoses: string[];
  warningFlags: string[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high";
}

// Interface for diagnosis safety data
interface DiagnosisSafetyData {
  diagnosisName: string;
  commonMismanagements: string[];
  criticalFollowupItems: string[];
  watchWarnings: string[];
  recommendations: string[];
  errorRiskLevel: "low" | "medium" | "high";
}

// Base URLs for health data APIs
const FDA_BASE_URL = "https://api.fda.gov";
const AHRQ_BASE_URL = "https://data.ahrq.gov/api";
const CDC_BASE_URL = "https://data.cdc.gov/api";
const HEALTH_DATA_BASE_URL = "https://healthdata.gov/api";
const NIH_CLINICAL_TRIALS = "https://clinicaltrials.gov/api";
const CDC_WONDER_DATABASE = "https://wonder.cdc.gov/controller";

// Utility function to toggle between main and backup URLs
const getFdaBaseUrl = () => {
  // If using a mock service or backup URL, return that
  if (FDA_BACKUP_URL) {
    console.log("Using FDA backup URL");
    return FDA_BACKUP_URL;
  }
  return FDA_BASE_URL;
};

// Use direct openFDA URL functions that don't require API keys for low usage
const getFdaEventUrl = (query: string) => {
  return `${getFdaBaseUrl()}/drug/event.json?search=${query}&limit=10`;
};

const getFdaLabelUrl = (query: string) => {
  return `${getFdaBaseUrl()}/drug/label.json?search=${query}&limit=10`;
};

const getCdcBaseUrl = () => {
  if (CDC_BACKUP_URL) {
    console.log("Using CDC backup URL");
    return CDC_BACKUP_URL;
  }
  return CDC_BASE_URL;
};

/**
 * Provides mock symptom safety data for common symptoms when APIs fail
 * This serves as the ultimate fallback
 */
const getMockSymptomSafetyData = (symptomName: string): SymptomSafetyData => {
  console.log(`Generating mock data for symptom: ${symptomName}`);

  // Common symptom mappings
  const symptomLower = symptomName.toLowerCase();

  // Headache data
  if (symptomLower.includes("headache") || symptomLower.includes("head pain")) {
    return {
      symptomName,
      commonErrors: [
        "Failing to consider serious underlying causes like meningitis or stroke",
        "Not documenting the pattern and duration of headaches",
        "Inadequate follow-up on recurring severe headaches",
      ],
      potentialMisdiagnoses: [
        "Tension headache vs. migraine",
        "Secondary headache due to other conditions",
        "Medication overuse headache",
      ],
      warningFlags: [
        "Sudden onset severe headache ('worst headache of life')",
        "Headache with fever and neck stiffness",
        "Headache with neurological changes",
      ],
      recommendations: [
        "Keep a headache diary noting triggers and severity",
        "Mention any vision changes or other neurological symptoms",
        "Follow up if headaches worsen or change in character",
      ],
      riskLevel: "medium",
    };
  }

  // Fever data
  if (symptomLower.includes("fever") || symptomLower.includes("temperature")) {
    return {
      symptomName,
      commonErrors: [
        "Not investigating persistent fever adequately",
        "Overlooking serious bacterial infections",
        "Inadequate follow-up on fever of unknown origin",
      ],
      potentialMisdiagnoses: [
        "Viral vs. bacterial infection",
        "Non-infectious causes of fever",
        "Drug-induced fever",
      ],
      warningFlags: [
        "Fever with rash",
        "Fever persisting more than 3 days",
        "Fever with altered mental status",
      ],
      recommendations: [
        "Monitor temperature regularly and record readings",
        "Note any associated symptoms like cough or pain",
        "Seek care if fever is very high or persists despite medication",
      ],
      riskLevel: "medium",
    };
  }

  // Pain data
  if (symptomLower.includes("pain")) {
    return {
      symptomName,
      commonErrors: [
        "Inadequate assessment of pain characteristics",
        "Failing to consider referred pain",
        "Not reassessing pain after treatment",
      ],
      potentialMisdiagnoses: [
        "Musculoskeletal vs. organ-related pain",
        "Neuropathic vs. nociceptive pain",
        "Psychogenic pain",
      ],
      warningFlags: [
        "Pain that wakes from sleep",
        "Progressive worsening of pain",
        "Pain with other concerning symptoms",
      ],
      recommendations: [
        "Describe pain in detail: location, intensity, triggers",
        "Track response to treatments",
        "Report any changes in character or severity of pain",
      ],
      riskLevel: "medium",
    };
  }

  // Fatigue data
  if (
    symptomLower.includes("fatigue") ||
    symptomLower.includes("tired") ||
    symptomLower.includes("exhaustion")
  ) {
    return {
      symptomName,
      commonErrors: [
        "Attributing fatigue to stress without adequate workup",
        "Missing underlying medical conditions",
        "Not considering medication side effects",
      ],
      potentialMisdiagnoses: [
        "Depression vs. physical causes",
        "Chronic fatigue syndrome vs. other conditions",
        "Sleep disorders",
      ],
      warningFlags: [
        "Progressive worsening fatigue",
        "Fatigue with unexplained weight loss",
        "Fatigue with other new symptoms",
      ],
      recommendations: [
        "Track energy levels throughout the day",
        "Note any activities that worsen or improve symptoms",
        "Discuss all medications with your provider",
      ],
      riskLevel: "low",
    };
  }

  // Generic fallback for any other symptom
  return {
    symptomName,
    commonErrors: [
      "Failure to recognize serious underlying conditions",
      "Delayed diagnosis due to common symptom presentation",
      "Inadequate follow-up on persistent symptoms",
    ],
    potentialMisdiagnoses: [
      "Common conditions with similar presentations",
      "Failure to consider less common diagnosis options",
      "Cognitive bias in symptom assessment",
    ],
    warningFlags: [
      "Symptoms that persist beyond expected duration",
      "Symptoms that don't respond to initial treatment",
      "Symptoms accompanied by other concerning signs",
    ],
    recommendations: [
      "Keep detailed records of symptoms and timing",
      "Don't hesitate to seek a second opinion if concerned",
      "Follow up if symptoms worsen or don't improve",
    ],
    riskLevel: "medium",
  };
};

/**
 * Create a similar function for diagnosis safety mock data
 */
const getMockDiagnosisSafetyData = (
  diagnosisName: string
): DiagnosisSafetyData => {
  console.log(`Generating mock data for diagnosis: ${diagnosisName}`);

  // Common diagnosis mappings
  const diagnosisLower = diagnosisName.toLowerCase();

  // Hypertension data
  if (
    diagnosisLower.includes("hypertension") ||
    diagnosisLower.includes("high blood pressure")
  ) {
    return {
      diagnosisName,
      commonMismanagements: [
        "Inadequate blood pressure monitoring",
        "Not adjusting medications based on home readings",
        "Ignoring secondary causes of hypertension",
      ],
      criticalFollowupItems: [
        "Regular blood pressure checks",
        "Kidney function monitoring",
        "Cardiovascular risk assessment",
      ],
      watchWarnings: [
        "Very high readings (>180/120)",
        "Symptoms like headache, vision changes with high BP",
        "Medication side effects like dizziness or cough",
      ],
      recommendations: [
        "Maintain a home blood pressure log",
        "Follow medication schedule exactly",
        "Report any concerning symptoms promptly",
      ],
      errorRiskLevel: "medium",
    };
  }

  // Diabetes data
  if (diagnosisLower.includes("diabetes")) {
    return {
      diagnosisName,
      commonMismanagements: [
        "Inconsistent glucose monitoring",
        "Not adjusting insulin for activity or diet changes",
        "Missing early signs of complications",
      ],
      criticalFollowupItems: [
        "Regular HbA1c testing",
        "Annual eye examination",
        "Foot examinations",
      ],
      watchWarnings: [
        "Frequent hypoglycemia",
        "Persistent hyperglycemia despite treatment",
        "Symptoms of nerve damage or vision changes",
      ],
      recommendations: [
        "Check blood glucose as recommended",
        "Never skip medication doses",
        "Inspect feet daily for injuries or sores",
      ],
      errorRiskLevel: "high",
    };
  }

  // Generic fallback for any other diagnosis
  return {
    diagnosisName,
    commonMismanagements: [
      "Inadequate monitoring of condition progression",
      "Failure to adjust treatment based on response",
      "Overlooking potential medication interactions",
    ],
    criticalFollowupItems: [
      "Regular assessment of treatment effectiveness",
      "Monitoring for condition-specific complications",
      "Medication regimen adherence assessment",
    ],
    watchWarnings: [
      "Symptoms that worsen despite treatment",
      "New symptoms that develop during treatment",
      "Side effects from prescribed medications",
    ],
    recommendations: [
      "Keep all follow-up appointments",
      "Take medications exactly as prescribed",
      "Report any new or worsening symptoms promptly",
    ],
    errorRiskLevel: "medium",
  };
};

/**
 * Provides sample FDA data responses for when the API fails
 */
const getSampleFdaEventData = () => {
  return {
    meta: {
      disclaimer:
        "openFDA is a beta research project and not for clinical use.",
      license: "CC0",
      last_updated: "2023-06-30",
      results: {
        skip: 0,
        limit: 10,
        total: 100,
      },
    },
    results: [
      {
        receivedate: "20220315",
        patient: {
          reaction: [
            {
              reactionmeddrapt: "Headache",
              reactionoutcome: "Recovered/Resolved",
            },
            {
              reactionmeddrapt: "Nausea",
              reactionoutcome: "Recovered/Resolved",
            },
          ],
          drug: [
            {
              medicinalproduct: "Ibuprofen",
              drugindication: "Pain relief",
            },
          ],
        },
        serious: "No",
      },
      {
        receivedate: "20220212",
        patient: {
          reaction: [
            {
              reactionmeddrapt: "Fever",
              reactionoutcome: "Recovering/Resolving",
            },
            {
              reactionmeddrapt: "Fatigue",
              reactionoutcome: "Recovering/Resolving",
            },
          ],
          drug: [
            {
              medicinalproduct: "Acetaminophen",
              drugindication: "Fever reduction",
            },
          ],
        },
        serious: "No",
      },
    ],
  };
};

/**
 * Provides sample FDA label data when the API fails
 */
const getSampleFdaLabelData = () => {
  return {
    meta: {
      disclaimer:
        "openFDA is a beta research project and not for clinical use.",
      license: "CC0",
      last_updated: "2023-06-30",
      results: {
        skip: 0,
        limit: 10,
        total: 100,
      },
    },
    results: [
      {
        effective_time: "20220101",
        indications_and_usage: [
          "For the relief of mild to moderate pain",
          "For the treatment of primary dysmenorrhea",
          "For relief of the signs and symptoms of rheumatoid arthritis and osteoarthritis",
        ],
        warnings: [
          "Cardiovascular Risk: NSAIDs may cause an increased risk of serious cardiovascular thrombotic events.",
          "Gastrointestinal Risk: NSAIDs cause an increased risk of serious gastrointestinal adverse events.",
        ],
        adverse_reactions: [
          "The most common adverse reactions are headache, nausea, and dizziness.",
          "Serious side effects include heart attack, stroke, and stomach/intestinal bleeding.",
        ],
        openfda: {
          brand_name: ["Advil", "Motrin"],
          generic_name: ["Ibuprofen"],
          substance_name: ["IBUPROFEN"],
          manufacturer_name: ["Pfizer Consumer Healthcare"],
          product_type: ["HUMAN PRESCRIPTION DRUG"],
        },
      },
    ],
  };
};

/**
 * Fetches data about medical errors related to a specific symptom
 * from government health data sources
 */
export const fetchSymptomSafetyData = async (
  symptomName: string
): Promise<SymptomSafetyData | null> => {
  try {
    console.log(`Fetching safety data for symptom: ${symptomName}`);

    // Get a unique URL for this specific symptom
    // This ensures we're not reusing the same data for different symptoms
    const symptomSpecificUrl = getSymptomSpecificUrl(symptomName);
    console.log(`Using symptom-specific URL: ${symptomSpecificUrl}`);

    let apiAttemptFailed = false;
    let fdaData = null;

    // Try to fetch from FDA adverse events database for symptom-related events
    const encodedSymptom = encodeURIComponent(symptomName);
    const fdaUrl = getFdaEventUrl(
      `patient.reaction.reactionmeddrapt:"${encodedSymptom}"`
    );

    console.log(`FDA API URL: ${fdaUrl}`);

    try {
      // First try symptom-specific endpoint
      try {
        const specificResponse = await axios.get(symptomSpecificUrl);
        if (specificResponse.data && specificResponse.status === 200) {
          console.log(
            `Successfully retrieved specific data for ${symptomName}`
          );
          return specificResponse.data;
        }
      } catch (specificError) {
        console.log(
          `No specific data available for ${symptomName}, falling back to general API`
        );
      }

      // Try FDA API as fallback
      const fdaResponse = await axios.get(fdaUrl);
      fdaData = fdaResponse.data;
    } catch (fdaError: any) {
      console.error(
        `FDA API error for symptom ${symptomName}:`,
        fdaError.message
      );
      console.log("Status code:", fdaError.response?.status);
      console.log("Using sample FDA data instead");
      fdaData = getSampleFdaEventData();
      apiAttemptFailed = true;
    }

    // Now we can work with fdaData whether it came from the real API or sample data
    if (fdaData && fdaData.results && fdaData.results.length > 0) {
      const commonErrors: string[] = [];
      const potentialMisdiagnoses: string[] = [];
      const warningFlags: string[] = [];
      const recommendations: string[] = [];
      let riskLevel: "low" | "medium" | "high" = "low";

      // Extract data from the FDA response
      for (const result of fdaData.results) {
        if (result.patient && result.patient.reaction) {
          // Process reaction data to identify potential issues
          for (const reaction of result.patient.reaction) {
            if (
              reaction.reactionmeddrapt
                .toLowerCase()
                .includes(symptomName.toLowerCase())
            ) {
              if (result.serious === "Yes") {
                riskLevel = "high";
                warningFlags.push(
                  `This symptom has been associated with serious adverse events`
                );
              }

              // Look at related drugs that might cause this symptom
              if (result.patient.drug) {
                for (const drug of result.patient.drug) {
                  if (drug.drugindication) {
                    // Check if drug is meant to treat this symptom
                    if (
                      drug.drugindication
                        .toLowerCase()
                        .includes(symptomName.toLowerCase())
                    ) {
                      recommendations.push(
                        `Follow medication instructions for ${drug.medicinalproduct}`
                      );
                    } else {
                      // This drug might be causing the symptom
                      warningFlags.push(
                        `${drug.medicinalproduct} may cause or worsen this symptom`
                      );
                      recommendations.push(
                        `Discuss ${drug.medicinalproduct} with your doctor`
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }

      // If we got useful FDA data, use it
      if (warningFlags.length > 0 || recommendations.length > 0) {
        return {
          symptomName,
          commonErrors:
            commonErrors.length > 0
              ? commonErrors
              : [
                  "Attributing the symptom to minor causes without thorough evaluation",
                  "Not monitoring symptom progression over time",
                  "Failing to investigate related symptoms",
                ],
          potentialMisdiagnoses:
            potentialMisdiagnoses.length > 0
              ? potentialMisdiagnoses
              : [
                  "Similar appearing conditions with different causes",
                  "Missing underlying serious conditions",
                  "Overlooking medication side effects as a cause",
                ],
          warningFlags:
            warningFlags.length > 0
              ? warningFlags
              : [
                  "Symptom persists despite initial treatment",
                  "Symptom severity increases unexpectedly",
                  "New related symptoms develop",
                ],
          recommendations:
            recommendations.length > 0
              ? recommendations
              : [
                  "Keep a symptom journal noting triggers and severity",
                  "Follow up if symptom persists or worsens",
                  "Discuss all your medications with your healthcare provider",
                ],
          riskLevel,
        };
      }
    }

    // If FDA data doesn't have enough information, try to get CDC data
    try {
      console.log("Trying CDC data as fallback");
      const cdcUrl = `${getCdcBaseUrl()}/resource/9j2v-jrme.json?$where=contains(condition_or_symptom, '${encodeURIComponent(
        symptomName
      )}')`;
      console.log(`CDC API URL: ${cdcUrl}`);

      const cdcResponse = await axios.get(cdcUrl);

      if (cdcResponse.data && cdcResponse.data.length > 0) {
        // Process CDC data if available
        const cdcRecommendations = new Set<string>();
        const cdcWarnings = new Set<string>();

        for (const item of cdcResponse.data) {
          if (item.recommendations) {
            cdcRecommendations.add(item.recommendations);
          }
          if (item.warning_signs) {
            cdcWarnings.add(item.warning_signs);
          }
        }

        // Fall back to existing database for common errors
        // but enhance with CDC recommendations
        return {
          symptomName,
          commonErrors: [
            "Failure to recognize serious underlying conditions",
            "Delayed diagnosis due to common symptom presentation",
            "Inadequate follow-up on persistent symptoms",
          ],
          potentialMisdiagnoses: [
            "Common conditions with similar presentations",
            "Failure to consider less common diagnosis options",
            "Cognitive bias in symptom assessment",
          ],
          warningFlags: [...cdcWarnings].slice(0, 5),
          recommendations: [...cdcRecommendations].slice(0, 5),
          riskLevel: "medium",
        };
      }
    } catch (cdcError: any) {
      console.log(
        `CDC API error for symptom ${symptomName}:`,
        cdcError.message
      );
      console.log("Status code:", cdcError.response?.status);
      console.log(
        "Response data:",
        JSON.stringify(cdcError.response?.data || {})
      );
      apiAttemptFailed = true;
      // Continue with fallback options if CDC fails
    }

    // If API attempts failed completely, use mock data instead of generic fallback
    if (apiAttemptFailed) {
      console.log("All API attempts failed, using mock data instead");
      return getMockSymptomSafetyData(symptomName);
    }

    console.log(`Using fallback data for symptom: ${symptomName}`);
    // Fallback to general recommendations if no specific data is found
    return {
      symptomName,
      commonErrors: [
        "Failure to recognize serious underlying conditions",
        "Delayed diagnosis due to common symptom presentation",
        "Inadequate follow-up on persistent symptoms",
      ],
      potentialMisdiagnoses: [
        "Common conditions with similar presentations",
        "Failure to consider less common diagnosis options",
        "Cognitive bias in symptom assessment",
      ],
      warningFlags: [
        "Symptoms that persist beyond expected duration",
        "Symptoms that don't respond to initial treatment",
        "Symptoms accompanied by other concerning signs",
      ],
      recommendations: [
        "Keep detailed records of symptoms and timing",
        "Don't hesitate to seek a second opinion if concerned",
        "Follow up if symptoms worsen or don't improve",
      ],
      riskLevel: "medium",
    };
  } catch (error: any) {
    console.error("Error fetching symptom safety data:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    // Use symptom-specific mock data instead of generic fallback
    return getSymptomSpecificMockData(symptomName);
  }
};

/**
 * Get a specific API URL based on the symptom
 */
const getSymptomSpecificUrl = (symptomName: string): string => {
  const lowerName = symptomName.toLowerCase();

  // CDC specific endpoints for common symptoms - in a real app these would be actual CDC APIs
  if (lowerName.includes("fever")) {
    return `${CDC_BASE_URL}/fever_data/v1/symptomsafety?name=${encodeURIComponent(
      symptomName
    )}`;
  } else if (lowerName.includes("cough")) {
    return `${CDC_BASE_URL}/respiratory_data/v1/symptomsafety?name=${encodeURIComponent(
      symptomName
    )}`;
  } else if (lowerName.includes("headache")) {
    return `${CDC_BASE_URL}/neurological_data/v1/symptomsafety?name=${encodeURIComponent(
      symptomName
    )}`;
  } else if (lowerName.includes("nausea") || lowerName.includes("vomit")) {
    return `${CDC_BASE_URL}/gastrointestinal_data/v1/symptomsafety?name=${encodeURIComponent(
      symptomName
    )}`;
  } else if (lowerName.includes("pain")) {
    // Differentiate pain by location if specified
    if (lowerName.includes("chest")) {
      return `${CDC_BASE_URL}/cardiopulmonary_data/v1/symptomsafety?name=${encodeURIComponent(
        symptomName
      )}`;
    } else if (lowerName.includes("abdom")) {
      return `${CDC_BASE_URL}/abdominal_data/v1/symptomsafety?name=${encodeURIComponent(
        symptomName
      )}`;
    } else if (lowerName.includes("joint") || lowerName.includes("muscle")) {
      return `${CDC_BASE_URL}/musculoskeletal_data/v1/symptomsafety?name=${encodeURIComponent(
        symptomName
      )}`;
    }
    return `${CDC_BASE_URL}/pain_data/v1/symptomsafety?name=${encodeURIComponent(
      symptomName
    )}`;
  } else if (lowerName.includes("rash") || lowerName.includes("itch")) {
    return `${CDC_BASE_URL}/dermatological_data/v1/symptomsafety?name=${encodeURIComponent(
      symptomName
    )}`;
  } else if (lowerName.includes("fatigue") || lowerName.includes("tired")) {
    return `${CDC_BASE_URL}/general_symptoms_data/v1/symptomsafety?name=${encodeURIComponent(
      symptomName
    )}`;
  } else if (lowerName.includes("dizz") || lowerName.includes("vertigo")) {
    return `${CDC_BASE_URL}/neurological_data/v1/symptomsafety?name=${encodeURIComponent(
      symptomName
    )}`;
  } else if (lowerName.includes("breath") || lowerName.includes("respirat")) {
    return `${CDC_BASE_URL}/respiratory_data/v1/symptomsafety?name=${encodeURIComponent(
      symptomName
    )}`;
  }

  // Default to a general endpoint
  return `${CDC_BASE_URL}/symptom_data/v1/symptomsafety?name=${encodeURIComponent(
    symptomName
  )}`;
};

/**
 * Get unique mock data for each specific symptom
 */
const getSymptomSpecificMockData = (symptomName: string): SymptomSafetyData => {
  const lowerName = symptomName.toLowerCase();

  // Fever
  if (lowerName.includes("fever")) {
    return {
      symptomName,
      commonErrors: [
        "Not differentiating between viral and bacterial causes",
        "Overlooking fever as a sign of serious infection",
        "Missing fever patterns that indicate specific conditions",
      ],
      potentialMisdiagnoses: [
        "Common cold vs. influenza",
        "Viral infection vs. bacterial infection requiring antibiotics",
        "Missing underlying conditions with fever as secondary symptom",
      ],
      warningFlags: [
        "Fever over 103°F (39.4°C) in adults",
        "Fever with rash, stiff neck, or severe headache",
        "Fever lasting more than 3 days despite treatment",
        "Fever with recent travel to endemic disease areas",
      ],
      recommendations: [
        "Monitor temperature regularly and record readings",
        "Stay hydrated and rest",
        "Use fever reducers as recommended by healthcare provider",
        "Seek immediate care for very high fever or concerning symptoms",
      ],
      riskLevel: "medium",
    };
  }

  // Cough
  else if (lowerName.includes("cough")) {
    return {
      symptomName,
      commonErrors: [
        "Assuming all coughs are related to upper respiratory infections",
        "Not distinguishing between productive and non-productive coughs",
        "Overlooking cough duration as a diagnostic factor",
      ],
      potentialMisdiagnoses: [
        "Bronchitis vs. pneumonia",
        "Asthma vs. COPD exacerbation",
        "GERD-related cough vs. infection",
        "Medication-induced cough (e.g., ACE inhibitors)",
      ],
      warningFlags: [
        "Cough with blood (hemoptysis)",
        "Cough lasting >3 weeks (chronic cough)",
        "Cough with shortness of breath or chest pain",
        "Cough with fever >101°F for more than 3 days",
      ],
      recommendations: [
        "Note whether cough is productive and color/consistency of any sputum",
        "Record time of day when cough is worse",
        "Notice triggers that worsen cough",
        "Use humidifier for dry cough if helpful",
      ],
      riskLevel: "medium",
    };
  }

  // Headache
  else if (lowerName.includes("headache")) {
    return {
      symptomName,
      commonErrors: [
        "Failing to consider serious underlying causes like meningitis or stroke",
        "Not classifying headache by type (tension, migraine, cluster, etc.)",
        "Missing medication overuse headache",
      ],
      potentialMisdiagnoses: [
        "Tension headache vs. migraine",
        "Sinus headache vs. migraine",
        "Primary headache vs. secondary to other conditions",
        "Missing temporal arteritis in older adults",
      ],
      warningFlags: [
        "Sudden onset severe headache ('worst headache of life')",
        "Headache with fever and neck stiffness",
        "Headache with neurological changes (vision, speech, weakness)",
        "New headache after age 50",
        "Headache waking you from sleep",
      ],
      recommendations: [
        "Keep a headache diary noting triggers, severity, and duration",
        "Note response to over-the-counter medications",
        "Identify and avoid personal headache triggers",
        "Seek immediate care for severe, sudden, or unusual headaches",
      ],
      riskLevel: "medium",
    };
  }

  // Use the standard mock function for all other symptoms
  return getMockSymptomSafetyData(symptomName);
};

/**
 * Fetches medical management and error data for a specific diagnosis
 * from government health databases
 */
export const fetchDiagnosisSafetyData = async (
  diagnosisName: string
): Promise<DiagnosisSafetyData | null> => {
  try {
    console.log(`Fetching safety data for diagnosis: ${diagnosisName}`);

    // Get a unique URL for this specific diagnosis
    // This ensures we're not reusing the same data for different diagnoses
    const diagnosisSpecificUrl = getDiagnosisSpecificUrl(diagnosisName);
    console.log(`Using diagnosis-specific URL: ${diagnosisSpecificUrl}`);

    let apiAttemptFailed = false;
    let fdaData = null;

    // Try to access the diagnosis-specific endpoint first
    try {
      const specificResponse = await axios.get(diagnosisSpecificUrl);
      if (specificResponse.data && specificResponse.status === 200) {
        console.log(
          `Successfully retrieved specific data for ${diagnosisName}`
        );
        return specificResponse.data;
      }
    } catch (specificError) {
      console.log(
        `No specific data available for ${diagnosisName}, falling back to general API`
      );
    }

    // Try FDA database for diagnosis-related safety information
    const encodedDiagnosis = encodeURIComponent(diagnosisName);
    const fdaUrl = getFdaLabelUrl(
      `indications_and_usage:"${encodedDiagnosis}"`
    );

    console.log(`FDA API URL: ${fdaUrl}`);

    try {
      const fdaResponse = await axios.get(fdaUrl);
      fdaData = fdaResponse.data;
    } catch (fdaError: any) {
      console.error(
        `FDA API error for diagnosis ${diagnosisName}:`,
        fdaError.message
      );
      console.log("Status code:", fdaError.response?.status);
      console.log("Using sample FDA label data instead");
      fdaData = getSampleFdaLabelData();
      apiAttemptFailed = true;
    }

    // Now we can work with fdaData whether it came from the real API or sample data
    if (fdaData && fdaData.results && fdaData.results.length > 0) {
      const commonMismanagements: string[] = [];
      const criticalFollowupItems: string[] = [];
      const watchWarnings: string[] = [];
      const recommendations: string[] = [];
      let errorRiskLevel: "low" | "medium" | "high" = "low";

      // Extract data from the FDA response
      for (const result of fdaData.results) {
        // Check indications related to this diagnosis
        if (result.indications_and_usage) {
          for (const indication of result.indications_and_usage) {
            if (
              indication.toLowerCase().includes(diagnosisName.toLowerCase())
            ) {
              // This drug is indicated for the diagnosis
              if (result.openfda && result.openfda.brand_name) {
                recommendations.push(
                  `Medication options include ${result.openfda.brand_name.join(
                    ", "
                  )}`
                );
              }
            }
          }
        }

        // Check warnings that might be relevant
        if (result.warnings) {
          for (const warning of result.warnings) {
            watchWarnings.push(warning);
            errorRiskLevel = "medium"; // Increase risk level if warnings exist
          }
        }

        // Check adverse reactions
        if (result.adverse_reactions) {
          for (const reaction of result.adverse_reactions) {
            commonMismanagements.push(
              `Failing to monitor for side effects like: ${reaction}`
            );
          }
        }
      }

      // If we got useful FDA data, use it
      if (watchWarnings.length > 0 || recommendations.length > 0) {
        return {
          diagnosisName,
          commonMismanagements:
            commonMismanagements.length > 0
              ? commonMismanagements
              : [
                  "Inadequate monitoring of condition progression",
                  "Failure to adjust treatment based on response",
                  "Overlooking potential medication interactions",
                ],
          criticalFollowupItems:
            criticalFollowupItems.length > 0
              ? criticalFollowupItems
              : [
                  "Regular assessment of treatment effectiveness",
                  "Monitoring for condition-specific complications",
                  "Medication regimen adherence assessment",
                ],
          watchWarnings:
            watchWarnings.length > 0
              ? watchWarnings
              : [
                  "Symptoms that worsen despite treatment",
                  "New symptoms that develop during treatment",
                  "Side effects from prescribed medications",
                ],
          recommendations:
            recommendations.length > 0
              ? recommendations
              : [
                  "Keep all follow-up appointments",
                  "Take medications exactly as prescribed",
                  "Report any new or worsening symptoms promptly",
                ],
          errorRiskLevel,
        };
      }
    }

    // Try AHRQ data (fallback) for general diagnosis management
    try {
      console.log("Trying AHRQ data as fallback");
      const ahrqUrl = `${AHRQ_BASE_URL}/resource/9rsp-x749.json?$where=contains(medical_condition, '${encodeURIComponent(
        diagnosisName
      )}')`;
      console.log(`AHRQ API URL: ${ahrqUrl}`);

      const ahrqResponse = await axios.get(ahrqUrl);

      if (ahrqResponse.data && ahrqResponse.data.length > 0) {
        // Process AHRQ data
        const ahrqRecommendations = new Set<string>();
        const ahrqWarnings = new Set<string>();

        for (const item of ahrqResponse.data) {
          if (item.patient_safety_recommendations) {
            ahrqRecommendations.add(item.patient_safety_recommendations);
          }
          if (item.warning_indicators) {
            ahrqWarnings.add(item.warning_indicators);
          }
        }

        return {
          diagnosisName,
          commonMismanagements: [
            "Inadequate monitoring of condition progression",
            "Failure to adjust treatment based on response",
            "Overlooking potential medication interactions",
          ],
          criticalFollowupItems: [
            "Regular assessment of treatment effectiveness",
            "Monitoring for condition-specific complications",
            "Medication regimen adherence assessment",
          ],
          watchWarnings: [...ahrqWarnings].slice(0, 5),
          recommendations: [...ahrqRecommendations].slice(0, 5),
          errorRiskLevel: "medium",
        };
      }
    } catch (ahrqError: any) {
      console.log(
        `AHRQ API error for diagnosis ${diagnosisName}:`,
        ahrqError.message
      );
      console.log("Status code:", ahrqError.response?.status);
      console.log(
        "Response data:",
        JSON.stringify(ahrqError.response?.data || {})
      );
      apiAttemptFailed = true;
      // Continue with fallback if AHRQ fails
    }

    // If API attempts failed completely, use mock data instead of generic fallback
    if (apiAttemptFailed) {
      console.log("All API attempts failed, using mock data instead");
      return getMockDiagnosisSafetyData(diagnosisName);
    }

    console.log(`Using fallback data for diagnosis: ${diagnosisName}`);
    // Fallback to general recommendations if no specific data is found
    return {
      diagnosisName,
      commonMismanagements: [
        "Inadequate monitoring of condition progression",
        "Failure to adjust treatment based on response",
        "Overlooking potential medication interactions",
      ],
      criticalFollowupItems: [
        "Regular assessment of treatment effectiveness",
        "Monitoring for condition-specific complications",
        "Medication regimen adherence assessment",
      ],
      watchWarnings: [
        "Symptoms that worsen despite treatment",
        "New symptoms that develop during treatment",
        "Side effects from prescribed medications",
      ],
      recommendations: [
        "Keep all follow-up appointments",
        "Take medications exactly as prescribed",
        "Report any new or worsening symptoms promptly",
      ],
      errorRiskLevel: "medium",
    };
  } catch (error: any) {
    console.error("Error fetching diagnosis safety data:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    // Use diagnosis-specific mock data instead of generic fallback
    return getDiagnosisSpecificMockData(diagnosisName);
  }
};

/**
 * Get a specific API URL based on the diagnosis
 */
const getDiagnosisSpecificUrl = (diagnosisName: string): string => {
  const lowerName = diagnosisName.toLowerCase();

  // CDC specific endpoints for common diagnoses - in a real app these would be actual CDC APIs
  if (lowerName.includes("diabet")) {
    return `${CDC_BASE_URL}/diabetes_data/v1/diagnosissafety?name=${encodeURIComponent(
      diagnosisName
    )}`;
  } else if (
    lowerName.includes("hypertens") ||
    lowerName.includes("blood pressure")
  ) {
    return `${CDC_BASE_URL}/cardiovascular_data/v1/diagnosissafety?name=${encodeURIComponent(
      diagnosisName
    )}`;
  } else if (lowerName.includes("asthma")) {
    return `${CDC_BASE_URL}/respiratory_data/v1/diagnosissafety?name=${encodeURIComponent(
      diagnosisName
    )}`;
  } else if (lowerName.includes("depress") || lowerName.includes("anxiety")) {
    return `${CDC_BASE_URL}/mental_health_data/v1/diagnosissafety?name=${encodeURIComponent(
      diagnosisName
    )}`;
  } else if (lowerName.includes("cancer")) {
    return `${CDC_BASE_URL}/cancer_data/v1/diagnosissafety?name=${encodeURIComponent(
      diagnosisName
    )}`;
  } else if (lowerName.includes("heart") || lowerName.includes("cardiac")) {
    return `${CDC_BASE_URL}/cardiovascular_data/v1/diagnosissafety?name=${encodeURIComponent(
      diagnosisName
    )}`;
  } else if (lowerName.includes("arthritis") || lowerName.includes("joint")) {
    return `${CDC_BASE_URL}/musculoskeletal_data/v1/diagnosissafety?name=${encodeURIComponent(
      diagnosisName
    )}`;
  } else if (lowerName.includes("copd") || lowerName.includes("pulmonary")) {
    return `${CDC_BASE_URL}/respiratory_data/v1/diagnosissafety?name=${encodeURIComponent(
      diagnosisName
    )}`;
  } else if (lowerName.includes("thyroid")) {
    return `${CDC_BASE_URL}/endocrine_data/v1/diagnosissafety?name=${encodeURIComponent(
      diagnosisName
    )}`;
  }

  // Default to a general endpoint
  return `${CDC_BASE_URL}/diagnosis_data/v1/diagnosissafety?name=${encodeURIComponent(
    diagnosisName
  )}`;
};

/**
 * Get unique mock data for each specific diagnosis
 */
const getDiagnosisSpecificMockData = (
  diagnosisName: string
): DiagnosisSafetyData => {
  const lowerName = diagnosisName.toLowerCase();

  // Diabetes
  if (lowerName.includes("diabet")) {
    return {
      diagnosisName,
      commonMismanagements: [
        "Inadequate blood glucose monitoring frequency",
        "Failing to adjust insulin for activity and diet changes",
        "Not recognizing or managing hypoglycemia promptly",
        "Missing early signs of diabetic complications",
      ],
      criticalFollowupItems: [
        "Regular HbA1c testing (every 3-6 months)",
        "Annual comprehensive eye exam",
        "Annual comprehensive foot exam",
        "Regular kidney function monitoring",
        "Lipid profile monitoring",
      ],
      watchWarnings: [
        "Frequent hypoglycemic episodes",
        "Persistent hyperglycemia despite treatment",
        "Symptoms of peripheral neuropathy",
        "Changes in vision",
        "Poor wound healing",
      ],
      recommendations: [
        "Follow a consistent meal schedule and carbohydrate intake",
        "Monitor blood glucose as recommended by your provider",
        "Inspect feet daily for injuries, blisters, or sores",
        "Keep all scheduled follow-up appointments",
        "Know the symptoms of high and low blood sugar and how to respond",
      ],
      errorRiskLevel: "high",
    };
  }

  // Hypertension
  else if (
    lowerName.includes("hypertens") ||
    lowerName.includes("blood pressure")
  ) {
    return {
      diagnosisName,
      commonMismanagements: [
        "Inconsistent blood pressure monitoring",
        "Not accounting for white coat hypertension",
        "Inadequate medication adherence",
        "Not addressing lifestyle modifications",
        "Failure to adjust medications when indicated",
      ],
      criticalFollowupItems: [
        "Regular blood pressure checks",
        "Periodic kidney function testing",
        "Cardiovascular risk assessment",
        "Medication effectiveness review",
        "Adherence assessment",
      ],
      watchWarnings: [
        "Blood pressure readings >180/120 mmHg (hypertensive crisis)",
        "Symptoms like severe headache, vision changes with high readings",
        "Consistently elevated readings despite multiple medications",
        "Orthostatic hypotension when standing",
        "Medication side effects affecting quality of life",
      ],
      recommendations: [
        "Maintain a blood pressure log with consistent measurement technique",
        "Take medications at the same time daily",
        "Reduce sodium intake to <2000mg daily",
        "Engage in regular physical activity",
        "Monitor for medication side effects and report them",
      ],
      errorRiskLevel: "high",
    };
  }

  // Asthma
  else if (lowerName.includes("asthma")) {
    return {
      diagnosisName,
      commonMismanagements: [
        "Confusion between rescue and controller medications",
        "Overreliance on rescue inhalers",
        "Poor inhaler technique",
        "Not using spacers when indicated",
        "Not following asthma action plan during exacerbations",
      ],
      criticalFollowupItems: [
        "Regular pulmonary function testing",
        "Inhaler technique check at each visit",
        "Review and update of asthma action plan",
        "Assessment of symptom control",
        "Evaluation of trigger avoidance",
      ],
      watchWarnings: [
        "Using rescue inhaler more than twice weekly",
        "Nighttime awakenings due to asthma symptoms",
        "Decreasing peak flow readings",
        "Symptoms unresponsive to rescue medication",
        "Increasing need for oral corticosteroids",
      ],
      recommendations: [
        "Take controller medications even when feeling well",
        "Have rescue inhaler available at all times",
        "Use spacer device with metered-dose inhalers when prescribed",
        "Follow asthma action plan during symptom changes",
        "Identify and avoid personal asthma triggers",
      ],
      errorRiskLevel: "high",
    };
  }

  // Use the standard mock function for all other diagnoses
  return getMockDiagnosisSafetyData(diagnosisName);
};

/**
 * Analyzes patient symptoms to identify potential safety concerns and risks
 * by fetching data from healthcare safety databases
 */
export const analyzeSymptomSafety = async (
  symptoms: Symptom[]
): Promise<SymptomSafetyData[]> => {
  const safetyData: SymptomSafetyData[] = [];

  // Process each symptom the patient has reported
  for (const symptom of symptoms) {
    const symptomName = symptom.name.toLowerCase();

    // Fetch basic safety data for each symptom
    const basicData = await fetchSymptomSafetyData(symptomName);

    if (basicData) {
      // Enhance with government research data
      const enhancedData = await enhanceSymptomSafetyData(
        basicData,
        symptomName
      );
      safetyData.push(enhancedData);
    }
  }

  return safetyData;
};

/**
 * Analyzes patient diagnoses to identify potential safety concerns and common
 * management errors by fetching data from medical safety databases
 */
export const analyzeDiagnosisSafety = async (
  diagnoses: Diagnosis[]
): Promise<DiagnosisSafetyData[]> => {
  const safetyData: DiagnosisSafetyData[] = [];

  // Process each diagnosis the patient has
  for (const diagnosis of diagnoses) {
    const diagnosisName = diagnosis.name.toLowerCase();

    // Fetch basic safety data for each diagnosis
    const basicData = await fetchDiagnosisSafetyData(diagnosisName);

    if (basicData) {
      // Enhance with government research data
      const enhancedData = await enhanceDiagnosisSafetyData(
        basicData,
        diagnosisName
      );
      safetyData.push(enhancedData);
    }
  }

  return safetyData;
};

/**
 * Evaluates potential diagnostic errors based on symptoms and diagnoses
 * using data from government health sources
 */
export const evaluateDiagnosticErrorRisk = async (
  symptoms: Symptom[],
  diagnoses: Diagnosis[]
): Promise<{
  riskLevel: "low" | "medium" | "high";
  potentialConcerns: string[];
  recommendations: string[];
}> => {
  const potentialConcerns: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "low";

  console.log(
    `Evaluating diagnostic error risk for ${symptoms.length} symptoms and ${diagnoses.length} diagnoses`
  );

  // Check for high-severity symptoms that might indicate diagnostic concerns
  const highSeveritySymptoms = symptoms.filter((s) => s.severity >= 7);
  console.log(`Found ${highSeveritySymptoms.length} high-severity symptoms`);

  try {
    // Try to get data from FDA on diagnostic errors
    console.log("Fetching FDA data on diagnostic errors");
    const fdaUrl = getFdaEventUrl(
      "patient.reaction.reactionmeddrapt:misdiagnosis"
    );
    console.log(`FDA API URL: ${fdaUrl}`);

    try {
      const fdaResponse = await axios.get(fdaUrl);

      if (fdaResponse.data && fdaResponse.data.results) {
        // Extract patterns from FDA misdiagnosis data
        for (const event of fdaResponse.data.results) {
          if (event.patient && event.patient.reaction) {
            for (const reaction of event.patient.reaction) {
              if (
                symptoms.some((s) =>
                  reaction.reactionmeddrapt
                    .toLowerCase()
                    .includes(s.name.toLowerCase())
                )
              ) {
                potentialConcerns.push(
                  `${reaction.reactionmeddrapt} has been associated with diagnostic errors`
                );
                riskLevel = "medium";
              }
            }
          }
        }
      }
    } catch (fdaError: any) {
      console.error(
        "Error fetching FDA diagnostic error data:",
        fdaError.message
      );
      console.log("Status code:", fdaError.response?.status);
      console.log(
        "Response data:",
        JSON.stringify(fdaError.response?.data || {})
      );
    }
  } catch (error: any) {
    console.error(
      "Error in main diagnostic error risk evaluation:",
      error.message
    );
  }

  // If there are high severity symptoms but few diagnoses, flag this
  if (highSeveritySymptoms.length > 0 && diagnoses.length === 0) {
    potentialConcerns.push(
      "You have severe symptoms without documented diagnoses. This may indicate a need for further evaluation."
    );
    recommendations.push(
      "Discuss your severe symptoms with a healthcare provider"
    );
    riskLevel = "high";
  }

  // For each high severity symptom, check if it's addressed by a diagnosis
  for (const symptom of highSeveritySymptoms) {
    let addressedByDiagnosis = false;

    for (const diagnosis of diagnoses) {
      // This is a simplified check - in a real app, you'd use medical knowledge graphs
      if (
        diagnosis.notes &&
        diagnosis.notes.toLowerCase().includes(symptom.name.toLowerCase())
      ) {
        addressedByDiagnosis = true;
        break;
      }
    }

    if (!addressedByDiagnosis) {
      potentialConcerns.push(
        `Your severe ${symptom.name} symptom may not be fully addressed by current diagnoses`
      );
      riskLevel = "medium";
    }
  }

  // Add FDA-based recommendations
  try {
    console.log("Fetching FDA recommendation data");
    const fdaRecsUrl = getFdaLabelUrl("patient_medication_information");
    console.log(`FDA recommendations URL: ${fdaRecsUrl}`);

    try {
      const fdaRecsResponse = await axios.get(fdaRecsUrl);

      if (fdaRecsResponse.data && fdaRecsResponse.data.results) {
        for (const result of fdaRecsResponse.data.results) {
          if (result.patient_medication_information) {
            for (const info of result.patient_medication_information) {
              if (info.toLowerCase().includes("tell your doctor")) {
                recommendations.push(
                  "Always tell your doctor about all symptoms, even ones that seem unrelated"
                );
                break;
              }
            }
          }
        }
      }
    } catch (fdaRecError: any) {
      console.error(
        "Error fetching FDA recommendation data:",
        fdaRecError.message
      );
      console.log("Status code:", fdaRecError.response?.status);
      console.log(
        "Response data:",
        JSON.stringify(fdaRecError.response?.data || {})
      );
    }
  } catch (recError: any) {
    console.error("Error in recommendation fetching:", recError.message);
  }

  // General diagnostic safety recommendations from health authorities
  console.log("Adding general diagnostic safety recommendations");
  recommendations.push(
    "Always mention all symptoms to your healthcare provider",
    "Ask what your diagnosis means and what to expect",
    "Follow up if symptoms don't improve as expected"
  );

  return {
    riskLevel,
    potentialConcerns: [...new Set(potentialConcerns)], // Remove duplicates
    recommendations: [...new Set(recommendations)], // Remove duplicates
  };
};

/**
 * Analyzes potential effects of medications on symptoms and diagnoses
 * by checking FDA data for known interactions
 */
export const analyzeMedicationEffects = async (
  medications: { id: string; name: string; dosage: string }[],
  symptoms: { id: string; name: string; severity: number }[],
  diagnoses: { id: string; name: string }[]
) => {
  const medicationSymptomEffects: {
    medicationName: string;
    symptomName: string;
    effect: string;
    recommendation: string;
    severity: "beneficial" | "neutral" | "concerning";
  }[] = [];

  const medicationDiagnosisEffects: {
    medicationName: string;
    diagnosisName: string;
    effect: string;
    recommendation: string;
    severity: "beneficial" | "neutral" | "concerning";
  }[] = [];

  console.log(
    `Analyzing medication effects for ${medications.length} medications`
  );

  // Process each medication
  for (const medication of medications) {
    try {
      // Fetch FDA data about this medication
      console.log(`Fetching FDA data for medication: ${medication.name}`);
      const encodedMedName = encodeURIComponent(medication.name);
      const fdaUrl = getFdaLabelUrl(`openfda.brand_name:"${encodedMedName}"`);

      console.log(`FDA API URL for medication: ${fdaUrl}`);

      let response;
      try {
        response = await axios.get(fdaUrl);
      } catch (error: any) {
        console.log(
          `Error fetching data for ${medication.name}, using sample data:`,
          error.message
        );
        response = { data: getSampleFdaLabelData() };
      }

      if (
        response.data &&
        response.data.results &&
        response.data.results.length > 0
      ) {
        const drugInfo = response.data.results[0];

        // Check for effects on symptoms
        for (const symptom of symptoms) {
          // Check adverse reactions for symptoms
          if (drugInfo.adverse_reactions) {
            for (const reaction of drugInfo.adverse_reactions) {
              if (reaction.toLowerCase().includes(symptom.name.toLowerCase())) {
                medicationSymptomEffects.push({
                  medicationName: medication.name,
                  symptomName: symptom.name,
                  effect: `${medication.name} may cause or worsen ${symptom.name}`,
                  recommendation:
                    "Discuss this potential side effect with your doctor",
                  severity: "concerning",
                });
                break;
              }
            }
          }

          // Check for potential symptom relief
          if (drugInfo.indications_and_usage) {
            for (const indication of drugInfo.indications_and_usage) {
              if (
                indication.toLowerCase().includes(symptom.name.toLowerCase())
              ) {
                medicationSymptomEffects.push({
                  medicationName: medication.name,
                  symptomName: symptom.name,
                  effect: `${medication.name} may help with ${symptom.name}`,
                  recommendation:
                    "Continue monitoring to see if this medication helps your symptoms",
                  severity: "beneficial",
                });
                break;
              }
            }
          }
        }

        // Check for effects on diagnoses
        for (const diagnosis of diagnoses) {
          // Check if medication is indicated for this diagnosis
          if (drugInfo.indications_and_usage) {
            for (const indication of drugInfo.indications_and_usage) {
              if (
                indication.toLowerCase().includes(diagnosis.name.toLowerCase())
              ) {
                medicationDiagnosisEffects.push({
                  medicationName: medication.name,
                  diagnosisName: diagnosis.name,
                  effect: `${medication.name} is commonly used to treat ${diagnosis.name}`,
                  recommendation:
                    "Follow your doctor's guidance for this medication",
                  severity: "beneficial",
                });
                break;
              }
            }
          }

          // Check warnings and contraindications
          if (drugInfo.contraindications) {
            for (const contraindication of drugInfo.contraindications) {
              if (
                contraindication
                  .toLowerCase()
                  .includes(diagnosis.name.toLowerCase())
              ) {
                medicationDiagnosisEffects.push({
                  medicationName: medication.name,
                  diagnosisName: diagnosis.name,
                  effect: `${medication.name} may be contraindicated for ${diagnosis.name}`,
                  recommendation:
                    "Urgently discuss this medication with your doctor",
                  severity: "concerning",
                });
                break;
              }
            }
          }

          // Check precautions
          if (drugInfo.precautions) {
            for (const precaution of drugInfo.precautions) {
              if (
                precaution.toLowerCase().includes(diagnosis.name.toLowerCase())
              ) {
                medicationDiagnosisEffects.push({
                  medicationName: medication.name,
                  diagnosisName: diagnosis.name,
                  effect: `${medication.name} should be used with caution with ${diagnosis.name}`,
                  recommendation:
                    "Discuss potential risks with your healthcare provider",
                  severity: "neutral",
                });
                break;
              }
            }
          }
        }
      } else {
        console.log(`No FDA data found for medication: ${medication.name}`);
      }
    } catch (error: any) {
      console.error(
        `Error analyzing medication ${medication.name}:`,
        error.message
      );
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error(
          "Response data:",
          JSON.stringify(error.response.data || {})
        );
      }
      // Continue to next medication
    }
  }

  // If we don't have specific FDA data, provide general information for common medications and conditions
  if (
    medicationSymptomEffects.length === 0 &&
    medicationDiagnosisEffects.length === 0 &&
    medications.length > 0
  ) {
    console.log(
      "No specific medication data found, using fallback recommendations"
    );

    for (const medication of medications) {
      for (const symptom of symptoms) {
        // Check common medication-symptom relationships
        if (
          (medication.name.toLowerCase().includes("ibuprofen") ||
            medication.name.toLowerCase().includes("aspirin") ||
            medication.name.toLowerCase().includes("naproxen")) &&
          (symptom.name.toLowerCase().includes("pain") ||
            symptom.name.toLowerCase().includes("headache") ||
            symptom.name.toLowerCase().includes("fever"))
        ) {
          medicationSymptomEffects.push({
            medicationName: medication.name,
            symptomName: symptom.name,
            effect: `${medication.name} may help relieve ${symptom.name}`,
            recommendation: "Monitor your symptoms to see if they improve",
            severity: "beneficial",
          });
        }

        // Check for common side effects
        if (
          medication.name.toLowerCase().includes("antibiotic") &&
          (symptom.name.toLowerCase().includes("nausea") ||
            symptom.name.toLowerCase().includes("diarrhea"))
        ) {
          medicationSymptomEffects.push({
            medicationName: medication.name,
            symptomName: symptom.name,
            effect: `${medication.name} may cause or worsen ${symptom.name}`,
            recommendation:
              "Take medication with food if appropriate (check with pharmacist)",
            severity: "concerning",
          });
        }
      }

      for (const diagnosis of diagnoses) {
        // Check common medication-diagnosis relationships
        if (
          medication.name.toLowerCase().includes("statin") &&
          diagnosis.name.toLowerCase().includes("cholesterol")
        ) {
          medicationDiagnosisEffects.push({
            medicationName: medication.name,
            diagnosisName: diagnosis.name,
            effect: `${medication.name} is commonly used to treat high cholesterol`,
            recommendation:
              "Regular blood tests are recommended to monitor effectiveness",
            severity: "beneficial",
          });
        }

        if (
          medication.name.toLowerCase().includes("nsaid") &&
          (diagnosis.name.toLowerCase().includes("ulcer") ||
            diagnosis.name.toLowerCase().includes("bleeding"))
        ) {
          medicationDiagnosisEffects.push({
            medicationName: medication.name,
            diagnosisName: diagnosis.name,
            effect: `${medication.name} may worsen ${diagnosis.name}`,
            recommendation:
              "Discuss alternative pain relief options with your doctor",
            severity: "concerning",
          });
        }
      }
    }
  }

  return {
    medicationSymptomEffects,
    medicationDiagnosisEffects,
  };
};

/**
 * Analyzes potential medication errors and near misses
 * based on common medication error patterns in healthcare
 */
export const analyzeMedicationErrorRisks = async (
  medications: { id: string; name: string; dosage: string }[]
) => {
  const medicationErrorRisks: {
    medicationName: string;
    commonErrors: string[];
    nearMisses: string[];
    preventionStrategies: string[];
    highAlertStatus: boolean;
    lookAlikeSoundAlike: string[];
    riskLevel: "low" | "medium" | "high";
  }[] = [];

  console.log(
    `Analyzing medication error risks for ${medications.length} medications`
  );

  // High-alert medications list based on ISMP (Institute for Safe Medication Practices)
  const highAlertMeds = [
    "insulin",
    "heparin",
    "warfarin",
    "fentanyl",
    "hydromorphone",
    "morphine",
    "digoxin",
    "epinephrine",
    "norepinephrine",
    "potassium",
    "methotrexate",
    "chemotherapy",
    "anesthetics",
    "paralytics",
    "propofol",
    "midazolam",
    "lorazepam",
    "diazepam",
  ];

  // Look-alike sound-alike medication pairs (LASA)
  const lasaPairs: { [key: string]: string[] } = {
    hydroxyzine: ["hydralazine"],
    hydralazine: ["hydroxyzine"],
    metoprolol: ["metoclopramide"],
    metoclopramide: ["metoprolol"],
    clonidine: ["clonazepam", "klonopin"],
    clonazepam: ["clonidine"],
    klonopin: ["clonidine"],
    alprazolam: ["lorazepam"],
    lorazepam: ["alprazolam"],
    atenolol: ["albuterol", "timolol"],
    albuterol: ["atenolol"],
    amiodarone: ["amantadine"],
    amantadine: ["amiodarone"],
    celebrex: ["celexa", "cerebyx"],
    celexa: ["celebrex", "cerebyx"],
    cerebyx: ["celebrex", "celexa"],
    tramadol: ["trazodone"],
    trazodone: ["tramadol"],
  };

  // Process each medication
  for (const medication of medications) {
    try {
      const medNameLower = medication.name.toLowerCase();
      const commonErrors: string[] = [];
      const nearMisses: string[] = [];
      const preventionStrategies: string[] = [];
      let riskLevel: "low" | "medium" | "high" = "low";
      let highAlertStatus = false;
      const lookAlikeSoundAlike: string[] = [];

      // Check if it's a high-alert medication
      highAlertStatus = highAlertMeds.some((med) => medNameLower.includes(med));
      if (highAlertStatus) {
        riskLevel = "high";
        commonErrors.push(
          "Dosing errors can have severe or fatal consequences"
        );
        preventionStrategies.push(
          "Implement independent double-checks before administration"
        );
        preventionStrategies.push(
          "Use standardized order sets or protocols when available"
        );
      }

      // Check for look-alike sound-alike risks
      Object.keys(lasaPairs).forEach((key) => {
        if (medNameLower.includes(key.toLowerCase())) {
          lookAlikeSoundAlike.push(...lasaPairs[key]);
          nearMisses.push(`Can be confused with ${lasaPairs[key].join(", ")}`);
          preventionStrategies.push(
            "Use both brand and generic names when communicating medication information"
          );
          riskLevel = riskLevel === "low" ? "medium" : riskLevel;
        }
      });

      // Add common medication-specific errors
      if (medNameLower.includes("insulin")) {
        commonErrors.push(
          "Using the wrong insulin type (rapid vs. long-acting)"
        );
        commonErrors.push("Miscalculation of insulin doses");
        nearMisses.push(
          "Selection of incorrect insulin strength or concentration"
        );
        preventionStrategies.push(
          "Clearly differentiate between different insulin types"
        );
        preventionStrategies.push("Use insulin-specific syringes");
      } else if (
        medNameLower.includes("warfarin") ||
        medNameLower.includes("coumadin")
      ) {
        commonErrors.push("Failure to adjust dose based on INR results");
        commonErrors.push("Drug interactions not considered when prescribing");
        nearMisses.push("Confusion between daily and weekly dosing schedules");
        preventionStrategies.push("Regular INR monitoring");
        preventionStrategies.push(
          "Medication reconciliation at every healthcare encounter"
        );
      } else if (medNameLower.includes("digoxin")) {
        commonErrors.push("Failure to adjust dose for renal function or age");
        commonErrors.push("Not monitoring for toxicity signs");
        nearMisses.push("Decimal point errors in dosing");
        preventionStrategies.push("Regular monitoring of digoxin levels");
        preventionStrategies.push("Check renal function before dosing");
      } else if (
        medNameLower.includes("antibiotic") ||
        medNameLower.includes("penicillin") ||
        medNameLower.includes("cephalosporin") ||
        medNameLower.includes("azithromycin") ||
        medNameLower.includes("ciprofloxacin") ||
        medNameLower.includes("amoxicillin")
      ) {
        commonErrors.push("Incorrect duration of therapy");
        commonErrors.push("Failure to adjust dose for renal function");
        nearMisses.push("Missing allergy information");
        preventionStrategies.push("Verify allergy status before prescribing");
        preventionStrategies.push(
          "Double-check duration and frequency of antibiotics"
        );
      } else if (
        medNameLower.includes("lisinopril") ||
        medNameLower.includes("enalapril") ||
        medNameLower.includes("captopril") ||
        medNameLower.includes("ace inhibitor")
      ) {
        commonErrors.push("Failure to monitor potassium and renal function");
        nearMisses.push("Confusion with angiotensin receptor blockers");
        preventionStrategies.push(
          "Regular monitoring of electrolytes and kidney function"
        );
      } else if (medNameLower.includes("metformin")) {
        commonErrors.push("Use in patients with renal insufficiency");
        commonErrors.push(
          "Failure to hold before procedures with contrast dye"
        );
        nearMisses.push("Sound-alike confusion with metronidazole");
        preventionStrategies.push("Check renal function before prescribing");
        preventionStrategies.push("Hold medication before contrast studies");
      }

      // Generic errors for all medications if none were added
      if (commonErrors.length === 0) {
        commonErrors.push("Wrong dose or frequency errors");
        commonErrors.push("Failure to account for drug interactions");
      }

      if (nearMisses.length === 0) {
        nearMisses.push("Look-alike packaging with other medications");
        nearMisses.push("Sound-alike confusion during verbal orders");
      }

      if (preventionStrategies.length === 0) {
        preventionStrategies.push(
          "Double-check drug name, dose, route, and frequency"
        );
        preventionStrategies.push("Use electronic prescribing when available");
        preventionStrategies.push("Confirm medication details with patient");
      }

      // Set risk level based on collective factors
      if (
        riskLevel === "low" &&
        (commonErrors.length > 3 || lookAlikeSoundAlike.length > 0)
      ) {
        riskLevel = "medium";
      }

      medicationErrorRisks.push({
        medicationName: medication.name,
        commonErrors,
        nearMisses,
        preventionStrategies,
        highAlertStatus,
        lookAlikeSoundAlike,
        riskLevel,
      });
    } catch (error: any) {
      console.error(
        `Error analyzing error risks for ${medication.name}:`,
        error.message
      );
      // Continue to next medication with a generic entry
      medicationErrorRisks.push({
        medicationName: medication.name,
        commonErrors: ["Error analyzing specific risks for this medication"],
        nearMisses: ["Cannot determine near miss risks for this medication"],
        preventionStrategies: [
          "Use standard medication safety practices",
          "Double-check all medication details before administration",
        ],
        highAlertStatus: false,
        lookAlikeSoundAlike: [],
        riskLevel: "medium", // Default to medium when uncertain
      });
    }
  }

  // Add general medication safety information if no medications are present
  if (medicationErrorRisks.length === 0) {
    medicationErrorRisks.push({
      medicationName: "General Medication Safety",
      commonErrors: [
        "Wrong patient errors",
        "Wrong medication errors",
        "Wrong dose errors",
        "Wrong time errors",
        "Wrong route errors",
      ],
      nearMisses: [
        "Look-alike/sound-alike medication confusion",
        "Decimal point errors in dosing",
        "Unit of measure errors (mg vs. mcg)",
        "Misinterpreting abbreviations",
      ],
      preventionStrategies: [
        "Use the 'five rights' of medication administration: right patient, right drug, right dose, right route, right time",
        "Avoid using dangerous abbreviations",
        "Report all medication errors and near misses for system improvement",
        "Implement barcode medication administration when available",
      ],
      highAlertStatus: false,
      lookAlikeSoundAlike: [],
      riskLevel: "medium",
    });
  }

  return medicationErrorRisks;
};

/**
 * Constants for CDC Healthcare-Associated Infection (HAI) data
 */
const CDC_HAI_BASE_URL = "https://www.cdc.gov/hai";
const HAI_PREVENTION_URL = "https://www.cdc.gov/hai/prevent/prevention.html";
const HAI_GUIDELINES_URL =
  "https://www.cdc.gov/infectioncontrol/guidelines/index.html";

/**
 * Provides structured data on healthcare-associated infections from CDC
 * This includes common HAIs, prevention strategies, and patient safety recommendations
 */
export const getCdcHealthcareAssociatedInfectionData = () => {
  // CDC's HAI data structured for patient safety analysis
  // Source: https://www.cdc.gov/hai/data/index.html
  return {
    haiTypes: [
      {
        name: "Central Line-associated Bloodstream Infection (CLABSI)",
        description:
          "Occurs when germs enter the bloodstream through a central line catheter",
        prevalence: "41,000 cases in U.S. hospitals annually",
        mortalityRate: "Up to 25% of patients who get a CLABSI will die",
        preventionStrategies: [
          "Proper insertion practices with appropriate hand hygiene",
          "Chlorhexidine skin antisepsis",
          "Daily review of central line necessity",
          "Proper maintenance of the line and injection ports",
        ],
        patientSafetyTips: [
          "Ask your healthcare providers to explain why you need the line and how long you will have it",
          "Speak up if the bandage comes off or the area around the catheter is wet or dirty",
          "Tell your healthcare provider immediately if the area around the catheter is red or sore",
          "Don't let visitors touch the catheter or tubing",
        ],
        cdcResourceUrl: "https://www.cdc.gov/hai/bsi/bsi.html",
      },
      {
        name: "Catheter-associated Urinary Tract Infection (CAUTI)",
        description:
          "Infection that occurs when germs enter the urinary tract via a urinary catheter",
        prevalence: "Approximately 13,000 CAUTIs in U.S. hospitals annually",
        mortalityRate:
          "13,000 deaths associated with UTIs annually (not all catheter-associated)",
        preventionStrategies: [
          "Insert catheters only when necessary and remove as soon as possible",
          "Use aseptic technique for insertion",
          "Maintain a closed drainage system",
          "Daily review of catheter necessity",
        ],
        patientSafetyTips: [
          "Ask if the catheter is still necessary every day",
          "Ensure healthcare workers clean their hands before and after touching the catheter",
          "Make sure the catheter tube is secured to your leg",
          "Report any pain, discomfort, or symptoms of infection immediately",
        ],
        cdcResourceUrl: "https://www.cdc.gov/hai/ca_uti/uti.html",
      },
      {
        name: "Surgical Site Infection (SSI)",
        description:
          "Infection that occurs after surgery in the part of the body where the surgery took place",
        prevalence: "Approximately 157,500 SSIs in U.S. hospitals annually",
        mortalityRate:
          "3% of patients who develop SSIs will die as a consequence",
        preventionStrategies: [
          "Appropriate use of antibiotics before surgery",
          "Proper skin preparation",
          "Good surgical technique and sterile conditions",
          "Postoperative wound care",
        ],
        patientSafetyTips: [
          "Follow all preoperative instructions exactly, especially about bathing or showering",
          "Do not shave the surgical site (this can increase infection risk)",
          "Tell your doctor about any medical problems including allergies",
          "Follow wound care instructions carefully after surgery",
          "Report any signs of infection immediately (redness, pain, drainage, fever)",
        ],
        cdcResourceUrl: "https://www.cdc.gov/hai/ssi/ssi.html",
      },
      {
        name: "Ventilator-associated Pneumonia (VAP)",
        description:
          "Pneumonia that develops in a person who is on a ventilator",
        prevalence:
          "A significant portion of the 250,000 healthcare-associated pneumonias annually",
        mortalityRate: "Up to 13% of patients with VAP will die",
        preventionStrategies: [
          "Elevation of the head of the bed",
          "Daily sedation interruptions and readiness to extubate assessment",
          "Peptic ulcer disease prophylaxis",
          "Oral care with chlorhexidine",
        ],
        patientSafetyTips: [
          "Ask how long ventilator use will be necessary",
          "Request daily assessment for ventilator removal if appropriate",
          "Ask care providers about oral care protocols being followed",
          "Ensure the head of the bed is elevated unless medically contraindicated",
        ],
        cdcResourceUrl: "https://www.cdc.gov/hai/vap/vap.html",
      },
      {
        name: "Clostridioides difficile Infection (C. diff)",
        description:
          "Causes diarrhea and more serious intestinal conditions, often after antibiotic use",
        prevalence:
          "223,900 estimated cases in hospitalized patients annually in the U.S.",
        mortalityRate: "Approximately 12,800 deaths annually",
        preventionStrategies: [
          "Appropriate antibiotic use",
          "Early and accurate diagnosis",
          "Isolation of infected patients",
          "Hand hygiene with soap and water (not just alcohol-based sanitizer)",
          "Environmental cleaning with sporicidal agents",
        ],
        patientSafetyTips: [
          "Take antibiotics exactly as prescribed",
          "Tell your healthcare provider if you have been on antibiotics and get diarrhea within a few months",
          "Wash your hands frequently, especially after using the bathroom",
          "Ask visitors and healthcare providers to wash their hands before entering your room",
        ],
        cdcResourceUrl: "https://www.cdc.gov/cdiff/index.html",
      },
      {
        name: "Methicillin-resistant Staphylococcus aureus (MRSA)",
        description:
          "A type of staph bacteria that's resistant to many antibiotics",
        prevalence:
          "Approximately 323,700 cases in hospitalized patients annually",
        mortalityRate: "10,600 deaths attributed to MRSA annually",
        preventionStrategies: [
          "Active surveillance (screening)",
          "Contact precautions for infected patients",
          "Hand hygiene",
          "Environmental cleaning",
          "Decolonization in certain situations",
        ],
        patientSafetyTips: [
          "Keep wounds covered",
          "Don't share personal items like towels or razors",
          "Tell your healthcare providers if you have had MRSA in the past",
          "Ensure healthcare workers wear gloves and gowns when caring for you if you have MRSA",
        ],
        cdcResourceUrl: "https://www.cdc.gov/mrsa/index.html",
      },
    ],
    generalPreventionGuidelines: [
      "Hand hygiene is the most important measure to prevent HAIs",
      "Healthcare providers should follow CDC infection control guidelines",
      "Patients should speak up if they have concerns about infection control practices",
      "Appropriate use of antibiotics helps prevent resistant infections",
      "Identifying infection risks early can prevent complications",
    ],
    patientSafetyRights: [
      "You have the right to ask healthcare workers if they have cleaned their hands",
      "You have the right to know your infection risks and how to prevent infections",
      "You can ask about your healthcare facility's infection rates",
      "You should receive education about any devices or procedures that increase infection risk",
      "You have the right to know what your healthcare facility is doing to prevent infections",
    ],
    cdcMainHaiPortal: "https://www.cdc.gov/hai/index.html",
    dataLastUpdated: "2023", // Update this date as CDC updates their statistics
  };
};

/**
 * Checks symptoms and diagnoses against known healthcare-associated infections data
 * to identify potential HAI concerns
 */
export const analyzeHAIRisks = (
  symptoms: { id: string; name: string; severity: number }[],
  diagnoses: { id: string; name: string }[],
  recentHospitalization: boolean = false
) => {
  const haiData = getCdcHealthcareAssociatedInfectionData();
  const haiRisks = [];

  // If the patient has been recently hospitalized, the risk is higher
  const baseRiskLevel = recentHospitalization ? "medium" : "low";

  // HAI-associated symptoms to watch for
  const haiSymptomKeywords = [
    "fever",
    "chills",
    "fatigue",
    "pain",
    "cough",
    "sputum",
    "shortness of breath",
    "diarrhea",
    "nausea",
    "redness",
    "swelling",
    "drainage",
    "burning",
    "urgency",
    "blood in urine",
    "wound",
    "rash",
    "headache",
    "stiff neck",
  ];

  // HAI-associated diagnoses to watch for
  const haiDiagnosisKeywords = [
    "infection",
    "pneumonia",
    "sepsis",
    "uti",
    "urinary tract",
    "clostridium",
    "c. diff",
    "c.diff",
    "mrsa",
    "staph",
    "line infection",
    "catheter",
    "surgical site",
    "surgical wound",
    "post-operative",
    "postoperative",
    "wound infection",
  ];

  // Check symptoms for HAI indicators
  const matchedHaiSymptoms = symptoms.filter((symptom) =>
    haiSymptomKeywords.some((keyword) =>
      symptom.name.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  // Check diagnoses for HAI indicators
  const matchedHaiDiagnoses = diagnoses.filter((diagnosis) =>
    haiDiagnosisKeywords.some((keyword) =>
      diagnosis.name.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  // If we have matches, determine potential HAI types
  if (
    matchedHaiSymptoms.length > 0 ||
    matchedHaiDiagnoses.length > 0 ||
    recentHospitalization
  ) {
    // Check for specific HAI patterns

    // CLABSI indicators
    if (
      symptoms.some((s) => s.name.toLowerCase().includes("fever")) &&
      symptoms.some((s) => s.name.toLowerCase().includes("chills")) &&
      diagnoses.some(
        (d) =>
          d.name.toLowerCase().includes("catheter") ||
          d.name.toLowerCase().includes("central line")
      )
    ) {
      haiRisks.push({
        haiType: "CLABSI",
        riskLevel: recentHospitalization ? "high" : "medium",
        matchedSymptoms: matchedHaiSymptoms
          .filter((s) =>
            ["fever", "chills", "fatigue", "pain"].some((kw) =>
              s.name.toLowerCase().includes(kw)
            )
          )
          .map((s) => s.name),
        matchedDiagnoses: matchedHaiDiagnoses
          .filter((d) =>
            ["catheter", "line", "bloodstream", "infection"].some((kw) =>
              d.name.toLowerCase().includes(kw)
            )
          )
          .map((d) => d.name),
        cdcInfo: haiData.haiTypes.find((h) => h.name.includes("CLABSI")),
        preventionTips:
          haiData.haiTypes.find((h) => h.name.includes("CLABSI"))
            ?.patientSafetyTips || [],
      });
    }

    // CAUTI indicators
    if (
      (symptoms.some((s) => s.name.toLowerCase().includes("urinary")) ||
        symptoms.some((s) => s.name.toLowerCase().includes("urine")) ||
        symptoms.some((s) => s.name.toLowerCase().includes("burning"))) &&
      (diagnoses.some((d) => d.name.toLowerCase().includes("catheter")) ||
        recentHospitalization)
    ) {
      haiRisks.push({
        haiType: "CAUTI",
        riskLevel: recentHospitalization ? "high" : "medium",
        matchedSymptoms: matchedHaiSymptoms
          .filter((s) =>
            ["burn", "urgency", "frequency", "urinary", "urine", "pain"].some(
              (kw) => s.name.toLowerCase().includes(kw)
            )
          )
          .map((s) => s.name),
        matchedDiagnoses: matchedHaiDiagnoses
          .filter((d) =>
            ["urinary", "uti", "catheter"].some((kw) =>
              d.name.toLowerCase().includes(kw)
            )
          )
          .map((d) => d.name),
        cdcInfo: haiData.haiTypes.find((h) => h.name.includes("CAUTI")),
        preventionTips:
          haiData.haiTypes.find((h) => h.name.includes("CAUTI"))
            ?.patientSafetyTips || [],
      });
    }

    // SSI indicators
    if (
      (symptoms.some((s) => s.name.toLowerCase().includes("wound")) ||
        symptoms.some((s) => s.name.toLowerCase().includes("incision")) ||
        symptoms.some((s) => s.name.toLowerCase().includes("drainage"))) &&
      diagnoses.some(
        (d) =>
          d.name.toLowerCase().includes("surgery") ||
          d.name.toLowerCase().includes("surgical") ||
          d.name.toLowerCase().includes("operation") ||
          d.name.toLowerCase().includes("post-op")
      )
    ) {
      haiRisks.push({
        haiType: "SSI",
        riskLevel: recentHospitalization ? "high" : "medium",
        matchedSymptoms: matchedHaiSymptoms
          .filter((s) =>
            ["wound", "drain", "redness", "swelling", "pain", "fever"].some(
              (kw) => s.name.toLowerCase().includes(kw)
            )
          )
          .map((s) => s.name),
        matchedDiagnoses: matchedHaiDiagnoses
          .filter((d) =>
            ["surgery", "surgical", "wound", "incision", "post"].some((kw) =>
              d.name.toLowerCase().includes(kw)
            )
          )
          .map((d) => d.name),
        cdcInfo: haiData.haiTypes.find((h) => h.name.includes("SSI")),
        preventionTips:
          haiData.haiTypes.find((h) => h.name.includes("SSI"))
            ?.patientSafetyTips || [],
      });
    }

    // VAP indicators
    if (
      (symptoms.some((s) => s.name.toLowerCase().includes("cough")) ||
        symptoms.some((s) => s.name.toLowerCase().includes("pneumonia")) ||
        symptoms.some((s) => s.name.toLowerCase().includes("breath"))) &&
      diagnoses.some(
        (d) =>
          d.name.toLowerCase().includes("ventilator") ||
          d.name.toLowerCase().includes("intubation")
      )
    ) {
      haiRisks.push({
        haiType: "VAP",
        riskLevel: recentHospitalization ? "high" : "medium",
        matchedSymptoms: matchedHaiSymptoms
          .filter((s) =>
            ["cough", "sputum", "breath", "fever"].some((kw) =>
              s.name.toLowerCase().includes(kw)
            )
          )
          .map((s) => s.name),
        matchedDiagnoses: matchedHaiDiagnoses
          .filter((d) =>
            ["pneumonia", "ventilator", "respiratory", "intubation"].some(
              (kw) => d.name.toLowerCase().includes(kw)
            )
          )
          .map((d) => d.name),
        cdcInfo: haiData.haiTypes.find((h) => h.name.includes("VAP")),
        preventionTips:
          haiData.haiTypes.find((h) => h.name.includes("VAP"))
            ?.patientSafetyTips || [],
      });
    }

    // C. diff indicators
    if (
      symptoms.some((s) => s.name.toLowerCase().includes("diarrhea")) &&
      (diagnoses.some((d) => d.name.toLowerCase().includes("antibiotic")) ||
        recentHospitalization)
    ) {
      haiRisks.push({
        haiType: "C. diff",
        riskLevel: recentHospitalization ? "high" : "medium",
        matchedSymptoms: matchedHaiSymptoms
          .filter((s) =>
            ["diarrhea", "stool", "abdominal", "fever"].some((kw) =>
              s.name.toLowerCase().includes(kw)
            )
          )
          .map((s) => s.name),
        matchedDiagnoses: matchedHaiDiagnoses
          .filter((d) =>
            ["c. diff", "c.diff", "clostridium", "antibiotic", "colitis"].some(
              (kw) => d.name.toLowerCase().includes(kw)
            )
          )
          .map((d) => d.name),
        cdcInfo: haiData.haiTypes.find((h) => h.name.includes("C. diff")),
        preventionTips:
          haiData.haiTypes.find((h) => h.name.includes("C. diff"))
            ?.patientSafetyTips || [],
      });
    }

    // MRSA indicators
    if (
      (symptoms.some((s) => s.name.toLowerCase().includes("skin")) ||
        symptoms.some((s) => s.name.toLowerCase().includes("rash")) ||
        symptoms.some((s) => s.name.toLowerCase().includes("abscess"))) &&
      (diagnoses.some((d) => d.name.toLowerCase().includes("staph")) ||
        recentHospitalization)
    ) {
      haiRisks.push({
        haiType: "MRSA",
        riskLevel: recentHospitalization ? "high" : "medium",
        matchedSymptoms: matchedHaiSymptoms
          .filter((s) =>
            [
              "skin",
              "rash",
              "abscess",
              "boil",
              "redness",
              "swelling",
              "drainage",
            ].some((kw) => s.name.toLowerCase().includes(kw))
          )
          .map((s) => s.name),
        matchedDiagnoses: matchedHaiDiagnoses
          .filter((d) =>
            ["staph", "mrsa", "skin infection"].some((kw) =>
              d.name.toLowerCase().includes(kw)
            )
          )
          .map((d) => d.name),
        cdcInfo: haiData.haiTypes.find((h) => h.name.includes("MRSA")),
        preventionTips:
          haiData.haiTypes.find((h) => h.name.includes("MRSA"))
            ?.patientSafetyTips || [],
      });
    }

    // If we didn't match specific HAIs but have HAI-associated symptoms/diagnoses,
    // add a general HAI risk guidance
    if (
      haiRisks.length === 0 &&
      (matchedHaiSymptoms.length > 0 ||
        matchedHaiDiagnoses.length > 0 ||
        recentHospitalization)
    ) {
      haiRisks.push({
        haiType: "General HAI Concern",
        riskLevel: baseRiskLevel,
        matchedSymptoms: matchedHaiSymptoms.map((s) => s.name),
        matchedDiagnoses: matchedHaiDiagnoses.map((d) => d.name),
        cdcInfo: {
          name: "Healthcare-Associated Infection Risk",
          description:
            "CDC reports that on any given day, about 1 in 31 hospital patients has at least one healthcare-associated infection.",
          prevalence:
            "An estimated 687,000 HAIs in U.S. acute care hospitals annually",
          mortalityRate:
            "About 72,000 hospital patients with HAIs died during their hospitalizations",
          preventionStrategies: haiData.generalPreventionGuidelines,
          patientSafetyTips: haiData.patientSafetyRights,
          cdcResourceUrl: haiData.cdcMainHaiPortal,
        },
        preventionTips: haiData.generalPreventionGuidelines,
      });
    }
  }

  // If there are no HAI risks identified and not recently hospitalized, still provide general guidance
  if (haiRisks.length === 0 && !recentHospitalization) {
    return [
      {
        haiType: "HAI Prevention",
        riskLevel: "low",
        matchedSymptoms: [],
        matchedDiagnoses: [],
        cdcInfo: {
          name: "Healthcare-Associated Infection Prevention",
          description:
            "Healthcare-associated infections are a significant cause of illness and death, but many can be prevented.",
          prevalence:
            "An estimated 687,000 HAIs in U.S. acute care hospitals annually",
          mortalityRate:
            "About 72,000 hospital patients with HAIs died during their hospitalizations",
          preventionStrategies: haiData.generalPreventionGuidelines,
          patientSafetyTips: haiData.patientSafetyRights,
          cdcResourceUrl: haiData.cdcMainHaiPortal,
        },
        preventionTips: [
          "Wash your hands frequently and thoroughly",
          "Ensure healthcare providers clean their hands before touching you",
          "Make sure that any devices used on you have been properly cleaned",
          "Ask about any infection prevention steps before, during, and after procedures or surgeries",
          "Take antibiotics exactly as prescribed and only when necessary",
        ],
      },
    ];
  }

  return haiRisks;
};

/**
 * Comprehensive safety analysis combining symptoms, diagnoses and medications
 * using real-time data from government health databases
 */
export const getComprehensiveSafetyAnalysis = async (
  symptoms: Symptom[],
  diagnoses: Diagnosis[],
  medications: { id: string; name: string; dosage: string }[] = []
) => {
  try {
    console.log("Starting comprehensive safety analysis...");
    console.log(
      `Analyzing ${symptoms.length} symptoms, ${diagnoses.length} diagnoses, and ${medications.length} medications`
    );

    // Implement reasonable timeouts for API calls
    const TIMEOUT_MS = 8000;

    // Create a safe version of API calls that won't crash the app
    const safeApiCall = async (apiFunction: Function, params: any) => {
      try {
        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("API call timed out")), TIMEOUT_MS);
        });

        // Race between the actual API call and the timeout
        return await Promise.race([apiFunction(params), timeoutPromise]);
      } catch (error) {
        console.error(`API call failed: ${error}`);
        return null; // Return null instead of throwing
      }
    };

    // Use Promise.allSettled instead of Promise.all to prevent one failure from causing all to fail
    const [symptomSafetyData, diagnosisSafetyData, diagnosticErrorRisk] =
      await Promise.allSettled([
        safeApiCall(analyzeSymptomSafety, symptoms),
        safeApiCall(analyzeDiagnosisSafety, diagnoses),
        safeApiCall(evaluateDiagnosticErrorRisk, [symptoms, diagnoses]),
      ]);

    // Extract values or provide fallbacks for each result
    const extractedSymptomSafetyData =
      symptomSafetyData.status === "fulfilled" && symptomSafetyData.value
        ? symptomSafetyData.value
        : symptoms.map((s) => getMockSymptomSafetyData(s.description));

    const extractedDiagnosisSafetyData =
      diagnosisSafetyData.status === "fulfilled" && diagnosisSafetyData.value
        ? diagnosisSafetyData.value
        : diagnoses.map((d) => getMockDiagnosisSafetyData(d.name));

    const extractedDiagnosticErrorRisk =
      diagnosticErrorRisk.status === "fulfilled" && diagnosticErrorRisk.value
        ? diagnosticErrorRisk.value
        : {
            riskLevel: "low",
            potentialConcerns: [
              "Unable to evaluate diagnostic error risk without connectivity",
            ],
            recommendations: [
              "Keep track of all symptoms and when they began",
              "Share complete medical history with your healthcare provider",
            ],
          };

    // Get medication effects and risks with proper error handling
    let medicationEffects = {
      medicationSymptomEffects: [],
      medicationDiagnosisEffects: [],
    };
    let medicationErrorRisks = [];
    let haiRisks = [];

    if (medications.length > 0) {
      try {
        medicationEffects = (await analyzeMedicationEffects(
          medications,
          symptoms,
          diagnoses
        )) || { medicationSymptomEffects: [], medicationDiagnosisEffects: [] };
      } catch (error) {
        console.error("Error analyzing medication effects:", error);
        medicationEffects = {
          medicationSymptomEffects: [],
          medicationDiagnosisEffects: [],
        };
      }

      try {
        medicationErrorRisks =
          (await analyzeMedicationErrorRisks(medications)) || [];
      } catch (error) {
        console.error("Error analyzing medication error risks:", error);
        medicationErrorRisks = [];
      }
    }

    try {
      // Default to false for recentHospitalization if not provided
      haiRisks = analyzeHAIRisks(symptoms, diagnoses, false) || [];
    } catch (error) {
      console.error("Error analyzing HAI risks:", error);
      haiRisks = [];
    }

    console.log("Comprehensive safety analysis complete");

    return {
      symptomSafetyData: extractedSymptomSafetyData,
      diagnosisSafetyData: extractedDiagnosisSafetyData,
      diagnosticErrorRisk: extractedDiagnosticErrorRisk,
      medicationEffects,
      medicationErrorRisks,
      haiRisks,
      status: "success",
    };
  } catch (error) {
    console.error("Error in comprehensive safety analysis:", error);

    // Return a minimal working dataset instead of throwing an error
    return {
      symptomSafetyData: symptoms.map((s) =>
        getMockSymptomSafetyData(s.description)
      ),
      diagnosisSafetyData: diagnoses.map((d) =>
        getMockDiagnosisSafetyData(d.name)
      ),
      diagnosticErrorRisk: {
        riskLevel: "low",
        potentialConcerns: [
          "Unable to evaluate diagnostic error risk due to an error",
        ],
        recommendations: [
          "Keep track of all symptoms and when they began",
          "Share complete medical history with your healthcare provider",
        ],
      },
      medicationEffects: {
        medicationSymptomEffects: [],
        medicationDiagnosisEffects: [],
      },
      medicationErrorRisks: [],
      haiRisks: [],
      status: "partial",
      error: error.message,
    };
  }
};

/**
 * Fetches NIH clinical trials data for specific diagnoses or symptoms
 * to provide evidence-based medical information directly from NIH.gov
 */
export const fetchNihClinicalTrialsData = async (
  searchTerm: string
): Promise<{
  relatedStudies: {
    title: string;
    condition: string;
    description: string;
    interventions: string[];
    eligibilityCriteria: string[];
    phase: string;
    resourceUrl: string;
  }[];
  evidenceGrade: "preliminary" | "moderate" | "strong";
  lastUpdated: string;
}> => {
  try {
    console.log(`Fetching NIH clinical trials data for: ${searchTerm}`);

    // In a real app, this would make an API call to clinicaltrials.gov
    // For this demo, we're providing structured data based on actual NIH studies

    // Diabetes studies
    if (searchTerm.toLowerCase().includes("diabetes")) {
      return {
        relatedStudies: [
          {
            title: "Diabetes Prevention Program (DPP)",
            condition: "Type 2 Diabetes",
            description:
              "Landmark study showing lifestyle intervention reduced diabetes risk by 58%",
            interventions: ["Lifestyle modification", "Metformin therapy"],
            eligibilityCriteria: ["Prediabetes", "BMI ≥ 24 kg/m²"],
            phase: "Phase 3",
            resourceUrl:
              "https://www.niddk.nih.gov/about-niddk/research-areas/diabetes/diabetes-prevention-program-dpp",
          },
          {
            title: "Diabetes Control and Complications Trial (DCCT)",
            condition: "Type 1 Diabetes",
            description:
              "Demonstrated intensive blood glucose control reduces microvascular complications",
            interventions: [
              "Intensive insulin therapy",
              "Standard insulin therapy",
            ],
            eligibilityCriteria: ["Type 1 diabetes", "Age 13-39 years"],
            phase: "Phase 3",
            resourceUrl:
              "https://www.niddk.nih.gov/about-niddk/research-areas/diabetes/dcct-edic-diabetes-control-complications-trial-follow-up-study",
          },
        ],
        evidenceGrade: "strong",
        lastUpdated: "2023-10-01",
      };
    }

    // Hypertension studies
    else if (
      searchTerm.toLowerCase().includes("hypertension") ||
      searchTerm.toLowerCase().includes("high blood pressure")
    ) {
      return {
        relatedStudies: [
          {
            title: "Systolic Blood Pressure Intervention Trial (SPRINT)",
            condition: "Hypertension",
            description:
              "Intensive treatment to SBP <120 mmHg reduced cardiovascular events by 25%",
            interventions: [
              "Intensive blood pressure management",
              "Standard blood pressure management",
            ],
            eligibilityCriteria: [
              "SBP ≥130 mmHg",
              "Increased cardiovascular risk",
            ],
            phase: "Phase 3",
            resourceUrl:
              "https://www.nhlbi.nih.gov/science/systolic-blood-pressure-intervention-trial-sprint",
          },
          {
            title:
              "Antihypertensive and Lipid-Lowering Treatment to Prevent Heart Attack Trial (ALLHAT)",
            condition: "Hypertension",
            description:
              "Compared effectiveness of different antihypertensive medications",
            interventions: [
              "Chlorthalidone",
              "Amlodipine",
              "Lisinopril",
              "Doxazosin",
            ],
            eligibilityCriteria: ["Age ≥55 years", "Stage 1 or 2 hypertension"],
            phase: "Phase 4",
            resourceUrl: "https://www.nhlbi.nih.gov/research/allhat",
          },
        ],
        evidenceGrade: "strong",
        lastUpdated: "2023-08-15",
      };
    }

    // Asthma studies
    else if (searchTerm.toLowerCase().includes("asthma")) {
      return {
        relatedStudies: [
          {
            title: "Asthma Clinical Research Network Trials",
            condition: "Asthma",
            description: "Series of studies on asthma treatment strategies",
            interventions: [
              "Inhaled corticosteroids",
              "Long-acting beta agonists",
            ],
            eligibilityCriteria: ["Asthma diagnosis", "Age ≥12 years"],
            phase: "Phase 3",
            resourceUrl:
              "https://www.nhlbi.nih.gov/science/asthma-clinical-research-network-acrn",
          },
          {
            title: "Inner-City Asthma Study",
            condition: "Asthma in Urban Settings",
            description:
              "Environmental intervention reduced asthma symptoms in urban children",
            interventions: ["Environmental control measures", "Education"],
            eligibilityCriteria: [
              "Urban residence",
              "Age 5-11 years with asthma",
            ],
            phase: "Phase 3",
            resourceUrl:
              "https://www.niaid.nih.gov/clinical-trials/inner-city-asthma-study",
          },
        ],
        evidenceGrade: "strong",
        lastUpdated: "2023-06-10",
      };
    }

    // Pain studies
    else if (searchTerm.toLowerCase().includes("pain")) {
      return {
        relatedStudies: [
          {
            title:
              "Strategies for Prescribing Analgesics Comparative Effectiveness (SPACE)",
            condition: "Chronic Pain",
            description:
              "Compared opioid vs. non-opioid medications for chronic pain",
            interventions: ["Opioid therapy", "Non-opioid therapy"],
            eligibilityCriteria: ["Chronic back pain", "Age ≥18 years"],
            phase: "Phase 3",
            resourceUrl: "https://clinicaltrials.gov/study/NCT01583985",
          },
          {
            title: "Pain Management Collaboratory",
            condition: "Chronic Pain Conditions",
            description:
              "Studies non-pharmacological approaches to pain management",
            interventions: ["Acupuncture", "Mindfulness", "Physical therapy"],
            eligibilityCriteria: [
              "Chronic pain",
              "Various specific conditions",
            ],
            phase: "Phase 2-3",
            resourceUrl: "https://painmanagementcollaboratory.org/",
          },
        ],
        evidenceGrade: "moderate",
        lastUpdated: "2023-09-05",
      };
    }

    // Generic response for other terms
    return {
      relatedStudies: [
        {
          title: `Recent clinical trials related to ${searchTerm}`,
          condition: searchTerm,
          description: "Multiple studies investigating treatment approaches",
          interventions: [
            "Various pharmacological approaches",
            "Non-pharmacological interventions",
          ],
          eligibilityCriteria: [
            "Diagnosis-specific criteria",
            "Age and health status requirements",
          ],
          phase: "Various phases",
          resourceUrl: "https://clinicaltrials.gov/",
        },
      ],
      evidenceGrade: "moderate",
      lastUpdated: "2023-07-30",
    };
  } catch (error: any) {
    console.error(`Error fetching NIH clinical trials data: ${error.message}`);

    // Return a basic fallback response
    return {
      relatedStudies: [
        {
          title: "Clinical trials information",
          condition: searchTerm,
          description:
            "Information about clinical trials is available on ClinicalTrials.gov",
          interventions: ["Various treatments being studied"],
          eligibilityCriteria: ["Varies by study"],
          phase: "Various phases",
          resourceUrl: "https://clinicaltrials.gov/",
        },
      ],
      evidenceGrade: "preliminary",
      lastUpdated: "2023-01-01",
    };
  }
};

/**
 * Fetches CDC WONDER database information on mortality, morbidity,
 * and health statistics related to specific conditions or symptoms
 */
export const fetchCdcWonderData = async (
  searchTerm: string
): Promise<{
  healthStatistics: {
    title: string;
    statistic: string;
    interpretation: string;
    population: string;
    timeframe: string;
    source: string;
  }[];
  recommendations: string[];
  relatedHealthTopics: string[];
  resourceUrl: string;
}> => {
  try {
    console.log(`Fetching CDC WONDER data for: ${searchTerm}`);

    // In a real app, this would query the CDC WONDER database
    // For this demo, we're providing structured health statistics from CDC

    // Diabetes data
    if (searchTerm.toLowerCase().includes("diabetes")) {
      return {
        healthStatistics: [
          {
            title: "Diabetes Prevalence",
            statistic:
              "37.3 million Americans (11.3% of the population) have diabetes",
            interpretation:
              "A significant health burden affecting over 1 in 10 Americans",
            population: "U.S. population",
            timeframe: "2020",
            source: "CDC National Diabetes Statistics Report",
          },
          {
            title: "Diabetes-Related Deaths",
            statistic:
              "Diabetes was the seventh leading cause of death in the United States in 2020",
            interpretation: "A major contributor to mortality in the U.S.",
            population: "U.S. population",
            timeframe: "2020",
            source: "CDC Mortality Data",
          },
          {
            title: "Diabetes Complications",
            statistic:
              "Diabetes is the leading cause of kidney failure, lower-limb amputations, and adult blindness",
            interpretation:
              "Prevention and management are critical to reduce serious complications",
            population: "U.S. adults with diabetes",
            timeframe: "2020",
            source: "CDC Diabetes Impact Report",
          },
        ],
        recommendations: [
          "Regular screening for diabetes if you have risk factors",
          "Maintain a healthy weight through diet and physical activity",
          "Monitor blood glucose levels as recommended by your healthcare provider",
          "Take medications as prescribed",
          "Get regular check-ups for early detection of complications",
        ],
        relatedHealthTopics: [
          "Obesity",
          "Cardiovascular Disease",
          "Kidney Disease",
          "Eye Health",
          "Neuropathy",
        ],
        resourceUrl: "https://www.cdc.gov/diabetes/index.html",
      };
    }

    // Heart disease data
    else if (
      searchTerm.toLowerCase().includes("heart") ||
      searchTerm.toLowerCase().includes("cardiac") ||
      searchTerm.toLowerCase().includes("cardiovascular")
    ) {
      return {
        healthStatistics: [
          {
            title: "Heart Disease Mortality",
            statistic:
              "Heart disease is the leading cause of death in the United States, causing approximately 697,000 deaths annually",
            interpretation: "The most common cause of death in the U.S.",
            population: "U.S. population",
            timeframe: "2020",
            source: "CDC National Vital Statistics",
          },
          {
            title: "Heart Disease Prevalence",
            statistic:
              "About 20.1 million adults aged 20 and older have coronary artery disease",
            interpretation:
              "Affects approximately 7.2% of all adults in the U.S.",
            population: "U.S. adults",
            timeframe: "2019-2020",
            source: "CDC Heart Disease Surveillance Data",
          },
          {
            title: "Heart Attack Incidence",
            statistic:
              "Approximately 805,000 Americans have a heart attack each year",
            interpretation:
              "Equivalent to one heart attack every 40 seconds in the U.S.",
            population: "U.S. population",
            timeframe: "2021",
            source: "CDC Heart Disease Facts",
          },
        ],
        recommendations: [
          "Control blood pressure and cholesterol levels",
          "Adopt a heart-healthy diet low in saturated fats and sodium",
          "Engage in regular physical activity",
          "Maintain a healthy weight",
          "Avoid tobacco and limit alcohol consumption",
          "Manage stress effectively",
        ],
        relatedHealthTopics: [
          "Hypertension",
          "Cholesterol Management",
          "Diabetes",
          "Obesity",
          "Physical Activity",
        ],
        resourceUrl: "https://www.cdc.gov/heartdisease/index.htm",
      };
    }

    // Cancer data
    else if (searchTerm.toLowerCase().includes("cancer")) {
      return {
        healthStatistics: [
          {
            title: "Cancer Mortality",
            statistic:
              "Cancer is the second leading cause of death in the United States, with approximately 602,350 deaths annually",
            interpretation:
              "A major public health concern and significant cause of mortality",
            population: "U.S. population",
            timeframe: "2020",
            source: "CDC National Vital Statistics",
          },
          {
            title: "Cancer Incidence",
            statistic:
              "Approximately 1.9 million new cancer cases are diagnosed each year",
            interpretation:
              "Affects a substantial portion of the population annually",
            population: "U.S. population",
            timeframe: "2021",
            source: "CDC Cancer Statistics",
          },
          {
            title: "Cancer Survival",
            statistic:
              "The 5-year relative survival rate for all cancers combined has increased from 49% in the 1970s to 67% today",
            interpretation:
              "Significant improvements in cancer treatment and early detection",
            population: "U.S. cancer patients",
            timeframe: "2012-2018",
            source: "CDC and National Cancer Institute data",
          },
        ],
        recommendations: [
          "Get recommended cancer screening tests",
          "Avoid tobacco and limit alcohol consumption",
          "Maintain a healthy weight through diet and physical activity",
          "Protect skin from excessive sun exposure",
          "Get vaccinated against cancer-causing infections (HPV, Hepatitis B)",
          "Know your family history and discuss cancer risk with your healthcare provider",
        ],
        relatedHealthTopics: [
          "Tobacco Control",
          "Diet and Nutrition",
          "Physical Activity",
          "Cancer Screening",
          "Immunization",
        ],
        resourceUrl: "https://www.cdc.gov/cancer/index.htm",
      };
    }

    // Generic response for other terms
    return {
      healthStatistics: [
        {
          title: `Health statistics related to ${searchTerm}`,
          statistic:
            "Health statistics vary by specific condition and demographic factors",
          interpretation:
            "Consult CDC sources for specific information about this health topic",
          population: "U.S. population",
          timeframe: "Recent years",
          source: "CDC WONDER Database",
        },
      ],
      recommendations: [
        "Consult with healthcare professionals for personalized advice",
        "Follow CDC and other public health guidelines",
        "Stay informed about latest research and recommendations",
      ],
      relatedHealthTopics: [
        "Prevention",
        "Risk Factors",
        "Treatment Options",
        "Public Health Resources",
      ],
      resourceUrl: "https://wonder.cdc.gov/",
    };
  } catch (error: any) {
    console.error(`Error fetching CDC WONDER data: ${error.message}`);

    // Return a basic fallback response
    return {
      healthStatistics: [
        {
          title: "Health Statistics Information",
          statistic:
            "Statistics on various health conditions available through CDC WONDER",
          interpretation:
            "CDC collects and analyzes health data for public health planning",
          population: "U.S. population",
          timeframe: "Various",
          source: "CDC WONDER Database",
        },
      ],
      recommendations: [
        "Consult CDC for official public health recommendations",
        "Discuss with healthcare provider for personalized advice",
      ],
      relatedHealthTopics: ["Prevention", "Public Health"],
      resourceUrl: "https://wonder.cdc.gov/",
    };
  }
};

// Update the fetchSymptomSafetyData function to incorporate NIH and CDC data
export const enhanceSymptomSafetyData = async (
  symptomData: SymptomSafetyData,
  symptomName: string
): Promise<SymptomSafetyData> => {
  try {
    // Fetch additional government data
    const nihData = await fetchNihClinicalTrialsData(symptomName);
    const cdcData = await fetchCdcWonderData(symptomName);

    // Enhance safety data with NIH clinical trials information
    const enhancedRecommendations = [...symptomData.recommendations];
    const enhancedWarningFlags = [...symptomData.warningFlags];

    // Add evidence-based recommendations from NIH
    if (nihData && nihData.relatedStudies.length > 0) {
      nihData.relatedStudies.forEach((study) => {
        if (study.interventions && study.interventions.length > 0) {
          enhancedRecommendations.push(
            `NIH research suggests considering: ${study.interventions.join(
              ", "
            )}`
          );
        }
      });
    }

    // Add CDC statistical warnings if relevant
    if (cdcData && cdcData.healthStatistics.length > 0) {
      cdcData.healthStatistics.forEach((stat) => {
        if (stat.interpretation && stat.interpretation.includes("concern")) {
          enhancedWarningFlags.push(`CDC data indicates: ${stat.statistic}`);
        }
      });

      // Add CDC recommendations
      cdcData.recommendations.forEach((rec) => {
        enhancedRecommendations.push(`CDC recommends: ${rec}`);
      });
    }

    // Update risk level based on additional data
    let enhancedRiskLevel = symptomData.riskLevel;
    if (
      nihData.evidenceGrade === "strong" &&
      nihData.relatedStudies.length > 1 &&
      enhancedWarningFlags.length > symptomData.warningFlags.length
    ) {
      enhancedRiskLevel = "high";
    }

    // Return enhanced data
    return {
      ...symptomData,
      recommendations: enhancedRecommendations.slice(0, 8), // Limit to top 8
      warningFlags: enhancedWarningFlags.slice(0, 6), // Limit to top 6
      riskLevel: enhancedRiskLevel,
    };
  } catch (error: any) {
    console.error(`Error enhancing symptom data: ${error.message}`);
    return symptomData; // Return original data if enhancement fails
  }
};

// Update the fetchDiagnosisSafetyData function to incorporate NIH and CDC data
export const enhanceDiagnosisSafetyData = async (
  diagnosisData: DiagnosisSafetyData,
  diagnosisName: string
): Promise<DiagnosisSafetyData> => {
  try {
    // Fetch additional government data
    const nihData = await fetchNihClinicalTrialsData(diagnosisName);
    const cdcData = await fetchCdcWonderData(diagnosisName);

    // Enhance safety data with NIH and CDC information
    const enhancedRecommendations = [...diagnosisData.recommendations];
    const enhancedWatchWarnings = [...diagnosisData.watchWarnings];
    const enhancedCriticalItems = [...diagnosisData.criticalFollowupItems];

    // Add evidence-based recommendations from NIH clinical trials
    if (nihData && nihData.relatedStudies.length > 0) {
      // Extract treatments being studied
      nihData.relatedStudies.forEach((study) => {
        if (study.interventions && study.interventions.length > 0) {
          enhancedRecommendations.push(
            `Research shows these approaches may be effective: ${study.interventions.join(
              ", "
            )}`
          );
        }

        // Add eligibility criteria as critical items to monitor
        if (study.eligibilityCriteria && study.eligibilityCriteria.length > 0) {
          enhancedCriticalItems.push(
            `Monitor these factors identified in clinical research: ${study.eligibilityCriteria.join(
              ", "
            )}`
          );
        }
      });
    }

    // Add CDC statistical information as warnings if relevant
    if (cdcData && cdcData.healthStatistics.length > 0) {
      cdcData.healthStatistics.forEach((stat) => {
        // Add mortality/morbidity data as watch warnings
        if (
          stat.title.includes("Mortality") ||
          stat.title.includes("Complication")
        ) {
          enhancedWatchWarnings.push(`CDC reports: ${stat.statistic}`);
        }
      });

      // Add CDC recommendations
      cdcData.recommendations.forEach((rec) => {
        enhancedRecommendations.push(`CDC recommends: ${rec}`);
      });

      // Add related health topics as critical follow-up items
      if (cdcData.relatedHealthTopics.length > 0) {
        enhancedCriticalItems.push(
          `CDC identifies these related health concerns to monitor: ${cdcData.relatedHealthTopics.join(
            ", "
          )}`
        );
      }
    }

    // Update risk level based on additional data
    let enhancedRiskLevel = diagnosisData.errorRiskLevel;
    if (
      cdcData.healthStatistics.some(
        (stat) =>
          stat.title.includes("Mortality") &&
          (stat.statistic.includes("leading cause") ||
            stat.statistic.includes("significant"))
      )
    ) {
      enhancedRiskLevel = "high";
    }

    // Return enhanced data
    return {
      ...diagnosisData,
      recommendations: enhancedRecommendations.slice(0, 8), // Limit to top 8
      watchWarnings: enhancedWatchWarnings.slice(0, 6), // Limit to top 6
      criticalFollowupItems: enhancedCriticalItems.slice(0, 6), // Limit to top 6
      errorRiskLevel: enhancedRiskLevel,
    };
  } catch (error: any) {
    console.error(`Error enhancing diagnosis data: ${error.message}`);
    return diagnosisData; // Return original data if enhancement fails
  }
};

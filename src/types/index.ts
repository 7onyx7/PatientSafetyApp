export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  notes?: string;
}

export interface Symptom {
  id: string;
  name: string;
  severity: number; // 1-10
  dateRecorded: string;
  notes?: string;
}

export interface Diagnosis {
  id: string;
  name: string;
  diagnosedDate: string;
  diagnosedBy: string;
  notes?: string;
}

export interface MedicalHistory {
  id: string;
  type: 'surgery' | 'illness' | 'injury' | 'other';
  name: string;
  date: string;
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  allergies: string[];
  medications: Medication[];
  symptoms: Symptom[];
  diagnoses: Diagnosis[];
  medicalHistory: MedicalHistory[];
}

export interface MedicationInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  simplifiedExplanation: string; // Simple explanation for laypeople
  possibleEffects: string[]; // Potential effects that may occur
  recommendations: string[]; // Simple recommendations for the patient
}

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Medications: undefined;
  AddMedication: undefined;
  MedicationDetail: { medicationId: string };
  Symptoms: undefined;
  AddSymptom: undefined;
  Diagnoses: undefined;
  AddDiagnosis: undefined;
  MedicalHistory: undefined;
  AddMedicalHistory: undefined;
  Analysis: undefined;
}; 
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePatient } from "../contexts/PatientContext";
import Input from "../components/Input";
import Button from "../components/Button";
import Card from "../components/Card";

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { patient, initializePatient, updatePatient, loading } = usePatient();

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patient) {
      setName(patient.name);
      setDateOfBirth(patient.dateOfBirth);
      setGender(patient.gender);
    }
  }, [patient]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      // Basic date validation (MM/DD/YYYY)
      const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
      if (!dateRegex.test(dateOfBirth)) {
        newErrors.dateOfBirth = "Please use MM/DD/YYYY format";
      }
    }

    if (!gender.trim()) {
      newErrors.gender = "Gender is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (patient) {
        // Update existing patient
        await updatePatient({
          name,
          dateOfBirth,
          gender,
        });
      } else {
        // Create new patient
        await initializePatient({
          name,
          dateOfBirth,
          gender,
          allergies: [],
          medications: [],
          symptoms: [],
          diagnoses: [],
          medicalHistory: [],
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;

    try {
      if (patient) {
        const updatedAllergies = [...patient.allergies, newAllergy];
        await updatePatient({ allergies: updatedAllergies });
        setNewAllergy("");
      }
    } catch (error) {
      console.error("Error adding allergy:", error);
    }
  };

  const handleRemoveAllergy = async (allergy: string) => {
    try {
      if (patient) {
        const updatedAllergies = patient.allergies.filter((a) => a !== allergy);
        await updatePatient({ allergies: updatedAllergies });
      }
    } catch (error) {
      console.error("Error removing allergy:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your personal information</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            error={errors.name}
            inputStyle={styles.inputStyle}
            labelStyle={styles.labelStyle}
          />
          <Input
            label="Date of Birth"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="MM/DD/YYYY"
            error={errors.dateOfBirth}
            inputStyle={styles.inputStyle}
            labelStyle={styles.labelStyle}
          />
          <Input
            label="Gender"
            value={gender}
            onChangeText={setGender}
            placeholder="Enter your gender"
            error={errors.gender}
            inputStyle={styles.inputStyle}
            labelStyle={styles.labelStyle}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          <View style={styles.allergiesContainer}>
            {patient?.allergies.length === 0 && (
              <Text style={styles.emptyText}>No allergies added yet</Text>
            )}

            {patient?.allergies.map((allergy, index) => (
              <View key={index} style={styles.allergyItem}>
                <Text style={styles.allergyText}>{allergy}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveAllergy(allergy)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addAllergyContainer}>
            <Input
              value={newAllergy}
              onChangeText={setNewAllergy}
              placeholder="Add a new allergy"
              style={styles.allergyInput}
              inputStyle={styles.inputStyle}
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                !newAllergy.trim() && styles.disabledButton,
              ]}
              onPress={handleAddAllergy}
              disabled={!newAllergy.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <Button
            title="Save Profile"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
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
  sectionContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#1a2151",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "white",
  },
  allergiesContainer: {
    marginBottom: 16,
  },
  emptyText: {
    color: "white",
    fontStyle: "italic",
    padding: 10,
    textAlign: "center",
  },
  allergyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  allergyText: {
    fontSize: 16,
    color: "white",
  },
  removeButton: {
    backgroundColor: "rgba(229, 57, 53, 0.1)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(229, 57, 53, 0.3)",
  },
  removeButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  addAllergyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  allergyInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  addButton: {
    backgroundColor: "#4a80f5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#4a80f5",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginVertical: 20,
    marginBottom: 40,
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
  inputStyle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    color: "white",
  },
  labelStyle: {
    color: "#dbdbdb",
  },
  buttonsContainer: {
    alignItems: "center",
  },
});

export default ProfileScreen;

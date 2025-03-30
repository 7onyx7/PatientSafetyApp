import * as React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PatientProvider } from "./src/contexts/PatientContext";
import Navigation from "./src/navigation";
import { View, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PatientProvider>
          <Navigation />
          <StatusBar style="light" />
        </PatientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

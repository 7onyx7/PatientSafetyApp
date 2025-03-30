import axios from 'axios';
import { MedicationInteraction } from '../types';

const BASE_URL = 'https://api.fda.gov/drug';
const API_KEY = process.env.API_KEY || '';

interface DrugLabelResponse {
  results: Array<{
    openfda: {
      brand_name: string[];
      generic_name: string[];
      substance_name?: string[];
      manufacturer_name?: string[];
    };
    warnings?: string[];
    warnings_and_cautions?: string[];
    drug_interactions?: string[];
    contraindications?: string[];
    adverse_reactions?: string[];
    dosage_and_administration?: string[];
  }>;
}

interface DrugInteractionResponse {
  results: Array<{
    drug_interactions: string[];
  }>;
}

export const searchMedication = async (query: string) => {
  try {
    const response = await axios.get<DrugLabelResponse>(
      `${BASE_URL}/label.json?search=${encodeURIComponent(query)}&limit=5&api_key=${API_KEY}`
    );
    return response.data.results;
  } catch (error) {
    console.error('Error searching medication:', error);
    throw new Error('Failed to search medication');
  }
};

export const getMedicationDetails = async (brandName: string) => {
  try {
    const response = await axios.get<DrugLabelResponse>(
      `${BASE_URL}/label.json?search=openfda.brand_name:"${encodeURIComponent(brandName)}"&limit=1&api_key=${API_KEY}`
    );
    return response.data.results[0];
  } catch (error) {
    console.error('Error getting medication details:', error);
    throw new Error('Failed to get medication details');
  }
};

export const checkMedicationInteractions = async (medications: string[]): Promise<MedicationInteraction[]> => {
  const interactions: MedicationInteraction[] = [];
  
  try {
    // For each pair of medications, check for interactions
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const drug1 = medications[i];
        const drug2 = medications[j];
        
        // First, try to find interactions where drug1 mentions drug2
        let response = await axios.get<DrugInteractionResponse>(
          `${BASE_URL}/label.json?search=drug_interactions:"${encodeURIComponent(drug2)}"AND+openfda.brand_name:"${encodeURIComponent(drug1)}"&limit=1&api_key=${API_KEY}`
        );
        
        // If no results, check if drug2 mentions drug1
        if (!response.data.results || response.data.results.length === 0) {
          response = await axios.get<DrugInteractionResponse>(
            `${BASE_URL}/label.json?search=drug_interactions:"${encodeURIComponent(drug1)}"AND+openfda.brand_name:"${encodeURIComponent(drug2)}"&limit=1&api_key=${API_KEY}`
          );
        }
        
        if (response.data.results && response.data.results.length > 0 && response.data.results[0].drug_interactions) {
          // Found an interaction
          const description = response.data.results[0].drug_interactions.join(' ');
          
          // Parse the FDA description to extract specific health issues
          const severity = determineSeverity(description);
          const { simplifiedExplanation, possibleEffects, recommendations } = extractSpecificHealthIssues(
            drug1, 
            drug2, 
            severity, 
            description
          );
          
          interactions.push({
            drug1,
            drug2,
            severity,
            description,
            simplifiedExplanation,
            possibleEffects,
            recommendations
          });
        }
      }
    }
    
    return interactions;
  } catch (error) {
    console.error('Error checking medication interactions:', error);
    throw new Error('Failed to check medication interactions');
  }
};

// Helper function to determine severity based on the interaction description
const determineSeverity = (description: string): 'minor' | 'moderate' | 'major' => {
  const lowercaseDesc = description.toLowerCase();
  
  if (
    lowercaseDesc.includes('fatal') || 
    lowercaseDesc.includes('severe') || 
    lowercaseDesc.includes('dangerous') ||
    lowercaseDesc.includes('life-threatening') ||
    lowercaseDesc.includes('contraindicated') ||
    lowercaseDesc.includes('serious') ||
    lowercaseDesc.includes('death') ||
    lowercaseDesc.includes('hemorrhage')
  ) {
    return 'major';
  } else if (
    lowercaseDesc.includes('caution') ||
    lowercaseDesc.includes('monitor') ||
    lowercaseDesc.includes('adjust') ||
    lowercaseDesc.includes('may increase') ||
    lowercaseDesc.includes('may decrease') ||
    lowercaseDesc.includes('bleeding')
  ) {
    return 'moderate';
  } else {
    return 'minor';
  }
};

// Extract specific health issues from the FDA description
const extractSpecificHealthIssues = (
  drug1: string, 
  drug2: string, 
  severity: 'minor' | 'moderate' | 'major', 
  description: string
): { 
  simplifiedExplanation: string; 
  possibleEffects: string[]; 
  recommendations: string[] 
} => {
  const lowercaseDesc = description.toLowerCase();
  let simplifiedExplanation = '';
  let possibleEffects: string[] = [];
  let recommendations: string[] = [];
  
  // Common health issue keywords to look for in FDA text
  const healthIssueKeywords = [
    { term: 'bleeding', issue: 'Increased risk of bleeding or hemorrhage' },
    { term: 'hemorrhage', issue: 'Increased risk of severe bleeding or hemorrhage' },
    { term: 'gastrointestinal bleeding', issue: 'Increased risk of stomach or intestinal bleeding' },
    { term: 'stomach bleeding', issue: 'Increased risk of stomach bleeding or ulcers' },
    { term: 'blood pressure', issue: 'Changes in blood pressure (may be higher or lower)' },
    { term: 'heart rate', issue: 'Changes in heart rate or rhythm' },
    { term: 'kidney', issue: 'Potential kidney function problems' },
    { term: 'liver', issue: 'Potential liver function problems or damage' },
    { term: 'serotonin syndrome', issue: 'Risk of serotonin syndrome (confusion, rapid heart rate, fever)' },
    { term: 'respiratory', issue: 'Breathing difficulties or respiratory depression' },
    { term: 'seizure', issue: 'Increased risk of seizures' },
    { term: 'thrombosis', issue: 'Increased risk of blood clots' },
    { term: 'effectiveness', issue: 'Reduced effectiveness of one or both medications' },
    { term: 'absorption', issue: 'Changes in how the medication is absorbed by your body' },
    { term: 'qt prolongation', issue: 'Risk of abnormal heart rhythms (QT prolongation)' },
    { term: 'arrhythmia', issue: 'Risk of irregular heartbeat (arrhythmia)' },
    { term: 'hypotension', issue: 'Risk of low blood pressure (hypotension)' },
    { term: 'hypertension', issue: 'Risk of high blood pressure (hypertension)' },
    { term: 'central nervous system', issue: 'Increased central nervous system side effects' },
    { term: 'toxicity', issue: 'Increased risk of medication toxicity or poisoning' },
  ];
  
  // Extract health issues based on keywords in the FDA description
  const foundHealthIssues = healthIssueKeywords
    .filter(({ term }) => lowercaseDesc.includes(term))
    .map(({ issue }) => issue);
  
  // If no specific health issues were found, fallback to general statements based on severity
  if (foundHealthIssues.length === 0) {
    possibleEffects = extractSentences(description, 3);
    
    // If we couldn't extract sentences, use fallback statements
    if (possibleEffects.length === 0) {
      if (severity === 'major') {
        possibleEffects = ['Serious potential health risks - see full description for details'];
      } else if (severity === 'moderate') {
        possibleEffects = ['Moderate health concerns may occur - see full description for details'];
      } else {
        possibleEffects = ['Minor side effects may occur - see full description for details'];
      }
    }
  } else {
    possibleEffects = foundHealthIssues;
  }
  
  // Generate a simple explanation based on actual FDA data
  simplifiedExplanation = `Taking ${drug1} together with ${drug2} requires attention.`;
  
  // Extract recommendations from FDA description or generate based on severity
  const recommendationSentences = extractRecommendations(description);
  recommendations = recommendationSentences.length > 0 ? recommendationSentences : getDefaultRecommendations(severity);
  
  return { simplifiedExplanation, possibleEffects, recommendations };
};

// Helper to extract sentences containing health effects from the description
const extractSentences = (text: string, maxSentences: number): string[] => {
  // Simple sentence splitter (not perfect but good enough for this purpose)
  const sentences = text.split(/[.!?][\s\n]+/).filter(s => s.trim().length > 0);
  
  // Return up to maxSentences number of sentences, slightly cleaned up
  return sentences
    .slice(0, maxSentences)
    .map(s => s.trim())
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .map(s => s.endsWith('.') ? s : s + '.');
};

// Helper to extract recommendation sentences
const extractRecommendations = (text: string): string[] => {
  const lowercaseText = text.toLowerCase();
  const recommendationKeywords = ['recommend', 'should', 'must', 'advised', 'advised to', 'monitor', 'avoid'];
  
  // Simple sentence splitter
  const sentences = text.split(/[.!?][\s\n]+/).filter(s => s.trim().length > 0);
  
  // Find sentences that contain recommendation keywords
  return sentences
    .filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return recommendationKeywords.some(keyword => lowerSentence.includes(keyword));
    })
    .map(s => s.trim())
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .map(s => s.endsWith('.') ? s : s + '.')
    .slice(0, 4); // Limit to 4 recommendations
};

// Default recommendations based on severity
const getDefaultRecommendations = (severity: 'minor' | 'moderate' | 'major'): string[] => {
  switch (severity) {
    case 'major':
      return [
        'Contact your doctor immediately before taking your next dose.',
        'Do not stop either medication without medical advice.',
        'If you experience any unusual symptoms, seek medical help right away.',
        'Always inform all healthcare providers about all medications you take.'
      ];
    case 'moderate':
      return [
        'Discuss this combination with your doctor or pharmacist.',
        'Watch for any new or unusual symptoms.',
        'Your doctor may want to monitor your health more closely.',
        'Do not change how you take either medication without medical advice.'
      ];
    case 'minor':
      return [
        'Be aware of any changes in how you feel.',
        'Take medications as prescribed.',
        'Mention this combination at your next doctor visit.',
        'Continue normal monitoring of your health.'
      ];
  }
};
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, RadioButton, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

// Validation schema for onboarding form
const onboardingSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  age: z.number().min(13, 'Must be at least 13 years old').max(120, 'Invalid age'),
  gender: z.string().min(1, 'Please select your gender'),
  height_cm: z.number().min(50, 'Invalid height').max(300, 'Invalid height'),
  weight_kg: z.number().min(20, 'Invalid weight').max(500, 'Invalid weight'),
  primary_goal: z.string().min(1, 'Please select your primary goal'),
  target_weight_kg: z.number().min(20, 'Invalid target weight').max(500, 'Invalid target weight').optional(),
  activity_level: z.string().min(1, 'Please select your activity level'),
  dietary_restrictions: z.array(z.string()).optional(),
  food_allergies: z.array(z.string()).optional(),
  preferred_units: z.string().default('metric'),
  fitness_experience: z.string().min(1, 'Please select your fitness experience'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

import { API_CONFIG } from '../../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export default function OnboardingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<string[]>([]);
  const [selectedFoodAllergies, setSelectedFoodAllergies] = useState<string[]>([]);
  const navigation = useNavigation();
  const { setOnboardingCompleted } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      preferred_units: 'metric',
      dietary_restrictions: [],
      food_allergies: [],
    },
  });

  const watchedValues = watch();

  // Dropdown options
  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer_not_to_say' },
  ];

  const primaryGoalOptions = [
    { label: 'Weight Loss', value: 'weight_loss' },
    { label: 'Muscle Gain', value: 'muscle_gain' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Athletic Performance', value: 'athletic_performance' },
  ];

  const activityLevelOptions = [
    { label: 'Sedentary (little/no exercise)', value: 'sedentary' },
    { label: 'Lightly Active (light exercise 1-3 days/week)', value: 'lightly_active' },
    { label: 'Moderately Active (moderate exercise 3-5 days/week)', value: 'moderately_active' },
    { label: 'Very Active (hard exercise 6-7 days/week)', value: 'very_active' },
    { label: 'Extremely Active (very hard exercise, physical job)', value: 'extremely_active' },
  ];

  const fitnessExperienceOptions = [
    { label: 'Beginner (0-6 months)', value: 'beginner' },
    { label: 'Intermediate (6 months - 2 years)', value: 'intermediate' },
    { label: 'Advanced (2+ years)', value: 'advanced' },
  ];

  const dietaryRestrictionsOptions = [
    'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'paleo', 
    'low_carb', 'low_fat', 'mediterranean', 'pescatarian', 'halal', 'kosher'
  ];

  const foodAllergiesOptions = [
    'nuts', 'peanuts', 'shellfish', 'fish', 'eggs', 'milk', 'soy', 'wheat',
    'sesame', 'mustard', 'celery', 'lupin', 'molluscs', 'sulphites'
  ];

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    try {
      console.log('mobile/src/screens/auth/OnboardingScreen.tsx: Submitting onboarding data');
      
      // Add selected dietary restrictions and food allergies
      data.dietary_restrictions = selectedDietaryRestrictions;
      data.food_allergies = selectedFoodAllergies;
      
      // Check if using mock auth - force mock in development
      const USE_MOCK_AUTH = __DEV__;
      
      if (USE_MOCK_AUTH) {
        // Mock onboarding for development
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('mobile/src/screens/auth/OnboardingScreen.tsx: Mock onboarding completed successfully');
        setOnboardingCompleted(true);
        Alert.alert('Welcome to MacroLens!', 'Your profile has been set up successfully.');
        return;
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/users/me/profile/complete-onboarding`, data);
      
      console.log('mobile/src/screens/auth/OnboardingScreen.tsx: Onboarding completed successfully');
      setOnboardingCompleted(true);
      Alert.alert('Welcome to MacroLens!', 'Your profile has been set up successfully.');
      
    } catch (error: any) {
      console.error('mobile/src/screens/auth/OnboardingScreen.tsx: Onboarding error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof OnboardingFormData)[] => {
    switch (step) {
      case 0:
        return ['full_name', 'age', 'gender'];
      case 1:
        return ['height_cm', 'weight_kg', 'preferred_units'];
      case 2:
        return ['primary_goal', 'target_weight_kg', 'activity_level'];
      case 3:
        return ['fitness_experience'];
      case 4:
        return [];
      default:
        return [];
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setSelectedDietaryRestrictions(prev => 
      prev.includes(restriction) 
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const toggleFoodAllergy = (allergy: string) => {
    setSelectedFoodAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfoStep();
      case 1:
        return renderPhysicalStatsStep();
      case 2:
        return renderFitnessGoalsStep();
      case 3:
        return renderExperienceStep();
      case 4:
        return renderDietaryPreferencesStep();
      default:
        return renderBasicInfoStep();
    }
  };

  const renderBasicInfoStep = () => (
    <View style={styles.stepContainer}>
      <Title style={styles.stepTitle}>Tell us about yourself</Title>
      <Paragraph style={styles.stepDescription}>
        We'll use this information to personalize your experience
      </Paragraph>

      <Controller
        control={control}
        name="full_name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Full Name"
            mode="outlined"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.full_name}
            style={styles.input}
          />
        )}
      />
      {errors.full_name && (
        <Text style={styles.errorText}>{errors.full_name.message}</Text>
      )}

      <Controller
        control={control}
        name="age"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Age"
            mode="outlined"
            value={value?.toString() || ''}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
            error={!!errors.age}
            keyboardType="numeric"
            style={styles.input}
          />
        )}
      />
      {errors.age && (
        <Text style={styles.errorText}>{errors.age.message}</Text>
      )}

      <Text style={styles.pickerLabel}>Gender</Text>
      <View style={styles.pickerContainer}>
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={styles.picker}
            >
              <Picker.Item label="Select gender..." value="" />
              {genderOptions.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          )}
        />
      </View>
      {errors.gender && (
        <Text style={styles.errorText}>{errors.gender.message}</Text>
      )}
    </View>
  );

  const renderPhysicalStatsStep = () => (
    <View style={styles.stepContainer}>
      <Title style={styles.stepTitle}>Your Physical Stats</Title>
      <Paragraph style={styles.stepDescription}>
        This helps us calculate your nutritional needs
      </Paragraph>

      <View style={styles.unitsContainer}>
        <Controller
          control={control}
          name="preferred_units"
          render={({ field: { onChange, value } }) => (
            <RadioButton.Group onValueChange={onChange} value={value}>
              <View style={styles.radioContainer}>
                <RadioButton.Item label="Metric (kg, cm)" value="metric" />
                <RadioButton.Item label="Imperial (lbs, ft)" value="imperial" />
              </View>
            </RadioButton.Group>
          )}
        />
      </View>

      <Controller
        control={control}
        name="height_cm"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={watchedValues.preferred_units === 'metric' ? 'Height (cm)' : 'Height (inches)'}
            mode="outlined"
            value={value?.toString() || ''}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
            error={!!errors.height_cm}
            keyboardType="numeric"
            style={styles.input}
          />
        )}
      />
      {errors.height_cm && (
        <Text style={styles.errorText}>{errors.height_cm.message}</Text>
      )}

      <Controller
        control={control}
        name="weight_kg"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={watchedValues.preferred_units === 'metric' ? 'Weight (kg)' : 'Weight (lbs)'}
            mode="outlined"
            value={value?.toString() || ''}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
            error={!!errors.weight_kg}
            keyboardType="numeric"
            style={styles.input}
          />
        )}
      />
      {errors.weight_kg && (
        <Text style={styles.errorText}>{errors.weight_kg.message}</Text>
      )}
    </View>
  );

  const renderFitnessGoalsStep = () => (
    <View style={styles.stepContainer}>
      <Title style={styles.stepTitle}>Your Fitness Goals</Title>
      <Paragraph style={styles.stepDescription}>
        What are you looking to achieve?
      </Paragraph>

      <Text style={styles.pickerLabel}>Primary Goal</Text>
      <View style={styles.pickerContainer}>
        <Controller
          control={control}
          name="primary_goal"
          render={({ field: { onChange, value } }) => (
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={styles.picker}
            >
              <Picker.Item label="Select your primary goal..." value="" />
              {primaryGoalOptions.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          )}
        />
      </View>
      {errors.primary_goal && (
        <Text style={styles.errorText}>{errors.primary_goal.message}</Text>
      )}

      <Controller
        control={control}
        name="target_weight_kg"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={watchedValues.preferred_units === 'metric' ? 'Target Weight (kg) - Optional' : 'Target Weight (lbs) - Optional'}
            mode="outlined"
            value={value?.toString() || ''}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
            error={!!errors.target_weight_kg}
            keyboardType="numeric"
            style={styles.input}
          />
        )}
      />
      {errors.target_weight_kg && (
        <Text style={styles.errorText}>{errors.target_weight_kg.message}</Text>
      )}

      <Text style={styles.pickerLabel}>Activity Level</Text>
      <View style={styles.pickerContainer}>
        <Controller
          control={control}
          name="activity_level"
          render={({ field: { onChange, value } }) => (
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={styles.picker}
            >
              <Picker.Item label="Select your activity level..." value="" />
              {activityLevelOptions.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          )}
        />
      </View>
      {errors.activity_level && (
        <Text style={styles.errorText}>{errors.activity_level.message}</Text>
      )}
    </View>
  );

  const renderExperienceStep = () => (
    <View style={styles.stepContainer}>
      <Title style={styles.stepTitle}>Your Fitness Experience</Title>
      <Paragraph style={styles.stepDescription}>
        How experienced are you with fitness and nutrition?
      </Paragraph>

      <Text style={styles.pickerLabel}>Fitness Experience</Text>
      <View style={styles.pickerContainer}>
        <Controller
          control={control}
          name="fitness_experience"
          render={({ field: { onChange, value } }) => (
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={styles.picker}
            >
              <Picker.Item label="Select your experience level..." value="" />
              {fitnessExperienceOptions.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          )}
        />
      </View>
      {errors.fitness_experience && (
        <Text style={styles.errorText}>{errors.fitness_experience.message}</Text>
      )}
    </View>
  );

  const renderDietaryPreferencesStep = () => (
    <View style={styles.stepContainer}>
      <Title style={styles.stepTitle}>Dietary Preferences</Title>
      <Paragraph style={styles.stepDescription}>
        Tell us about your dietary restrictions and food allergies (optional)
      </Paragraph>

      <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
      <View style={styles.chipsContainer}>
        {dietaryRestrictionsOptions.map(restriction => (
          <Chip
            key={restriction}
            selected={selectedDietaryRestrictions.includes(restriction)}
            onPress={() => toggleDietaryRestriction(restriction)}
            style={styles.chip}
          >
            {restriction.replace('_', ' ')}
          </Chip>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Food Allergies</Text>
      <View style={styles.chipsContainer}>
        {foodAllergiesOptions.map(allergy => (
          <Chip
            key={allergy}
            selected={selectedFoodAllergies.includes(allergy)}
            onPress={() => toggleFoodAllergy(allergy)}
            style={styles.chip}
          >
            {allergy}
          </Chip>
        ))}
      </View>
    </View>
  );

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.logo}>MacroLens</Text>
          <Text style={styles.subtitle}>Let's get you set up!</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of {totalSteps}
            </Text>
          </View>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {renderStep()}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <Button
              mode="outlined"
              onPress={prevStep}
              style={styles.button}
            >
              Previous
            </Button>
          )}
          
          {currentStep < totalSteps - 1 ? (
            <Button
              mode="contained"
              onPress={nextStep}
              style={styles.button}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              {isLoading ? 'Completing...' : 'Complete Setup'}
            </Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 14,
  },
  card: {
    marginBottom: 20,
    minHeight: 400,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  unitsContainer: {
    marginBottom: 24,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 4,
  },
}); 
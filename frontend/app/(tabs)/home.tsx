import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const HOME_TEXT_KEY = '@konkurskoll_home_text';

export default function HomeScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [homeText, setHomeText] = useState('');
  const [tempText, setTempText] = useState('');

  useEffect(() => {
    loadHomeText();
  }, []);

  const loadHomeText = async () => {
    try {
      const savedText = await AsyncStorage.getItem(HOME_TEXT_KEY);
      if (savedText !== null) {
        setHomeText(savedText);
        setTempText(savedText);
      } else {
        // Default text
        const defaultText = `Välkommen till Konkurskoll

Detta är din personliga startsida där du kan lägga till egna anteckningar, viktiga påminnelser eller annan information som du vill ha lätt tillgänglig.

Tryck på redigera-knappen för att ändra denna text.`;
        setHomeText(defaultText);
        setTempText(defaultText);
      }
    } catch (error) {
      console.error('Error loading home text:', error);
    }
  };

  const saveHomeText = async () => {
    try {
      await AsyncStorage.setItem(HOME_TEXT_KEY, tempText);
      setHomeText(tempText);
      setIsEditing(false);
      Alert.alert('Sparat', 'Din text har sparats');
    } catch (error) {
      console.error('Error saving home text:', error);
      Alert.alert('Fel', 'Kunde inte spara texten');
    }
  };

  const handleCancel = () => {
    setTempText(homeText);
    setIsEditing(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Hem</Text>
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="create-outline" size={24} color="#2563eb" />
            <Text style={styles.editButtonText}>Redigera</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveHomeText}
            >
              <Text style={styles.saveButtonText}>Spara</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={tempText}
            onChangeText={setTempText}
            multiline
            placeholder="Skriv din text här..."
            placeholderTextColor="#9ca3af"
            autoFocus
            textAlignVertical="top"
          />
        ) : (
          <View style={styles.textDisplay}>
            <Text style={styles.displayText}>{homeText}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    minHeight: 400,
  },
  textDisplay: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    minHeight: 400,
  },
  displayText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
});

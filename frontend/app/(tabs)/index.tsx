import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { legalTexts } from '../../src/data/legalTexts';

export default function HomeScreen() {
  const router = useRouter();

  const renderLawItem = ({ item }: { item: typeof legalTexts[0] }) => (
    <TouchableOpacity
      style={styles.lawCard}
      onPress={() => router.push(`/law/${item.id}`)}
    >
      <View style={styles.lawCardHeader}>
        <Ionicons name="document-text" size={24} color="#2563eb" />
        <View style={styles.lawCardContent}>
          <Text style={styles.lawTitle}>{item.title}</Text>
          <Text style={styles.lawSubtitle}>SFS {item.sfsNumber}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
      <View style={styles.lawMetadata}>
        <Text style={styles.metadataText}>
          {item.chapters.length} kapitel
        </Text>
        <Text style={styles.metadataText}>•</Text>
        <Text style={styles.metadataText}>
          Ändrad: {item.lastAmended}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Konkursadministration</Text>
        <Text style={styles.headerSubtitle}>
          Svensk lagsamling för konkursförvaltning
        </Text>
      </View>
      <FlatList
        data={legalTexts}
        renderItem={renderLawItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
  },
  lawCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  lawCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lawCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  lawTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lawSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  lawMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

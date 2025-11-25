import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { homeContent } from '../../src/content/homeContent';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hem</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.mainTitle}>{homeContent.title}</Text>
        </View>

        {homeContent.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{homeContent.footer}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 <Text style={styles.infoBold}>För tillhandahållare:</Text> Redigera innehållet på denna sida genom att ändra filen{' '}
            <Text style={styles.infoCode}>frontend/src/content/homeContent.ts</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  welcomeCard: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 24,
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  footer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#78350f',
  },
  infoBold: {
    fontWeight: '700',
  },
  infoCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#fde68a',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

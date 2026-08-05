import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { legalTexts } from '../../src/data/legalTexts';
import { useBookmarks } from '../../src/contexts/BookmarksContext';
import { useNotes } from '../../src/contexts/NotesContext';
import { colors, typography, spacing, borderRadius, createHeadingStyle, createLabelStyle } from '../../src/theme/theme';

export default function LawViewerScreen() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showTOC, setShowTOC] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { addNote, updateNote, deleteNote, getNote } = useNotes();
  
  const law = legalTexts.find((l) => l.id === id);

  useEffect(() => {
    if (section && law) {
      // Auto-expand chapter containing the target section
      const chapter = law.chapters.find((c) =>
        c.sections.some((s) => s.id === section)
      );
      if (chapter) {
        setExpandedChapters(new Set([chapter.id]));
      }
      // Scroll to section after a short delay
      setTimeout(() => {
        // This would require refs on section elements in production
      }, 500);
    }
  }, [section, law]);

  if (!law) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lagen kunde inte hittas</Text>
      </View>
    );
  }

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleBookmarkToggle = async (
    lawId: string,
    chapterId: string,
    sectionId: string
  ) => {
    if (isBookmarked(sectionId)) {
      await removeBookmark(sectionId);
    } else {
      await addBookmark(lawId, chapterId, sectionId);
    }
  };

  const handleNotePress = (sectionId: string) => {
    setSelectedSection(sectionId);
    const existingNote = getNote(sectionId);
    setNoteText(existingNote?.text || '');
    setNoteModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!selectedSection) return;
    
    if (noteText.trim()) {
      const existingNote = getNote(selectedSection);
      if (existingNote) {
        await updateNote(selectedSection, noteText.trim());
      } else {
        await addNote(selectedSection, noteText.trim());
      }
    } else {
      await deleteNote(selectedSection);
    }
    
    setNoteModalVisible(false);
    setNoteText('');
    setSelectedSection(null);
  };

  const handleDeleteNote = async () => {
    if (!selectedSection) return;
    
    Alert.alert(
      'Ta bort anteckning',
      'Är du säker på att du vill ta bort denna anteckning?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(selectedSection);
            setNoteModalVisible(false);
            setNoteText('');
            setSelectedSection(null);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: law.title,
          headerStyle: {
            backgroundColor: colors.cream,
          },
          headerTitleStyle: {
            fontFamily: typography.fontFamily.bold,
            color: colors.ink,
          },
          headerTintColor: colors.greenPrimary,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowTOC(true)}
              style={styles.headerButton}
            >
              <Ionicons name="list-outline" size={24} color={colors.greenPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Law Header */}
        <View style={styles.lawHeader}>
          <Text style={styles.lawTitle}>{law.title}</Text>
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>SFS {law.sfsNumber}</Text>
            <Text style={styles.metadataText}>•</Text>
            <Text style={styles.metadataText}>{law.department}</Text>
          </View>
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>Utfärdad: {law.issued}</Text>
          </View>
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>Ändrad: {law.lastAmended}</Text>
          </View>
        </View>

        {/* Chapters */}
        {law.chapters.map((chapter) => (
          <View key={chapter.id} style={styles.chapterContainer}>
            <TouchableOpacity
              style={styles.chapterHeader}
              onPress={() => toggleChapter(chapter.id)}
            >
              <View style={styles.chapterTitleContainer}>
                <Text style={styles.chapterNumber}>{chapter.number} kap.</Text>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
              </View>
              <Ionicons
                name={expandedChapters.has(chapter.id) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.mutedText}
              />
            </TouchableOpacity>

            {expandedChapters.has(chapter.id) && (
              <View style={styles.sectionsContainer}>
                {chapter.sections.map((sectionItem) => {
                  const sectionNote = getNote(sectionItem.id);
                  const bookmarked = isBookmarked(sectionItem.id);
                  
                  return (
                    <View
                      key={sectionItem.id}
                      style={[
                        styles.sectionContainer,
                        section === sectionItem.id && styles.highlightedSection,
                      ]}
                    >
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionNumber}>{sectionItem.number} §</Text>
                        <View style={styles.sectionActions}>
                          <TouchableOpacity
                            onPress={() => handleNotePress(sectionItem.id)}
                            style={styles.actionButton}
                          >
                            <Ionicons
                              name={sectionNote ? 'create' : 'create-outline'}
                              size={20}
                              color={sectionNote ? colors.greenPrimary : colors.mutedText}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              handleBookmarkToggle(law.id, chapter.id, sectionItem.id)
                            }
                            style={styles.actionButton}
                          >
                            <Ionicons
                              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                              size={20}
                              color={bookmarked ? colors.greenPrimary : colors.mutedText}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.sectionText}>{sectionItem.text}</Text>
                      
                      {sectionNote && (
                        <View style={styles.notePreview}>
                          <Ionicons name="document-text" size={14} color={colors.mutedText} />
                          <Text style={styles.notePreviewText} numberOfLines={2}>
                            {sectionNote.text}
                          </Text>
                        </View>
                      )}
                      
                      {sectionItem.references.length > 0 && (
                        <View style={styles.referencesContainer}>
                          <Text style={styles.referencesLabel}>Hänvisningar:</Text>
                          {sectionItem.references.map((ref, idx) => (
                            <Text key={idx} style={styles.referenceText}>
                              • {ref}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Table of Contents Modal */}
      <Modal
        visible={showTOC}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTOC(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Innehållsförteckning</Text>
            <TouchableOpacity onPress={() => setShowTOC(false)}>
              <Ionicons name="close" size={28} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.tocList}>
            {law.chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.id}
                style={styles.tocItem}
                onPress={() => {
                  toggleChapter(chapter.id);
                  setShowTOC(false);
                }}
              >
                <Text style={styles.tocChapterNumber}>{chapter.number} kap.</Text>
                <Text style={styles.tocChapterTitle}>{chapter.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Note Modal */}
      <Modal
        visible={noteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.noteModalOverlay}
        >
          <View style={styles.noteModalContainer}>
            <View style={styles.noteModalHeader}>
              <Text style={styles.noteModalTitle}>Anteckning</Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Skriv din anteckning här..."
              placeholderTextColor={colors.mutedText}
              multiline
              autoFocus
            />
            
            <View style={styles.noteModalActions}>
              {getNote(selectedSection || '') && (
                <TouchableOpacity
                  style={[styles.noteButton, styles.deleteButton]}
                  onPress={handleDeleteNote}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>Ta bort</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.noteButton, styles.saveButton]}
                onPress={handleSaveNote}
              >
                <Ionicons name="checkmark" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>Spara</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: spacing.md,
  },
  headerButton: {
    marginRight: spacing.md,
  },
  lawHeader: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 20,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  lawTitle: {
    ...createHeadingStyle(20),
    color: colors.ink,
    marginBottom: spacing.md,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  metadataText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  chapterContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.cream,
  },
  chapterTitleContainer: {
    flex: 1,
  },
  chapterNumber: {
    ...createLabelStyle(12),
    color: colors.greenPrimary,
    marginBottom: 4,
  },
  chapterTitle: {
    ...createHeadingStyle(16),
    color: colors.ink,
  },
  sectionsContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionContainer: {
    marginBottom: 20,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
  },
  highlightedSection: {
    backgroundColor: '#e8f4f0',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionNumber: {
    ...createLabelStyle(13),
    color: colors.greenPrimary,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    padding: 4,
  },
  sectionText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
    lineHeight: 24,
  },
  notePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  notePreviewText: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: '#92400e',
    lineHeight: 18,
  },
  referencesContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  referencesLabel: {
    ...createLabelStyle(11),
    color: colors.mutedText,
    marginBottom: 4,
  },
  referenceText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.greenPrimary,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerLight,
  },
  modalTitle: {
    ...createHeadingStyle(20),
    color: colors.ink,
  },
  tocList: {
    flex: 1,
  },
  tocItem: {
    padding: spacing.md,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  tocChapterNumber: {
    ...createLabelStyle(12),
    color: colors.greenPrimary,
    marginBottom: 4,
  },
  tocChapterTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.ink,
  },
  noteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  noteModalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    minHeight: 400,
  },
  noteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: spacing.md,
  },
  noteModalTitle: {
    ...createHeadingStyle(18),
    color: colors.ink,
  },
  noteInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  noteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.dividerLight,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    color: '#ef4444',
  },
  saveButton: {
    backgroundColor: colors.greenPrimary,
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  errorText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
});

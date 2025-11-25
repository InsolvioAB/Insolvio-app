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
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowTOC(true)}
              style={styles.headerButton}
            >
              <Ionicons name="list-outline" size={24} color="#2563eb" />
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
                color="#6b7280"
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
                              color={sectionNote ? '#2563eb' : '#9ca3af'}
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
                              color={bookmarked ? '#2563eb' : '#9ca3af'}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.sectionText}>{sectionItem.text}</Text>
                      
                      {sectionNote && (
                        <View style={styles.notePreview}>
                          <Ionicons name="document-text" size={14} color="#6b7280" />
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
              <Ionicons name="close" size={28} color="#111827" />
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
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Skriv din anteckning här..."
              placeholderTextColor="#9ca3af"
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
                <Ionicons name="checkmark" size={20} color="#ffffff" />
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
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  headerButton: {
    marginRight: 16,
  },
  lawHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  lawTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metadataText: {
    fontSize: 13,
    color: '#6b7280',
  },
  chapterContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  chapterTitleContainer: {
    flex: 1,
  },
  chapterNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  sectionContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  highlightedSection: {
    backgroundColor: '#eff6ff',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  sectionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  notePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  notePreviewText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  referencesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  referencesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  referenceText: {
    fontSize: 13,
    color: '#2563eb',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  tocList: {
    flex: 1,
  },
  tocItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tocChapterNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  tocChapterTitle: {
    fontSize: 15,
    color: '#111827',
  },
  noteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  noteModalContainer: {
    backgroundColor: '#ffffff',
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
    marginBottom: 16,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  noteInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
  },
  noteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

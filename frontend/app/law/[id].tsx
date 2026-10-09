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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { legalTexts, Chapter, sectionLabel } from '../../src/data/legalTexts';
import { getSectionAmendment } from '../../src/content/lawAmendments';
import { activeNewsItems } from '../../src/content/newsContent';
import { useBookmarks } from '../../src/contexts/BookmarksContext';
import { useNotes } from '../../src/contexts/NotesContext';
import { useRecentlyViewed } from '../../src/contexts/RecentlyViewedContext';
import { colors, typography, spacing, borderRadius, createHeadingStyle, createLabelStyle } from '../../src/theme/theme';

export default function LawViewerScreen() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, View | null>>({});
  
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showTOC, setShowTOC] = useState(false);
  const [showTransitional, setShowTransitional] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { addNote, updateNote, deleteNote, getNote } = useNotes();
  const { addRecentlyViewed } = useRecentlyViewed();
  
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
      // Scroll to section after a short delay (allows the chapter to expand first)
      setTimeout(() => {
        const sectionNode = sectionRefs.current[section];
        if (sectionNode && scrollViewRef.current) {
          sectionNode.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({ y: Math.max(y - 20, 0), animated: true });
            },
            () => {
              // Measurement failed (e.g. node not yet mounted) - fail silently
            }
          );
        }
      }, 500);
    }
  }, [section, law]);


  useEffect(() => {
    if (!law) return;
    const chapter = section
      ? law.chapters.find((c) => c.sections.some((s) => s.id === section))
      : undefined;
    const sectionItem = chapter?.sections.find((s) => s.id === section);
    addRecentlyViewed(law.id, law.title, chapter?.number, sectionItem?.number, sectionItem?.id);
  }, [law, section]);

  if (!law) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lagen kunde inte hittas</Text>
      </View>
    );
  }

  // References that are immediately followed, in the paragraph's own text, by
  // the name of a DIFFERENT law (e.g. "4 kap. 6 § bokföringslagen") point
  // outside this document entirely. Our data only keeps the bare numeric
  // citation once extracted, so without this check a reference like that
  // would be misread as pointing at this law's own chapter/section with the
  // same numbers -- e.g. it would wrongly link to this law's own "4 kap. 6 §"
  // instead of correctly staying a plain, non-clickable mention of a
  // different law we don't have data for.
  const EXTERNAL_LAW_NAME_RE =
    /^\s*(?:(?:första|andra|tredje|fjärde|femte)\s+stycket\s+)?[a-zäöå]+(?:lagen|balken|förordningen|kungörelsen|stadgan)\b/;

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const isExternalLawReference = (ref: string, sectionText: string): boolean => {
    const m = sectionText.match(new RegExp(escapeRegExp(ref)));
    if (!m || m.index === undefined) return false;
    const after = sectionText.slice(m.index + ref.length, m.index + ref.length + 60);
    return EXTERNAL_LAW_NAME_RE.test(after);
  };

  // Resolve a "Hänvisningar" reference string (e.g. "10 §", "16 kap. 10 §",
  // "10 kap. 1, 3, 4 och 5 §§", "1-10 §§") to the id of the section it points
  // to, if that section exists in this law's data. References with no "kap."
  // prefix refer to a section in the same chapter as the one the reference
  // appears in. Compound references (multiple section numbers, or a range)
  // link to the first section number mentioned.
  const resolveReference = (ref: string, currentChapter: Chapter): string | null => {
    const nums = ref.match(/\d+/g);
    if (!nums || nums.length === 0) return null;

    const hasChapterPrefix = /kap\.?/i.test(ref);
    let chapterNumber: number;
    let chapterSuffix: string | undefined;
    let sectionNumber: string;

    if (hasChapterPrefix) {
      if (nums.length < 2) return null;
      chapterNumber = parseInt(nums[0], 10);
      sectionNumber = nums[1];
      const targetChapter =
        law.chapters.find((c) => c.number === chapterNumber && !c.numberSuffix) ||
        law.chapters.find((c) => c.number === chapterNumber);
      if (!targetChapter) return null;
      chapterSuffix = targetChapter.numberSuffix;
    } else {
      chapterNumber = currentChapter.number;
      chapterSuffix = currentChapter.numberSuffix;
      sectionNumber = nums[0];
    }

    const targetChapter = law.chapters.find(
      (c) => c.number === chapterNumber && (c.numberSuffix ?? '') === (chapterSuffix ?? '')
    );
    if (!targetChapter) return null;

    // A single reference to a lettered section ("2 a §", "7 kap. 59 a §") links to
    // that exact section; compound references still link to the first number.
    const singleLettered = /^(?:\d+\s*[a-z]?\s*kap\.\s*)?\d+\s*([a-z])\s*§§?$/.exec(ref.trim());
    const sectionSuffix = singleLettered ? singleLettered[1] : '';
    const targetId = `kap-${chapterNumber}${chapterSuffix ?? ''}-§-${sectionNumber}${sectionSuffix}`;
    const targetSection = targetChapter.sections.find((s) => s.id === targetId);
    return targetSection ? targetId : null;
  };

  const navigateToReference = (targetId: string) => {
    if (targetId === section) {
      // Already the highlighted section (e.g. tapping a self-reference) --
      // still make sure its chapter is expanded and scroll to it.
      const targetChapter = law.chapters.find((c) => c.sections.some((s) => s.id === targetId));
      if (targetChapter) {
        setExpandedChapters(new Set([targetChapter.id]));
      }
      setTimeout(() => {
        const sectionNode = sectionRefs.current[targetId];
        if (sectionNode && scrollViewRef.current) {
          sectionNode.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({ y: Math.max(y - 20, 0), animated: true });
            },
            () => {}
          );
        }
      }, 350);
      return;
    }
    // Update the `section` route param -- the existing effect that watches
    // it will expand the right chapter and scroll to the section.
    router.setParams({ section: targetId });
  };

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
          headerRight: () =>
            law?.chaptered === false ? null : (
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
            {law.chaptered !== false && (
            <TouchableOpacity
              style={styles.chapterHeader}
              onPress={() => toggleChapter(chapter.id)}
            >
              <View style={styles.chapterTitleContainer}>
                <Text style={styles.chapterNumber}>{chapter.number}{chapter.numberSuffix ? ' ' + chapter.numberSuffix : ''} KAP.</Text>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
              </View>
              <Ionicons
                name={expandedChapters.has(chapter.id) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.mutedText}
              />
            </TouchableOpacity>
            )}

            {(law.chaptered === false || expandedChapters.has(chapter.id)) && (
              <View style={styles.sectionsContainer}>
                {chapter.sections.map((sectionItem) => {
                  const sectionNote = getNote(sectionItem.id);
                  const bookmarked = isBookmarked(sectionItem.id);
                  const rawAmendment = getSectionAmendment(law.id, sectionItem.id);
                  // Markeringen visas så länge ändringen räknas som en nyhet
                  // (samma rullande fönster som "Ny ändring"-badgen).
                  const amendment =
                    rawAmendment && activeNewsItems.some((n) => n.id === rawAmendment.newsId)
                      ? rawAmendment
                      : undefined;

                  return (
                    <View
                      key={sectionItem.id}
                      ref={(el) => {
                        sectionRefs.current[sectionItem.id] = el;
                      }}
                      style={[
                        styles.sectionContainer,
                        section === sectionItem.id && styles.highlightedSection,
                      ]}
                    >
                      {sectionItem.groupHeading ? (
                        <Text style={styles.groupHeadingText}>{sectionItem.groupHeading}</Text>
                      ) : null}
                      {sectionItem.heading ? (
                        <Text style={styles.headingText}>{sectionItem.heading}</Text>
                      ) : null}
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionNumber}>{sectionLabel(sectionItem)}</Text>
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
                      {amendment && (
                        <TouchableOpacity
                          style={styles.amendedPill}
                          onPress={() =>
                            router.push(`/amendment/${amendment.newsId}?paragraph=${encodeURIComponent(sectionItem.id)}`)
                          }
                          accessibilityRole="button"
                          accessibilityLabel="Se vad som ändrats i den här paragrafen"
                        >
                          <Text style={styles.amendedPillText}>
                            {amendment.changeType === 'ny' ? 'Ny paragraf' : 'Ändrad'}{' '}
                            {new Date(amendment.effectiveDate).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}{' '}
                            · Se vad som ändrats ›
                          </Text>
                        </TouchableOpacity>
                      )}
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
                          {sectionItem.references.map((ref, idx) => {
                            const targetId = isExternalLawReference(ref, sectionItem.text)
                              ? null
                              : resolveReference(ref, chapter);
                            if (targetId) {
                              return (
                                <TouchableOpacity
                                  key={idx}
                                  onPress={() => navigateToReference(targetId)}
                                  accessibilityRole="link"
                                >
                                  <Text style={[styles.referenceText, styles.referenceTextLink]}>
                                    • {ref}
                                  </Text>
                                </TouchableOpacity>
                              );
                            }
                            return (
                              <Text key={idx} style={styles.referenceText}>
                                • {ref}
                              </Text>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        {law.transitional && law.transitional.length > 0 && (
          <View style={styles.chapterContainer}>
            <TouchableOpacity
              style={styles.chapterHeader}
              onPress={() => setShowTransitional(!showTransitional)}
            >
              <View style={styles.chapterTitleContainer}>
                <Text style={styles.chapterTitle}>Övergångsbestämmelser</Text>
              </View>
              <Ionicons
                name={showTransitional ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.mutedText}
              />
            </TouchableOpacity>
            {showTransitional && (
              <View style={styles.sectionsContainer}>
                {law.transitional.map((t) => (
                  <View key={t.sfs} style={styles.sectionContainer}>
                    <Text style={styles.sectionNumber}>SFS {t.sfs}</Text>
                    <Text style={styles.sectionText}>{t.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
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
                <Text style={styles.tocChapterNumber}>{chapter.number}{chapter.numberSuffix ? ' ' + chapter.numberSuffix : ''} KAP.</Text>
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
    textTransform: 'none', // "KAP." is written in capitals in the JSX; a letter suffix ("4 a") must stay lowercase
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
    textTransform: 'none', // keep the letter of "18 a §" lowercase
    color: colors.greenPrimary,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    padding: 4,
  },
  amendedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#e3f1ea',
    borderWidth: 1,
    borderColor: '#bfdccd',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: spacing.sm,
  },
  amendedPillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.greenPrimary,
  },
  sectionText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
    lineHeight: 24,
  },
  groupHeadingText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headingText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
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
  referenceTextLink: {
    textDecorationLine: 'underline',
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
    textTransform: 'none',
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
    color: colors.greenPrimaryForeground,
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

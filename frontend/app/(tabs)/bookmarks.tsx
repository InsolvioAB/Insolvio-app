import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useBookmarks } from '../../src/contexts/BookmarksContext';
import { useNotes } from '../../src/contexts/NotesContext';
import { legalTexts, sectionLabel } from '../../src/data/legalTexts';
import { formatSaved } from '../../src/utils/formatSaved';
import PageHeader from '../../src/components/PageHeader';
import { getShortLawName } from '../../src/data/lawShortNames';
import { colors, typography, spacing, borderRadius, createHeadingStyle } from '../../src/theme/theme';

const UNDO_VISIBLE_MS = 6000;
const HELP_BOX_MAX_BOOKMARKS = 3;

type BookmarkItem = {
  lawId: string;
  chapterId: string;
  sectionId: string;
  timestamp: number;
  place: string;
  sectionText: string;
};

type LawGroup = {
  lawId: string;
  title: string;
  data: BookmarkItem[];
};

export default function BookmarksScreen() {
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();
  const { addNote, updateNote, deleteNote, getNote } = useNotes();
  const router = useRouter();

  // Ångra efter borttagning
  const [undoBookmark, setUndoBookmark] = useState<BookmarkItem | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  // Anteckning
  const [noteSectionId, setNoteSectionId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const groups: LawGroup[] = useMemo(() => {
    const byLaw: Record<string, LawGroup> = {};
    bookmarks.forEach((bookmark) => {
      const law = legalTexts.find((l) => l.id === bookmark.lawId);
      const chapter = law?.chapters.find((c) => c.id === bookmark.chapterId);
      const section = chapter?.sections.find((sec) => sec.id === bookmark.sectionId);
      if (!law || !chapter || !section) return;

      const label = sectionLabel(section);
      const place =
        law.chaptered !== false
          ? `${chapter.number}${chapter.numberSuffix ?? ''} kap. ${label} · ${chapter.title}`
          : label;

      if (!byLaw[law.id]) byLaw[law.id] = { lawId: law.id, title: getShortLawName(law.id, law.title), data: [] };
      byLaw[law.id].data.push({
        lawId: law.id,
        chapterId: chapter.id,
        sectionId: section.id,
        timestamp: bookmark.timestamp,
        place,
        sectionText: section.text,
      });
    });
    const list = Object.values(byLaw);
    list.forEach((g) => g.data.sort((a, b) => b.timestamp - a.timestamp));
    // Lagen med senast sparade bokmärke överst
    list.sort((a, b) => b.data[0].timestamp - a.data[0].timestamp);
    return list;
  }, [bookmarks]);

  const handleDelete = async (item: BookmarkItem) => {
    await removeBookmark(item.sectionId);
    setUndoBookmark(item);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoBookmark(null), UNDO_VISIBLE_MS);
  };

  const handleUndo = async () => {
    if (!undoBookmark) return;
    const item = undoBookmark;
    setUndoBookmark(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    await addBookmark(item.lawId, item.chapterId, item.sectionId, item.timestamp);
  };

  const openMenu = (item: BookmarkItem) => {
    Alert.alert(item.place, undefined, [
      { text: 'Ta bort bokmärke', style: 'destructive', onPress: () => handleDelete(item) },
      { text: 'Avbryt', style: 'cancel' },
    ]);
  };

  const openNote = (sectionId: string) => {
    setNoteSectionId(sectionId);
    setNoteText(getNote(sectionId)?.text ?? '');
  };

  const closeNote = () => {
    setNoteSectionId(null);
    setNoteText('');
  };

  const saveNote = async () => {
    if (!noteSectionId) return;
    const text = noteText.trim();
    if (text) {
      if (getNote(noteSectionId)) await updateNote(noteSectionId, text);
      else await addNote(noteSectionId, text);
    } else {
      await deleteNote(noteSectionId);
    }
    closeNote();
  };

  const removeNote = async () => {
    if (!noteSectionId) return;
    await deleteNote(noteSectionId);
    closeNote();
  };

  const renderSwipeDelete = (item: BookmarkItem) => (
    <TouchableOpacity
      style={styles.swipeDelete}
      onPress={() => handleDelete(item)}
      accessibilityLabel="Ta bort bokmärke"
    >
      <Ionicons name="trash-outline" size={22} color={colors.destructiveForeground} />
      <Text style={styles.swipeDeleteText}>Ta bort</Text>
    </TouchableOpacity>
  );

  const renderBookmark = ({ item }: { item: BookmarkItem }) => {
    const note = getNote(item.sectionId);
    return (
      <Swipeable
        renderRightActions={() => renderSwipeDelete(item)}
        overshootRight={false}
        containerStyle={styles.swipeContainer}
      >
        <View style={styles.card}>
          <TouchableOpacity
            onPress={() => router.push(`/law/${item.lawId}?section=${item.sectionId}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="bookmark" size={20} color={colors.greenAction} />
              <Text style={styles.cardPlace} numberOfLines={2}>
                {item.place}
              </Text>
              <TouchableOpacity
                onPress={() => openMenu(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Fler val för bokmärket"
              >
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardText} numberOfLines={5}>
              {item.sectionText}
            </Text>
            {note ? (
              <View style={styles.notePreview}>
                <Ionicons name="chatbox-outline" size={14} color={colors.greenAction} />
                <Text style={styles.notePreviewText} numberOfLines={2}>
                  {note.text}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <View style={styles.cardFooter}>
            <Text style={styles.savedText}>{formatSaved(item.timestamp)}</Text>
            <TouchableOpacity
              style={styles.noteButton}
              onPress={() => openNote(item.sectionId)}
              accessibilityLabel={note ? 'Redigera anteckning' : 'Lägg till anteckning'}
            >
              <Ionicons name="chatbox-outline" size={16} color={colors.greenAction} />
              <Text style={styles.noteButtonText}>
                {note ? 'Redigera anteckning' : 'Lägg till anteckning'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Swipeable>
    );
  };

  const helpBox = (
    <View style={styles.helpBox}>
      <Ionicons name="bookmark-outline" size={22} color={colors.ink} />
      <View style={styles.helpTextBlock}>
        <Text style={styles.helpTitle}>Spara fler paragrafer</Text>
        <Text style={styles.helpText}>
          Tryck på bokmärkesikonen vid en paragraf så hamnar den här.
        </Text>
      </View>
    </View>
  );

  const total = groups.reduce((n, g) => n + g.data.length, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader title="Bokmärken" />
      <SectionList
        sections={groups}
        keyExtractor={(item) => item.sectionId}
        renderItem={renderBookmark}
        renderSectionHeader={({ section }) => (
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle} numberOfLines={2}>
              {section.title}
            </Text>
            <Text style={styles.groupCount}>
              {section.data.length} {section.data.length === 1 ? 'bokmärke' : 'bokmärken'}
            </Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={total <= HELP_BOX_MAX_BOOKMARKS ? helpBox : null}
      />

      {undoBookmark && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>Bokmärket togs bort</Text>
          <TouchableOpacity onPress={handleUndo} accessibilityLabel="Ångra borttagning">
            <Text style={styles.snackbarAction}>Ångra</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={noteSectionId !== null} animationType="slide" transparent onRequestClose={closeNote}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Anteckning</Text>
              <TouchableOpacity onPress={closeNote} accessibilityLabel="Stäng">
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
            <View style={styles.modalActions}>
              {noteSectionId && getNote(noteSectionId) ? (
                <TouchableOpacity style={styles.modalSecondary} onPress={removeNote}>
                  <Text style={styles.modalSecondaryText}>Ta bort</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.modalPrimary} onPress={saveNote}>
                <Text style={styles.modalPrimaryText}>Spara</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  groupTitle: {
    flex: 1,
    ...createHeadingStyle(20),
    color: colors.ink,
  },
  groupCount: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  swipeContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  swipeDelete: {
    width: 88,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeDeleteText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.destructiveForeground,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dividerLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  cardPlace: {
    flex: 1,
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.ink,
  },
  cardText: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
    color: colors.darkText,
  },
  notePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.greenTint,
  },
  notePreviewText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.ink,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.dividerLight,
  },
  savedText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  noteButtonText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.ink,
  },
  helpBox: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#e8e8e8',
  },
  helpTextBlock: {
    flex: 1,
    gap: 2,
  },
  helpTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.ink,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedText,
  },
  snackbar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.ink,
  },
  snackbarText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: colors.cream,
  },
  snackbarAction: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.greenHover,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    minHeight: 360,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: spacing.md,
  },
  modalTitle: {
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.dividerLight,
  },
  modalSecondary: {
    paddingHorizontal: 20,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.dividerLight,
  },
  modalSecondaryText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: '600',
    color: colors.ink,
  },
  modalPrimary: {
    paddingHorizontal: 24,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.greenAction,
  },
  modalPrimaryText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: '600',
    color: colors.white,
  },
});

import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useShopping } from '@/context/shopping-context';

const WEEKDAY_OPTIONS = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜'];

function toggleWeekday(current: string[], day: string): string[] {
  if (current.includes(day)) {
    return current.filter((item) => item !== day);
  }
  return [...current, day];
}

export default function MemoScreen() {
  const { priceMemos, addPriceMemo, updatePriceMemo, removePriceMemo, isReady } = useShopping();

  const [storeName, setStoreName] = useState('');
  const [weekdays, setWeekdays] = useState<string[]>([]);
  const [cheapItem, setCheapItem] = useState('');
  const [note, setNote] = useState('');

  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingStoreName, setEditingStoreName] = useState('');
  const [editingWeekdays, setEditingWeekdays] = useState<string[]>([]);
  const [editingCheapItem, setEditingCheapItem] = useState('');
  const [editingNote, setEditingNote] = useState('');

  const submit = () => {
    const ok = addPriceMemo(storeName, weekdays, cheapItem, note);
    if (!ok) {
      Alert.alert('入力不足', 'スーパー名と安いものは入力してください。');
      return;
    }

    setStoreName('');
    setWeekdays([]);
    setCheapItem('');
    setNote('');
    Alert.alert('保存しました', 'メモを追加しました。');
  };

  const startEdit = (id: string) => {
    if (editingMemoId === id) {
      cancelInlineEdit();
      return;
    }

    const target = priceMemos.find((memo) => memo.id === id);
    if (!target) {
      return;
    }

    setEditingMemoId(id);
    setEditingStoreName(target.storeName);
    setEditingWeekdays(target.weekdays);
    setEditingCheapItem(target.cheapItem);
    setEditingNote(target.note);
  };

  const cancelInlineEdit = () => {
    setEditingMemoId(null);
    setEditingStoreName('');
    setEditingWeekdays([]);
    setEditingCheapItem('');
    setEditingNote('');
  };

  const submitInlineEdit = () => {
    if (!editingMemoId) {
      return;
    }

    const ok = updatePriceMemo(
      editingMemoId,
      editingStoreName,
      editingWeekdays,
      editingCheapItem,
      editingNote
    );

    if (!ok) {
      Alert.alert('入力不足', 'スーパー名と安いものは入力してください。');
      return;
    }

    Alert.alert('保存しました', 'メモを更新しました。');
    cancelInlineEdit();
  };

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <Text style={styles.title}>買い回りメモ</Text>
      <Text style={styles.helpText}>スーパーごとの曜日特売をメモして、買い回りの参考にできます。</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>メモを追加</Text>
        <View style={styles.formColumn}>
          <TextInput
            value={storeName}
            onChangeText={setStoreName}
            placeholder="例: Aスーパー"
            placeholderTextColor="#5d6b7a"
            style={styles.input}
          />
          <View style={styles.weekdayArea}>
            <Text style={styles.weekdayLabel}>曜日</Text>
            <View style={styles.weekdayGrid}>
              {WEEKDAY_OPTIONS.map((option) => {
                const selected = weekdays.includes(option);
                return (
                  <Pressable
                    key={option}
                    style={[styles.weekdayButton, selected && styles.weekdayButtonActive]}
                    onPress={() => setWeekdays((prev) => toggleWeekday(prev, option))}>
                    <Text style={[styles.weekdayButtonText, selected && styles.weekdayButtonTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.clearWeekdayButton} onPress={() => setWeekdays([])}>
              <Text style={styles.clearWeekdayButtonText}>曜日選択をクリア</Text>
            </Pressable>
          </View>
          <TextInput
            value={cheapItem}
            onChangeText={setCheapItem}
            placeholder="例: 鶏むね肉"
            placeholderTextColor="#5d6b7a"
            style={styles.input}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="例: 午後に行くと値引きシールが増える"
            placeholderTextColor="#5d6b7a"
            style={[styles.input, styles.noteInput]}
            multiline
          />
          <Pressable style={styles.addButton} onPress={submit}>
            <Text style={styles.addButtonText}>追加</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>登録済みメモ</Text>
        {priceMemos.length === 0 ? (
          <Text style={styles.emptyText}>まだメモがありません。</Text>
        ) : (
          priceMemos.map((memo) => (
            <View key={memo.id} style={styles.card}>
              {editingMemoId === memo.id ? (
                <View style={styles.formColumn}>
                  <Text style={styles.inlineEditTitle}>メモを編集</Text>
                  <TextInput
                    value={editingStoreName}
                    onChangeText={setEditingStoreName}
                    placeholder="例: Aスーパー"
                    placeholderTextColor="#5d6b7a"
                    style={styles.input}
                  />
                  <View style={styles.weekdayArea}>
                    <Text style={styles.weekdayLabel}>曜日</Text>
                    <View style={styles.weekdayGrid}>
                      {WEEKDAY_OPTIONS.map((option) => {
                        const selected = editingWeekdays.includes(option);
                        return (
                          <Pressable
                            key={option}
                            style={[styles.weekdayButton, selected && styles.weekdayButtonActive]}
                            onPress={() =>
                              setEditingWeekdays((prev) => toggleWeekday(prev, option))
                            }>
                            <Text
                              style={[
                                styles.weekdayButtonText,
                                selected && styles.weekdayButtonTextActive,
                              ]}>
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Pressable
                      style={styles.clearWeekdayButton}
                      onPress={() => setEditingWeekdays([])}>
                      <Text style={styles.clearWeekdayButtonText}>曜日選択をクリア</Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={editingCheapItem}
                    onChangeText={setEditingCheapItem}
                    placeholder="例: 鶏むね肉"
                    placeholderTextColor="#5d6b7a"
                    style={styles.input}
                  />
                  <TextInput
                    value={editingNote}
                    onChangeText={setEditingNote}
                    placeholder="補足"
                    placeholderTextColor="#5d6b7a"
                    style={[styles.input, styles.noteInput]}
                    multiline
                  />
                  <View style={styles.rowButtons}>
                    <Pressable style={styles.addButton} onPress={submitInlineEdit}>
                      <Text style={styles.addButtonText}>保存</Text>
                    </Pressable>
                    <Pressable style={styles.cancelButton} onPress={cancelInlineEdit}>
                      <Text style={styles.cancelButtonText}>キャンセル</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.cardTitle}>{memo.storeName}</Text>
                  <Text style={styles.cardBody}>
                    曜日: {memo.weekdays.length > 0 ? memo.weekdays.join('・') : '未設定'}
                  </Text>
                  <Text style={styles.cardBody}>安いもの: {memo.cheapItem}</Text>
                  {memo.note ? <Text style={styles.cardSubText}>{memo.note}</Text> : null}
                  <View style={styles.rowButtons}>
                    <Pressable style={styles.editButton} onPress={() => startEdit(memo.id)}>
                      <Text style={styles.editButtonText}>編集</Text>
                    </Pressable>
                    <Pressable style={styles.deleteButton} onPress={() => removePriceMemo(memo.id)}>
                      <Text style={styles.deleteButtonText}>削除</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff8f2',
  },
  container: {
    position: 'relative',
    flexGrow: 1,
    padding: 16,
    paddingBottom: 120,
    backgroundColor: '#fff8f2',
    gap: 14,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    width: 220,
    height: 220,
    backgroundColor: '#ffd9b8',
    top: -110,
    right: -70,
    opacity: 0.35,
  },
  blobBottom: {
    width: 260,
    height: 260,
    backgroundColor: '#f8c6d5',
    bottom: -30,
    left: -120,
    opacity: 0.23,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff8f2',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3a2a20',
  },
  title: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: '800',
    color: '#3f2417',
    letterSpacing: 0.4,
  },
  helpText: {
    fontSize: 19,
    lineHeight: 28,
    color: '#6f5040',
  },
  section: {
    backgroundColor: '#fffefc',
    borderRadius: 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f2dfd2',
    shadowColor: '#522818',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#512f21',
  },
  formColumn: {
    gap: 10,
  },
  weekdayArea: {
    gap: 8,
  },
  weekdayLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5a4032',
  },
  weekdayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekdayButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#efdacd',
    backgroundColor: '#fff7f1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  weekdayButtonActive: {
    backgroundColor: '#d95f3a',
    borderColor: '#d95f3a',
  },
  weekdayButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5a3d2e',
  },
  weekdayButtonTextActive: {
    color: '#ffffff',
  },
  clearWeekdayButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#efe4da',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  clearWeekdayButtonText: {
    fontSize: 18,
    color: '#5a4032',
    fontWeight: '700',
  },
  input: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#efdacd',
    paddingHorizontal: 14,
    fontSize: 22,
    color: '#3c271c',
    backgroundColor: '#fff7f1',
  },
  noteInput: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  addButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#d95f3a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#9f4329',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
    flex: 1,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 22,
    color: '#815d49',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3ddd0',
    backgroundColor: '#fff7f2',
    padding: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3f2519',
  },
  cardBody: {
    fontSize: 20,
    lineHeight: 30,
    color: '#6b4b3b',
  },
  cardSubText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#7c5c49',
  },
  inlineEditTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#512f21',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#efe4da',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    flex: 1,
  },
  editButtonText: {
    fontSize: 22,
    color: '#5a4032',
    fontWeight: '800',
  },
  cancelButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#efe4da',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 22,
    color: '#5a4032',
    fontWeight: '800',
  },
  deleteButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#f8ddd8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    flex: 1,
  },
  deleteButtonText: {
    fontSize: 22,
    color: '#8e2a1f',
    fontWeight: '800',
  },
});

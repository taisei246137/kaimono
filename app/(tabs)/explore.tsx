import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { IngredientUnit, useShopping } from '@/context/shopping-context';

export default function FavoriteScreen() {
  const { favorites, addFavorite, updateFavorite, removeFavorite, addFavoriteToShopping, isReady } =
    useShopping();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<IngredientUnit>('個');
  const [editingFavoriteId, setEditingFavoriteId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingQuantity, setEditingQuantity] = useState('1');
  const [editingUnit, setEditingUnit] = useState<IngredientUnit>('個');

  const handleAddFavoriteToShopping = (favoriteId: string) => {
    if (process.env.EXPO_OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    addFavoriteToShopping(favoriteId);
  };

  const submit = () => {
    const parsedQuantity = Number.parseInt(quantity, 10);
    const ok = addFavorite(name, parsedQuantity, unit);
    if (!ok) {
      Alert.alert('入力不足', '食材名と、個数またはグラムを入力してください。');
      return;
    }
    Alert.alert('保存しました', '食材を追加しました。');

    setName('');
    setQuantity('1');
    setUnit('個');
  };

  const startEdit = (favoriteId: string) => {
    if (editingFavoriteId === favoriteId) {
      setEditingFavoriteId(null);
      return;
    }

    const target = favorites.find((item) => item.id === favoriteId);
    if (!target) {
      return;
    }

    setEditingFavoriteId(target.id);
    setEditingName(target.name);
    setEditingQuantity(String(target.quantity));
    setEditingUnit(target.unit);
  };

  const cancelInlineEdit = () => {
    setEditingFavoriteId(null);
    setEditingName('');
    setEditingQuantity('1');
    setEditingUnit('個');
  };

  const submitInlineEdit = () => {
    if (!editingFavoriteId) {
      return;
    }

    const parsedQuantity = Number.parseInt(editingQuantity, 10);
    const ok = updateFavorite(editingFavoriteId, editingName, parsedQuantity, editingUnit);
    if (!ok) {
      Alert.alert('入力不足', '食材名と、個数またはグラムを入力してください。');
      return;
    }

    Alert.alert('保存しました', '食材を更新しました。');
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
      <Text style={styles.title}>よく使う食材</Text>
      <Text style={styles.helpText}>納豆や卵など、よく買う食材を個数やグラムで登録できます。</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>食材を登録</Text>
        <View style={styles.formColumn}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="例: 牛乳"
            placeholderTextColor="#5d6b7a"
            style={styles.input}
          />

          <View style={styles.row}>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#5d6b7a"
              style={[styles.input, styles.quantityInput]}
            />

            <View style={styles.unitToggle}>
              <Pressable
                style={[styles.unitButton, unit === '個' && styles.unitButtonActive]}
                onPress={() => setUnit('個')}>
                <Text style={[styles.unitButtonText, unit === '個' && styles.unitButtonTextActive]}>個</Text>
              </Pressable>
              <Pressable
                style={[styles.unitButton, unit === 'g' && styles.unitButtonActive]}
                onPress={() => setUnit('g')}>
                <Text style={[styles.unitButtonText, unit === 'g' && styles.unitButtonTextActive]}>g</Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.addButton} onPress={submit}>
            <Text style={styles.addButtonText}>追加</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>登録済み食材</Text>
        {favorites.map((item) => (
          <View key={item.id} style={styles.card}>
            {editingFavoriteId === item.id ? (
              <View style={styles.formColumn}>
                <Text style={styles.inlineEditTitle}>食材を編集</Text>
                <TextInput
                  value={editingName}
                  onChangeText={setEditingName}
                  placeholder="例: 牛乳"
                  placeholderTextColor="#5d6b7a"
                  style={styles.input}
                />

                <View style={styles.row}>
                  <TextInput
                    value={editingQuantity}
                    onChangeText={setEditingQuantity}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor="#5d6b7a"
                    style={[styles.input, styles.quantityInput]}
                  />

                  <View style={styles.unitToggle}>
                    <Pressable
                      style={[styles.unitButton, editingUnit === '個' && styles.unitButtonActive]}
                      onPress={() => setEditingUnit('個')}>
                      <Text
                        style={[
                          styles.unitButtonText,
                          editingUnit === '個' && styles.unitButtonTextActive,
                        ]}>
                        個
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.unitButton, editingUnit === 'g' && styles.unitButtonActive]}
                      onPress={() => setEditingUnit('g')}>
                      <Text
                        style={[
                          styles.unitButtonText,
                          editingUnit === 'g' && styles.unitButtonTextActive,
                        ]}>
                        g
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.cardButtons}>
                  <Pressable style={styles.addButton} onPress={submitInlineEdit}>
                    <Text style={styles.addButtonText}>保存</Text>
                  </Pressable>
                  <Pressable style={styles.cancelEditButton} onPress={cancelInlineEdit}>
                    <Text style={styles.cancelEditButtonText}>キャンセル</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.cardTitle}>
                  {item.name} {item.quantity}
                  {item.unit}
                </Text>
                <View style={styles.cardButtons}>
                  <Pressable
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressedButton]}
                    onPress={() => handleAddFavoriteToShopping(item.id)}>
                    <Text style={styles.primaryButtonText} numberOfLines={1}>
                      買い物に追加
                    </Text>
                  </Pressable>
                  <Pressable style={styles.editButton} onPress={() => startEdit(item.id)}>
                    <Text style={styles.editButtonText}>編集</Text>
                  </Pressable>
                  <Pressable style={styles.deleteButton} onPress={() => removeFavorite(item.id)}>
                    <Text style={styles.deleteButtonText}>削除</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ))}
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#efdacd',
    paddingHorizontal: 14,
    fontSize: 22,
    color: '#3c271c',
    backgroundColor: '#fff7f1',
  },
  quantityInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#efdacd',
    overflow: 'hidden',
  },
  unitButton: {
    minWidth: 60,
    minHeight: 58,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4e8dd',
    paddingHorizontal: 10,
  },
  unitButtonActive: {
    backgroundColor: '#d95f3a',
  },
  unitButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5a3d2e',
  },
  unitButtonTextActive: {
    color: '#ffffff',
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
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  cancelEditButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#efe4da',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  cancelEditButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5a4032',
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
  inlineEditTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#512f21',
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#4eb9e6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    flex: 1,
  },
  pressedButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  editButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#efe4da',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  editButtonText: {
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
  },
  deleteButtonText: {
    fontSize: 22,
    color: '#8e2a1f',
    fontWeight: '800',
  },
});

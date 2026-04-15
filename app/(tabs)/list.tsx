import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useShopping } from '@/context/shopping-context';

export default function ShoppingListScreen() {
  const { shoppingItems, toggleShoppingItem, removeShoppingItem, clearCheckedItems, isReady } =
    useShopping();

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
      <Text style={styles.title}>買い物リスト</Text>
      <Text style={styles.helpText}>タップで購入済みにできます。不要な食材は削除できます。</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>買うもの</Text>
        {shoppingItems.length === 0 ? (
          <Text style={styles.emptyText}>まだ追加されていません。</Text>
        ) : (
          shoppingItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Pressable style={styles.checkArea} onPress={() => toggleShoppingItem(item.id)}>
                <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                  {item.checked ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
                  {item.name} {item.quantity}
                  {item.unit}
                </Text>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={() => removeShoppingItem(item.id)}>
                <Text style={styles.deleteButtonText}>削除</Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable style={styles.clearButton} onPress={clearCheckedItems}>
          <Text style={styles.clearButtonText}>購入済みをまとめて削除</Text>
        </Pressable>
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
    width: 250,
    height: 250,
    backgroundColor: '#f8c6d5',
    bottom: 0,
    left: -120,
    opacity: 0.24,
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
  emptyText: {
    fontSize: 22,
    color: '#815d49',
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3ddd0',
    backgroundColor: '#fff7f2',
    padding: 12,
    gap: 8,
  },
  checkArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#d95f3a',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#4eb9e6',
    borderColor: '#4eb9e6',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  itemText: {
    flex: 1,
    fontSize: 24,
    color: '#3d281d',
    fontWeight: '700',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#8e7364',
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: 12,
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
  clearButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: '#d95f3a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 10,
    shadowColor: '#9f4329',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 5,
  },
  clearButtonText: {
    fontSize: 23,
    color: '#ffffff',
    fontWeight: '800',
  },
});

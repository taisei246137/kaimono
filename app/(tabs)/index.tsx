import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { IngredientUnit, useShopping } from '@/context/shopping-context';

type IngredientDraft = {
  id: string;
  name: string;
  quantity: string;
  unit: IngredientUnit;
};

function createIngredientDraft(): IngredientDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    quantity: '1',
    unit: '個',
  };
}

export default function RecipeScreen() {
  const { recipes, addRecipe, updateRecipe, removeRecipe, addRecipeToShopping, isReady } = useShopping();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [draftIngredients, setDraftIngredients] = useState<IngredientDraft[]>([createIngredientDraft()]);

  const preparedIngredients = useMemo(
    () =>
      draftIngredients
        .map((ingredient) => {
          const name = ingredient.name.trim();
          const quantity = Number.parseInt(ingredient.quantity, 10);
          const hasName = name.length > 0;
          const hasQuantity = Number.isFinite(quantity) && quantity >= 1;

          return {
            id: ingredient.id,
            name,
            quantity,
            unit: ingredient.unit,
            hasName,
            hasQuantity,
            isBlank: !hasName && ingredient.quantity.trim().length === 0,
            isPartial: hasName !== hasQuantity,
          };
        })
        .filter((ingredient) => !ingredient.isBlank),
    [draftIngredients]
  );

  const canAddRecipe = useMemo(
    () =>
      recipeName.trim().length > 0 &&
      preparedIngredients.length > 0 &&
      preparedIngredients.every((ingredient) => ingredient.hasName && ingredient.hasQuantity),
    [preparedIngredients, recipeName]
  );

  const addDraftIngredient = () => {
    setDraftIngredients((prev) => [...prev, createIngredientDraft()]);
  };

  const submitRecipe = () => {
    if (!canAddRecipe) {
      Alert.alert('入力不足', 'レシピ名と、個数またはグラムを入れた材料を入力してください。');
      return;
    }

    const ingredients = preparedIngredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    }));

    const ok = editingRecipeId
      ? updateRecipe(editingRecipeId, recipeName, ingredients)
      : addRecipe(recipeName, ingredients);

    if (!ok) {
      Alert.alert('入力不足', 'レシピ名、材料、個数またはグラムを入力してください。');
      return;
    }

    const message = editingRecipeId ? 'レシピを更新しました。' : 'レシピを登録しました。';

    setRecipeName('');
    setDraftIngredients([createIngredientDraft()]);
    setEditingRecipeId(null);
    setIsCreateOpen(false);
    Alert.alert('保存しました', message);
  };

  const closeCreateForm = () => {
    setRecipeName('');
    setDraftIngredients([createIngredientDraft()]);
    setEditingRecipeId(null);
    setIsCreateOpen(false);
  };

  const openCreateForm = () => {
    if (isCreateOpen) {
      closeCreateForm();
      return;
    }
    setEditingRecipeId(null);
    setRecipeName('');
    setDraftIngredients([createIngredientDraft()]);
    setIsCreateOpen(true);
  };

  const openEditForm = (id: string) => {
    const target = recipes.find((recipe) => recipe.id === id);
    if (!target) {
      return;
    }
    setEditingRecipeId(id);
    setRecipeName(target.name);
    setDraftIngredients(
      target.ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: String(ingredient.quantity),
        unit: ingredient.unit,
      }))
    );
    setIsCreateOpen(true);
  };

  const handleAddRecipeToShopping = (recipeId: string) => {
    if (process.env.EXPO_OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    addRecipeToShopping(recipeId);
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
      <Text style={styles.title}>レシピ</Text>
      <Text style={styles.helpText}>よく作る料理を登録して、材料ごとに個数やグラムを分けて追加できます。</Text>

      <View style={styles.section}>
        <Pressable
          style={styles.openCreateButton}
          onPress={openCreateForm}>
          <Text style={styles.openCreateButtonText}>
            {isCreateOpen ? '入力を閉じる' : '新しいレシピを作る'}
          </Text>
        </Pressable>

        {isCreateOpen ? (
          <>
            <Text style={styles.sectionTitle}>{editingRecipeId ? 'レシピを編集' : '新しいレシピを作る'}</Text>
            <TextInput
              value={recipeName}
              onChangeText={setRecipeName}
              placeholder="例: 肉じゃが"
              placeholderTextColor="#5d6b7a"
              style={styles.input}
            />

            <Text style={styles.helperText}>材料ごとに数量を入れて、必要なら単位をgに切り替えます。</Text>

            <View style={styles.ingredientList}>
              {draftIngredients.map((item) => (
                <View key={item.id} style={styles.ingredientCard}>
                  <View style={styles.ingredientHeader}>
                    <Text style={styles.ingredientLabel}>材料</Text>
                    <Pressable
                      style={styles.removeIngredientButton}
                      onPress={() =>
                        setDraftIngredients((prev) => prev.filter((ingredient) => ingredient.id !== item.id))
                      }>
                      <Text style={styles.removeIngredientButtonText}>削除</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    value={item.name}
                    onChangeText={(text) =>
                      setDraftIngredients((prev) =>
                        prev.map((ingredient) =>
                          ingredient.id === item.id ? { ...ingredient, name: text } : ingredient
                        )
                      )
                    }
                    placeholder="例: じゃがいも"
                    placeholderTextColor="#5d6b7a"
                    style={styles.input}
                  />

                  <View style={styles.row}>
                    <TextInput
                      value={item.quantity}
                      onChangeText={(text) =>
                        setDraftIngredients((prev) =>
                          prev.map((ingredient) =>
                            ingredient.id === item.id ? { ...ingredient, quantity: text } : ingredient
                          )
                        )
                      }
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor="#5d6b7a"
                      style={[styles.input, styles.quantityInput]}
                    />

                    <View style={styles.unitToggle}>
                      <Pressable
                        style={[styles.unitButton, item.unit === '個' && styles.unitButtonActive]}
                        onPress={() =>
                          setDraftIngredients((prev) =>
                            prev.map((ingredient) =>
                              ingredient.id === item.id ? { ...ingredient, unit: '個' } : ingredient
                            )
                          )
                        }>
                        <Text
                          style={[
                            styles.unitButtonText,
                            item.unit === '個' && styles.unitButtonTextActive,
                          ]}>
                          個
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[styles.unitButton, item.unit === 'g' && styles.unitButtonActive]}
                        onPress={() =>
                          setDraftIngredients((prev) =>
                            prev.map((ingredient) =>
                              ingredient.id === item.id ? { ...ingredient, unit: 'g' } : ingredient
                            )
                          )
                        }>
                        <Text
                          style={[
                            styles.unitButtonText,
                            item.unit === 'g' && styles.unitButtonTextActive,
                          ]}>
                          g
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <Pressable style={styles.addIngredientButton} onPress={addDraftIngredient}>
              <Text style={styles.addIngredientButtonText}>材料を追加</Text>
            </Pressable>

            {preparedIngredients.some((ingredient) => ingredient.isPartial) ? (
              <Text style={styles.errorText}>材料名と数量の両方を入れてください。</Text>
            ) : null}

            <View style={styles.formButtons}>
              <Pressable
                style={[styles.primaryButton, !canAddRecipe && styles.disabledButton]}
                onPress={submitRecipe}
                disabled={!canAddRecipe}>
                <Text style={styles.primaryButtonText}>{editingRecipeId ? '変更を保存' : 'レシピを保存'}</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={closeCreateForm}>
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>登録済みレシピ</Text>
        {recipes.map((recipe) => (
          <View key={recipe.id} style={styles.card}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {recipe.name}
            </Text>
            <Text style={styles.cardBody}>
              {recipe.ingredients.map((ingredient) => `${ingredient.name} ${ingredient.quantity}${ingredient.unit}`).join('、')}
            </Text>
            <View style={styles.cardButtons}>
              <Pressable
                style={({ pressed }) => [styles.listActionButton, pressed && styles.pressedButton]}
                onPress={() => handleAddRecipeToShopping(recipe.id)}>
                <Text style={styles.listActionButtonText}>買い物に追加</Text>
              </Pressable>
              <Pressable style={styles.listEditButton} onPress={() => openEditForm(recipe.id)}>
                <Text style={styles.listEditButtonText}>編集</Text>
              </Pressable>
              <Pressable style={styles.listDeleteButton} onPress={() => removeRecipe(recipe.id)}>
                <Text style={styles.deleteButtonText}>削除</Text>
              </Pressable>
            </View>
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
    width: 260,
    height: 260,
    backgroundColor: '#ffd9b8',
    top: -130,
    right: -80,
    opacity: 0.38,
  },
  blobBottom: {
    width: 300,
    height: 300,
    backgroundColor: '#f8c6d5',
    bottom: -40,
    left: -140,
    opacity: 0.22,
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
  openCreateButton: {
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: '#d95f3a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#9f4329',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 5,
  },
  openCreateButtonText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowInput: {
    flex: 1,
  },
  helperText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#735545',
  },
  ingredientList: {
    gap: 10,
  },
  ingredientCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3ddd0',
    backgroundColor: '#fff7f2',
    padding: 12,
    gap: 10,
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ingredientLabel: {
    fontSize: 20,
    color: '#664333',
    fontWeight: '800',
  },
  removeIngredientButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#f8ddd8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  removeIngredientButtonText: {
    fontSize: 18,
    color: '#8e2a1f',
    fontWeight: '800',
  },
  quantityInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    minWidth: 56,
    borderRadius: 12,
    backgroundColor: '#f4e8dd',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  unitButtonActive: {
    backgroundColor: '#d95f3a',
  },
  unitButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#5a3d2e',
  },
  unitButtonTextActive: {
    color: '#ffffff',
  },
  addIngredientButton: {
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#d95f3a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  addIngredientButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
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
    fontSize: 24,
    fontWeight: '800',
    color: '#3f2519',
  },
  cardBody: {
    fontSize: 20,
    lineHeight: 30,
    color: '#6b4b3b',
  },
  cardButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  errorText: {
    fontSize: 18,
    color: '#ab2e1f',
    fontWeight: '700',
  },
  formButtons: {
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
  primaryButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
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
  cancelButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#efe4da',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  cancelButtonText: {
    fontSize: 22,
    color: '#5a4032',
    fontWeight: '800',
  },
  listActionButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#4eb9e6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  pressedButton: {
    opacity: 0.65,
  },
  listActionButtonText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#ffffff',
  },
  listDeleteButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#f8ddd8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  listEditButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#efe4da',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  listEditButtonText: {
    fontSize: 22,
    color: '#5a4032',
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.45,
  },
});

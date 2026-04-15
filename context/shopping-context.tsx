import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type IngredientUnit = '個' | 'g';

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: IngredientUnit;
};

export type Recipe = {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
};

export type FavoriteIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: IngredientUnit;
};

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  quantity: number;
  unit: IngredientUnit;
};

export type PriceMemo = {
  id: string;
  storeName: string;
  weekdays: string[];
  cheapItem: string;
  note: string;
};

type ShoppingState = {
  recipes: Recipe[];
  favorites: FavoriteIngredient[];
  shoppingItems: ShoppingItem[];
  priceMemos: PriceMemo[];
};

type ShoppingContextValue = ShoppingState & {
  isReady: boolean;
  addRecipe: (name: string, ingredients: RecipeIngredient[]) => boolean;
  updateRecipe: (id: string, name: string, ingredients: RecipeIngredient[]) => boolean;
  removeRecipe: (id: string) => void;
  addRecipeToShopping: (id: string) => void;
  addFavorite: (name: string, quantity: number, unit: IngredientUnit) => boolean;
  updateFavorite: (id: string, name: string, quantity: number, unit: IngredientUnit) => boolean;
  removeFavorite: (id: string) => void;
  addFavoriteToShopping: (id: string) => void;
  addPriceMemo: (storeName: string, weekdays: string[], cheapItem: string, note: string) => boolean;
  updatePriceMemo: (
    id: string,
    storeName: string,
    weekdays: string[],
    cheapItem: string,
    note: string
  ) => boolean;
  removePriceMemo: (id: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearCheckedItems: () => void;
};

const STORAGE_KEY = 'kaimono-data-v1';

const defaultState: ShoppingState = {
  recipes: [
    {
      id: 'r-curry',
      name: 'カレー',
      ingredients: [
        { id: 'i-curry-potato', name: 'じゃがいも', quantity: 2, unit: '個' },
        { id: 'i-curry-carrot', name: 'にんじん', quantity: 1, unit: '個' },
        { id: 'i-curry-onion', name: '玉ねぎ', quantity: 2, unit: '個' },
        { id: 'i-curry-meat', name: '肉', quantity: 200, unit: 'g' },
      ],
    },
    {
      id: 'r-stew',
      name: 'シチュー',
      ingredients: [
        { id: 'i-stew-milk', name: '牛乳', quantity: 400, unit: 'g' },
        { id: 'i-stew-potato', name: 'じゃがいも', quantity: 2, unit: '個' },
        { id: 'i-stew-carrot', name: 'にんじん', quantity: 1, unit: '個' },
        { id: 'i-stew-onion', name: '玉ねぎ', quantity: 2, unit: '個' },
      ],
    },
  ],
  favorites: [
    { id: 'f-natto', name: '納豆', quantity: 1, unit: '個' },
    { id: 'f-egg', name: '卵', quantity: 6, unit: '個' },
  ],
  shoppingItems: [],
  priceMemos: [],
};

const ShoppingContext = createContext<ShoppingContextValue | undefined>(undefined);

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeQuantity(value: number) {
  const safe = Number.isFinite(value) ? Math.floor(value) : 1;
  return Math.max(1, safe);
}

function normalizeUnit(value: unknown): IngredientUnit {
  return value === 'g' ? 'g' : '個';
}

function normalizeWeekdays(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  value.forEach((item) => {
    const day = normalizeName(typeof item === 'string' ? item : '');
    if (day.length === 0 || seen.has(day)) {
      return;
    }
    seen.add(day);
    normalized.push(day);
  });

  return normalized;
}

function normalizeIngredient(
  ingredient: Partial<RecipeIngredient> & { id?: string; name?: string; quantity?: number; unit?: unknown },
  fallbackQuantity = 1
): RecipeIngredient {
  return {
    id: ingredient.id ?? makeId('i'),
    name: normalizeName(ingredient.name ?? ''),
    quantity: normalizeQuantity(ingredient.quantity ?? fallbackQuantity),
    unit: normalizeUnit(ingredient.unit),
  };
}

function migrateRecipe(recipe: any): Recipe | null {
  const name = normalizeName(recipe?.name ?? '');
  if (!name) {
    return null;
  }

  const quantity = normalizeQuantity(recipe?.households ?? 1);
  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients
        .map((ingredient: any, index: number) =>
          typeof ingredient === 'string'
            ? normalizeIngredient(
                { id: `${recipe?.id ?? 'r'}-i-${index}`, name: ingredient, quantity, unit: '個' },
                quantity
              )
            : normalizeIngredient(ingredient, quantity)
        )
        .filter((ingredient: RecipeIngredient) => ingredient.name.length > 0)
    : [];

  if (ingredients.length === 0) {
    return null;
  }

  return {
    id: typeof recipe?.id === 'string' && recipe.id ? recipe.id : makeId('r'),
    name,
    ingredients,
  };
}

function migrateShoppingItem(item: any): ShoppingItem | null {
  const name = normalizeName(item?.name ?? '');
  if (!name) {
    return null;
  }

  return {
    id: typeof item?.id === 'string' && item.id ? item.id : makeId('s'),
    name,
    checked: Boolean(item?.checked),
    quantity: normalizeQuantity(item?.quantity ?? 1),
    unit: normalizeUnit(item?.unit),
  };
}

function migrateState(rawState: any): ShoppingState {
  return {
    recipes: Array.isArray(rawState?.recipes)
      ? rawState.recipes
          .map(migrateRecipe)
          .filter((recipe: Recipe | null): recipe is Recipe => Boolean(recipe))
      : defaultState.recipes,
    favorites: Array.isArray(rawState?.favorites)
      ? rawState.favorites
          .map((favorite: any) => ({
            id: typeof favorite?.id === 'string' && favorite.id ? favorite.id : makeId('f'),
            name: normalizeName(favorite?.name ?? ''),
            quantity: normalizeQuantity(favorite?.quantity ?? 1),
            unit: normalizeUnit(favorite?.unit),
          }))
          .filter((favorite: FavoriteIngredient) => favorite.name.length > 0)
      : defaultState.favorites,
    shoppingItems: Array.isArray(rawState?.shoppingItems)
      ? rawState.shoppingItems
          .map(migrateShoppingItem)
          .filter((item: ShoppingItem | null): item is ShoppingItem => Boolean(item))
      : defaultState.shoppingItems,
    priceMemos: Array.isArray(rawState?.priceMemos)
      ? rawState.priceMemos
          .map((memo: any) => ({
            id: typeof memo?.id === 'string' && memo.id ? memo.id : makeId('m'),
            storeName: normalizeName(memo?.storeName ?? ''),
            weekdays: normalizeWeekdays(
              Array.isArray(memo?.weekdays)
                ? memo.weekdays
                : typeof memo?.weekday === 'string' && memo.weekday.length > 0
                  ? [memo.weekday]
                  : []
            ),
            cheapItem: normalizeName(memo?.cheapItem ?? ''),
            note: normalizeName(memo?.note ?? ''),
          }))
          .filter((memo: PriceMemo) => memo.storeName.length > 0 && memo.cheapItem.length > 0)
      : defaultState.priceMemos,
  };
}

export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ShoppingState>(defaultState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const raw = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem('kaimono-data-v1'));
        if (!raw || !active) {
          return;
        }
        const parsed = JSON.parse(raw);
        setState(migrateState(parsed));
      } catch {
        // If parsing fails, keep defaults.
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Ignore write failures and keep app usable.
    });
  }, [state, isReady]);

  const addToShoppingByIngredient = useCallback((ingredient: RecipeIngredient) => {
    const normalized = normalizeName(ingredient.name);
    const safeAmount = normalizeQuantity(ingredient.quantity);
    const unit = normalizeUnit(ingredient.unit);
    if (!normalized) {
      return;
    }

    setState((prev) => {
      const existing = prev.shoppingItems.find(
        (item) =>
          item.name.toLocaleLowerCase() === normalized.toLocaleLowerCase() && item.unit === unit
      );

      if (existing) {
        return {
          ...prev,
          shoppingItems: prev.shoppingItems.map((item) =>
            item.id === existing.id
              ? {
                  ...item,
                  checked: false,
                  quantity: item.quantity + safeAmount,
                }
              : item
          ),
        };
      }

      return {
        ...prev,
        shoppingItems: [
          ...prev.shoppingItems,
          {
            id: makeId('s'),
            name: normalized,
            checked: false,
            quantity: safeAmount,
            unit,
          },
        ],
      };
    });
  }, []);

  const addRecipe = useCallback((name: string, ingredients: RecipeIngredient[]) => {
    const recipeName = normalizeName(name);
    const normalizedIngredients = ingredients
      .map((ingredient) => normalizeIngredient(ingredient))
      .filter((ingredient) => ingredient.name.length > 0);

    if (!recipeName || normalizedIngredients.length === 0) {
      return false;
    }

    setState((prev) => ({
      ...prev,
      recipes: [
        ...prev.recipes,
        {
          id: makeId('r'),
          name: recipeName,
          ingredients: normalizedIngredients,
        },
      ],
    }));
    return true;
  }, []);

  const updateRecipe = useCallback(
    (id: string, name: string, ingredients: RecipeIngredient[]) => {
      const recipeName = normalizeName(name);
      const normalizedIngredients = ingredients
        .map((ingredient) => normalizeIngredient(ingredient))
        .filter((ingredient) => ingredient.name.length > 0);

      if (!recipeName || normalizedIngredients.length === 0) {
        return false;
      }

      setState((prev) => ({
        ...prev,
        recipes: prev.recipes.map((recipe) =>
          recipe.id === id
            ? {
                ...recipe,
                name: recipeName,
                ingredients: normalizedIngredients,
              }
            : recipe
        ),
      }));

      return true;
    },
    []
  );

  const removeRecipe = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recipes: prev.recipes.filter((recipe) => recipe.id !== id),
    }));
  }, []);

  const addRecipeToShopping = useCallback(
    (id: string) => {
      const recipe = state.recipes.find((item) => item.id === id);
      if (!recipe) {
        return;
      }
      recipe.ingredients.forEach((ingredient) => addToShoppingByIngredient(ingredient));
    },
    [addToShoppingByIngredient, state.recipes]
  );

  const addFavorite = useCallback((name: string, quantity: number, unit: IngredientUnit) => {
    const normalized = normalizeName(name);
    const safeAmount = normalizeQuantity(quantity);
    const safeUnit = normalizeUnit(unit);
    if (!normalized) {
      return false;
    }
    setState((prev) => ({
      ...prev,
      favorites: [
        ...prev.favorites,
        { id: makeId('f'), name: normalized, quantity: safeAmount, unit: safeUnit },
      ],
    }));
    return true;
  }, []);

  const updateFavorite = useCallback(
    (id: string, name: string, quantity: number, unit: IngredientUnit) => {
      const normalized = normalizeName(name);
      const safeAmount = normalizeQuantity(quantity);
      const safeUnit = normalizeUnit(unit);

      if (!normalized) {
        return false;
      }

      setState((prev) => ({
        ...prev,
        favorites: prev.favorites.map((item) =>
          item.id === id
            ? {
                ...item,
                name: normalized,
                quantity: safeAmount,
                unit: safeUnit,
              }
            : item
        ),
      }));

      return true;
    },
    []
  );

  const removeFavorite = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      favorites: prev.favorites.filter((item) => item.id !== id),
    }));
  }, []);

  const addFavoriteToShopping = useCallback(
    (id: string) => {
      const favorite = state.favorites.find((item) => item.id === id);
      if (!favorite) {
        return;
      }
      addToShoppingByIngredient({
        id: makeId('i'),
        name: favorite.name,
        quantity: favorite.quantity,
        unit: favorite.unit,
      });
    },
    [addToShoppingByIngredient, state.favorites]
  );

  const addPriceMemo = useCallback(
    (storeName: string, weekdays: string[], cheapItem: string, note: string) => {
      const normalizedStore = normalizeName(storeName);
      const normalizedWeekdays = normalizeWeekdays(weekdays);
      const normalizedCheapItem = normalizeName(cheapItem);
      const normalizedNote = normalizeName(note);

      if (!normalizedStore || !normalizedCheapItem) {
        return false;
      }

      setState((prev) => ({
        ...prev,
        priceMemos: [
          ...prev.priceMemos,
          {
            id: makeId('m'),
            storeName: normalizedStore,
            weekdays: normalizedWeekdays,
            cheapItem: normalizedCheapItem,
            note: normalizedNote,
          },
        ],
      }));

      return true;
    },
    []
  );

  const updatePriceMemo = useCallback(
    (id: string, storeName: string, weekdays: string[], cheapItem: string, note: string) => {
      const normalizedStore = normalizeName(storeName);
      const normalizedWeekdays = normalizeWeekdays(weekdays);
      const normalizedCheapItem = normalizeName(cheapItem);
      const normalizedNote = normalizeName(note);

      if (!normalizedStore || !normalizedCheapItem) {
        return false;
      }

      setState((prev) => ({
        ...prev,
        priceMemos: prev.priceMemos.map((memo) =>
          memo.id === id
            ? {
                ...memo,
                storeName: normalizedStore,
                weekdays: normalizedWeekdays,
                cheapItem: normalizedCheapItem,
                note: normalizedNote,
              }
            : memo
        ),
      }));

      return true;
    },
    []
  );

  const removePriceMemo = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      priceMemos: prev.priceMemos.filter((memo) => memo.id !== id),
    }));
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingItems: prev.shoppingItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
  }, []);

  const removeShoppingItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingItems: prev.shoppingItems.filter((item) => item.id !== id),
    }));
  }, []);

  const clearCheckedItems = useCallback(() => {
    setState((prev) => ({
      ...prev,
      shoppingItems: prev.shoppingItems.filter((item) => !item.checked),
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isReady,
      addRecipe,
      updateRecipe,
      removeRecipe,
      addRecipeToShopping,
      addFavorite,
      updateFavorite,
      removeFavorite,
      addFavoriteToShopping,
      addPriceMemo,
      updatePriceMemo,
      removePriceMemo,
      toggleShoppingItem,
      removeShoppingItem,
      clearCheckedItems,
    }),
    [
      addFavorite,
      addFavoriteToShopping,
      addPriceMemo,
      addRecipe,
      updateRecipe,
      addRecipeToShopping,
      clearCheckedItems,
      isReady,
      removePriceMemo,
      removeFavorite,
      removeRecipe,
      removeShoppingItem,
      state,
      toggleShoppingItem,
      updatePriceMemo,
      updateFavorite,
    ]
  );

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping() {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error('useShopping must be used within ShoppingProvider');
  }
  return context;
}

import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#d95f3a',
        tabBarInactiveTintColor: '#7d8ea3',
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          borderRadius: 22,
          backgroundColor: '#fff8f2',
          borderTopWidth: 0,
          height: 76,
          paddingTop: 10,
          paddingBottom: 10,
          shadowColor: '#502311',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: '700',
        },
        sceneStyle: {
          backgroundColor: isDark ? '#f6f8fb' : '#f6f8fb',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'レシピ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'よく使う',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: '買い物',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="memo"
        options={{
          title: 'メモ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="note.text" color={color} />,
        }}
      />
    </Tabs>
  );
}

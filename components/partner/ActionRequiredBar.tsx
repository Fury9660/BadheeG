import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { IconButton } from '../ui/IconButton';

type Props = {
  items?: { id: string; label: string; count?: number }[];
  onPress?: () => void;
};

export const ActionRequiredBar: React.FC<Props> = ({ items = [], onPress }) => {
  const { isDarkMode } = useTheme();

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={[styles.container, { backgroundColor: isDarkMode ? '#1F1F1F' : '#FFF8E1' }]}>
      <View style={styles.left}>
        <IconButton name="notification-important" size={20} color={isDarkMode ? '#FFD700' : '#C47A00'} backgroundColor="transparent" />
        <Text style={[styles.title, { color: isDarkMode ? '#FFD700' : '#C47A00' }]}>Action Required</Text>
      </View>

      <View style={styles.right}>
        {items.length === 0 ? (
          <Text style={[styles.noItem, { color: isDarkMode ? '#BBB' : '#666' }]}>All clear</Text>
        ) : (
          items.map(it => (
            <View key={it.id} style={styles.badgeWrap}>
              <Text style={[styles.badgeText, { color: isDarkMode ? '#FFF' : '#000' }]}>{it.count ?? 0}</Text>
              <Text style={[styles.badgeLabel, { color: isDarkMode ? '#CCC' : '#444' }]}>{it.label}</Text>
            </View>
          ))
        )}
        <IconButton name="chevron-right" size={26} color={isDarkMode ? '#888' : '#222'} backgroundColor="transparent" style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  title: { marginLeft: 8, fontWeight: '700', fontSize: 15 },
  right: { flexDirection: 'row', alignItems: 'center' },
  badgeWrap: { alignItems: 'center', marginLeft: 12 },
  badgeText: { fontWeight: '700', fontSize: 14 },
  badgeLabel: { fontSize: 12, marginTop: 2 },
  noItem: { fontSize: 14, fontWeight: '600' },
});

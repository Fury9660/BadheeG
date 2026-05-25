import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/ThemeContext';

export const BusinessHealthScore: React.FC<{ score?: number }>= ({ score = 4.2 }) => {
  const { isDarkMode } = useTheme();
  const stars = Math.round(score);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#181818' : '#fff' }]}>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#111' }]}>Business Health</Text>
      <View style={styles.row}>
        <View style={[styles.circle, { borderColor: '#FFD700' }]}>
          <Text style={styles.scoreText}>{score.toFixed(1)}</Text>
        </View>
        <View style={styles.starsWrap}>
          {Array.from({ length: 5 }).map((_, i) => (
            <MaterialIcons key={i} name={i < stars ? 'star' : 'star-border'} size={22} color={i < stars ? '#FFD700' : (isDarkMode ? '#666' : '#BBB')} />
          ))}
          <Text style={[styles.subText, { color: isDarkMode ? '#ddd' : '#444' }]}>{`(${score.toFixed(1)}/5)`}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 12, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circle: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 18, fontWeight: '700', color: '#FFD700' },
  starsWrap: { marginLeft: 12, alignItems: 'flex-start' },
  subText: { fontSize: 12, marginTop: 6 },
});


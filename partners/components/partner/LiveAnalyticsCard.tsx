import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../store/ThemeContext';
import { IconButton } from '../ui/IconButton';
import * as Haptics from 'expo-haptics';

export const LiveAnalyticsCard: React.FC<{ data?: number[] }>= ({ data = [1200,3500,5000,9000,12500] }) => {
  const { isDarkMode } = useTheme();
  const width = Math.min(Dimensions.get('window').width - 48, 360);
  const chartConfig = {
    backgroundGradientFrom: isDarkMode ? '#181818' : '#fff',
    backgroundGradientTo: isDarkMode ? '#181818' : '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`,
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#FFD700' },
  };

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const onExport = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#111' }]}>Today's Sales</Text>
        <View style={styles.actions}>
          <IconButton name="refresh-cw" size={18} color={isDarkMode ? '#FFD700' : '#333'} backgroundColor="transparent" onPress={onRefresh} />
          <IconButton name="download" size={18} color={isDarkMode ? '#FFD700' : '#333'} backgroundColor="transparent" onPress={onExport} style={{ marginLeft: 8 }} />
        </View>
      </View>

      <LineChart
        data={{ labels: ['9AM','12PM','3PM','6PM','9PM'], datasets:[{ data }]}}
        width={width}
        height={110}
        chartConfig={chartConfig}
        withDots
        withInnerLines={false}
        withOuterLines={false}
        bezier
        style={{ borderRadius: 8 }}
      />
      <Text style={[styles.stats, { color: isDarkMode ? '#ddd' : '#333' }]}>₹12,500 | 34 Orders | 5 Pending</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  stats: { marginTop: 8, fontSize: 15 },
});

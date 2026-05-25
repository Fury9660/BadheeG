import React from 'react';
import { TouchableOpacity, StyleSheet, GestureResponderEvent, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  name: React.ComponentProps<typeof Feather>['name'];
  size?: number;
  color?: string;
  onPress?: (e: GestureResponderEvent) => void;
  backgroundColor?: string | 'transparent';
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

const IconButtonInner: React.FC<Props> = ({
  name,
  size = 20,
  color = '#fff',
  onPress,
  backgroundColor = 'transparent',
  style,
  disabled = false,
  accessibilityLabel,
  testID,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      testID={testID}
      hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
      style={[styles.touch, backgroundColor ? { backgroundColor } : undefined, style]}
    >
      <Feather name={name} size={size} color={color} />
    </TouchableOpacity>
  );
};

export const IconButton = React.memo(IconButtonInner);

const styles = StyleSheet.create({
  touch: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

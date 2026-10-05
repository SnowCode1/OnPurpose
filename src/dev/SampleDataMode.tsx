import { Text } from '../Typography';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { localDateKey } from '../calendar';
import type { ChangeStore } from '../storage/store';
import { createSampleStore } from './sampleData';

export function SampleDataMode({
  store,
  children,
}: {
  store: ChangeStore;
  children: (
    activeStore: ChangeStore,
    sample: boolean,
    controls: ReactNode,
  ) => ReactNode;
}) {
  const [enabled, setEnabled] = useState(
    process.env.EXPO_PUBLIC_DEV_MOCK_DATA === 'true',
  );
  const [sample, setSample] = useState<ChangeStore | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!enabled || sample) return;
    let active = true;
    void createSampleStore(localDateKey(new Date()))
      .then((value) => {
        if (active) setSample(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [enabled, sample]);
  const controls = (
    <View style={styles.controls}>
      <Text style={styles.eyebrow}>DEVELOPMENT</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Sample data</Text>
        <Switch
          accessibilityLabel="Use sample data instead of real data"
          value={enabled}
          onValueChange={(value) => {
            setError(false);
            setEnabled(value);
          }}
          trackColor={{ false: '#303030', true: '#74BBA5' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#303030"
        />
      </View>
      <Text style={styles.description}>
        {enabled
          ? 'Six months of fictional history. Edits stay in this preview session; turn this off to return to your real data.'
          : 'Try statistics with six months of fictional history. Your real data stays separate.'}
      </Text>
      {enabled && (
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() => {
            setError(false);
            setSample(null);
          }}
        >
          <Text style={styles.label}>Reset sample data</Text>
        </Pressable>
      )}
    </View>
  );
  if (enabled && !sample)
    return (
      <View style={styles.loading}>
        {error ? (
          <Text style={styles.description}>
            Sample data could not be opened.
          </Text>
        ) : (
          <ActivityIndicator
            color="#82E6BC"
            accessibilityLabel="Preparing sample history"
          />
        )}
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() => setEnabled(false)}
        >
          <Text style={styles.label}>Return to real data</Text>
        </Pressable>
      </View>
    );
  return children(enabled ? sample! : store, enabled, controls);
}
const styles = StyleSheet.create({
  controls: { gap: 12, marginBottom: 28 },
  eyebrow: {
    color: '#858585',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: { fontSize: 17, color: '#E0E0E0', fontWeight: '500', flexShrink: 1 },
  description: { color: '#969696', fontSize: 14, lineHeight: 21 },
  button: {
    minHeight: 48,
    padding: 14,
    backgroundColor: '#151515',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loading: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
});

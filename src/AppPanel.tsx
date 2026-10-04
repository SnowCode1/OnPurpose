import { type ComponentType } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  type TextProps,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';

export function AppPanel({
  page,
  visible,
  HeadingComponent,
  hapticsEnabled,
  onHapticsChange,
  onClose,
}: {
  page: 'history' | 'settings';
  visible: boolean;
  HeadingComponent: ComponentType<TextProps>;
  hapticsEnabled: boolean;
  onHapticsChange: (enabled: boolean) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      allowSwipeDismissal
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      onRequestClose={onClose}
      backdropColor="#000000"
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <View accessibilityViewIsModal style={styles.content}>
            <View style={styles.header}>
              <HeadingComponent accessibilityRole="header" style={styles.title}>
                {page === 'history' ? 'History' : 'Settings'}
              </HeadingComponent>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Close ${page}`}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.close,
                  { opacity: pressed ? 0.55 : 1 },
                ]}
              >
                <Icon name="close" size={18} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              {page === 'history' ? (
                <View style={styles.empty}>
                  <Icon name="history" size={36} color="#747474" />
                  <Text style={styles.emptyTitle}>History is coming next</Text>
                  <Text style={[styles.description, { textAlign: 'center' }]}>
                    A record of your changes, with undo.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.section}>FEEDBACK</Text>
                  <View style={styles.preference}>
                    <View style={styles.preferenceText}>
                      <Text style={styles.label}>Haptic feedback</Text>
                      <Text style={styles.description}>
                        A short pulse when you record or change something.
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel="Haptic feedback"
                      value={hapticsEnabled}
                      onValueChange={onHapticsChange}
                      trackColor={{ false: '#303030', true: '#74BBA5' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#303030"
                    />
                  </View>
                  <View style={styles.about}>
                    <Text style={styles.aboutName}>OnPurpose · Preview</Text>
                    <Text style={styles.description}>
                      Entries and settings reset when the app is reloaded.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: {
    minHeight: 72,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: { flexShrink: 1, fontSize: 24, fontWeight: '600', color: '#E8E8E8' },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexGrow: 1, padding: 24, paddingTop: 20 },
  section: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.3,
    color: '#858585',
  },
  preference: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#252525',
  },
  preferenceText: { flex: 1, gap: 6 },
  label: { fontSize: 17, fontWeight: '500', color: '#E0E0E0' },
  description: { fontSize: 14, lineHeight: 21, color: '#969696' },
  about: { marginTop: 36, gap: 6 },
  aboutName: { fontSize: 13, fontWeight: '500', color: '#B8B8B8' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 14 },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '500',
    color: '#DDDDDD',
    textAlign: 'center',
  },
});

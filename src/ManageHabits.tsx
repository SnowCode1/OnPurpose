import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Habit } from './habits';
import { Icon } from './Icon';
export function ManageHabits({
  habits,
  editable,
  onAdd,
  onEdit,
  onRestore,
  onReorder,
}: {
  habits: Habit[];
  editable: boolean;
  onAdd: () => void;
  onEdit: (habit: Habit) => void;
  onRestore: (habit: Habit) => void;
  onReorder: () => void;
}) {
  const action = (label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      disabled={!editable}
      accessibilityState={{ disabled: !editable }}
      onPress={onPress}
      style={{
        minHeight: 48,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#171717',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: editable ? 1 : 0.4,
      }}
    >
      <Text style={{ color: '#DDDDDD', fontSize: 15, fontWeight: '500' }}>
        {label}
      </Text>
    </Pressable>
  );
  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingTop: 8, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>{action('＋ Add habit', onAdd)}</View>
        <View style={{ flex: 1 }}>{action('Arrange', onReorder)}</View>
      </View>
      <Text
        style={{
          color: '#888888',
          fontSize: 12,
          lineHeight: 18,
          marginBottom: 8,
        }}
      >
        Tap a habit to edit. On the grid, hold its name for actions or keep
        holding and drag to arrange.
      </Text>
      {[false, true].map((archived) => (
        <View key={String(archived)}>
          <Text
            style={{
              color: '#888888',
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1,
              marginVertical: 12,
            }}
          >
            {archived ? 'ARCHIVED' : 'YOUR HABITS'}
          </Text>
          {habits
            .filter((habit) => !!habit.archived === archived)
            .map((habit) => (
              <View
                key={habit.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottomWidth: 0.5,
                  borderBottomColor: '#252525',
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  disabled={!editable}
                  accessibilityLabel={`Edit ${habit.name}`}
                  onPress={() => onEdit(habit)}
                  style={{
                    flex: 1,
                    minHeight: 56,
                    justifyContent: 'center',
                    paddingVertical: 12,
                    paddingRight: 12,
                  }}
                >
                  <Text style={{ color: habit.color, fontSize: 16 }}>
                    {habit.name}
                  </Text>
                </Pressable>
                {archived ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={!editable}
                    onPress={() => onRestore(habit)}
                    accessibilityLabel={`Restore ${habit.name}`}
                    style={{
                      minHeight: 44,
                      padding: 12,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#CCCCCC', fontSize: 13 }}>
                      Restore
                    </Text>
                  </Pressable>
                ) : (
                  <Icon name="edit" size={16} />
                )}
              </View>
            ))}
          {!habits.some((habit) => !!habit.archived === archived) && (
            <Text
              style={{ color: '#666666', fontSize: 13, marginVertical: 12 }}
            >
              {archived
                ? 'No archived habits.'
                : 'Add your first habit to get started.'}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

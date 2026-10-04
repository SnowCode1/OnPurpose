export type Habit = { id: string; name: string; color: string; unit?: string };

export const habitColors = [
  { name: 'Mint', value: '#82E6BC' },
  { name: 'Lavender', value: '#BDA5FF' },
  { name: 'Sky', value: '#84C9FF' },
  { name: 'Peach', value: '#FFB38A' },
  { name: 'Rose', value: '#FF9ABD' },
  { name: 'Lime', value: '#C5E788' },
  { name: 'Aqua', value: '#7DDDD9' },
  { name: 'Gold', value: '#F6D780' },
];

export const demoHabits: Habit[] = [
  { id: 'walk', name: 'Go for a walk', color: '#82E6BC' },
  { id: 'read', name: 'Read', unit: 'minutes', color: '#BDA5FF' },
  { id: 'water', name: 'Drink water', unit: 'glasses', color: '#84C9FF' },
  { id: 'stretch', name: 'Stretch', color: '#FFB38A' },
  { id: 'journal', name: 'Write a little', color: '#FF9ABD' },
  { id: 'outside', name: 'Get outside', color: '#C5E788' },
  { id: 'meditate', name: 'Meditate', color: '#7DDDD9' },
  { id: 'cook', name: 'Cook a meal', color: '#F6D780' },
  { id: 'tidy', name: 'Tidy up', color: '#82E6BC' },
  { id: 'connect', name: 'Call someone', color: '#BDA5FF' },
  { id: 'learn', name: 'Learn something', color: '#84C9FF' },
  { id: 'sleep', name: 'Wind down', color: '#FFB38A' },
];

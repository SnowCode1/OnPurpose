import { Alert, Linking } from 'react-native';
import { descriptionLink } from './description';

export async function openDescriptionLink(url: string): Promise<void> {
  const link = descriptionLink(url);
  if (!link) return;
  try {
    await Linking.openURL(link);
  } catch {
    Alert.alert(
      'Couldn’t open link',
      'Check the address or whether its app is installed.',
    );
  }
}

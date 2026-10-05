import { memo, type ReactNode } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { contrastOnBlack } from './colors';
import {
  parseDescription,
  descriptionLink,
  type DescriptionToken,
} from './description';

type Node = { token: DescriptionToken; children: Node[] };
function tree(tokens: DescriptionToken[]) {
  const root: Node[] = [],
    stack = [root];
  for (const token of tokens) {
    if (token.nesting === -1) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const node = { token, children: [] as Node[] };
    stack.at(-1)!.push(node);
    if (token.nesting === 1) stack.push(node.children);
  }
  return root;
}
async function openLink(url: string) {
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
export const DescriptionText = memo(function DescriptionText({
  text,
  tokens,
  colour,
}: {
  text?: string;
  tokens?: DescriptionToken[];
  colour: string;
}) {
  const linkColour = contrastOnBlack(colour) >= 4.5 ? colour : '#B7DCCF';
  function inline(nodes: Node[]): ReactNode[] {
    return nodes.map(({ token, children }, index) => {
      if (token.type === 'text' || token.type === 'html_inline')
        return token.content;
      if (token.type === 'softbreak' || token.type === 'hardbreak') return '\n';
      if (token.type === 'image') return token.content; // Alt text only; no unsolicited network loads.
      if (token.type === 'code_inline')
        return (
          <Text key={index} style={styles.inlineCode}>
            {token.content}
          </Text>
        );
      if (token.type === 'link_open') {
        const url = String(token.attrGet('href') ?? '');
        return (
          <Text
            key={index}
            accessibilityRole="link"
            accessibilityHint={`Open ${url}`}
            onPress={() => {
              void openLink(url);
            }}
            style={{ color: linkColour, textDecorationLine: 'underline' }}
          >
            {inline(children)}
          </Text>
        );
      }
      return (
        <Text
          key={index}
          style={
            token.type === 'strong_open'
              ? styles.bold
              : token.type === 'em_open'
                ? styles.italic
                : token.type === 's_open'
                  ? styles.strike
                  : undefined
          }
        >
          {inline(children)}
        </Text>
      );
    });
  }
  function blocks(nodes: Node[]): ReactNode[] {
    return nodes.map(({ token, children }, index) => {
      if (token.type === 'inline')
        return (
          <Text key={index} selectable style={styles.body}>
            {inline(tree(token.children ?? []))}
          </Text>
        );
      if (token.type === 'paragraph_open')
        return (
          <View key={index} style={{ marginBottom: token.hidden ? 0 : 8 }}>
            {blocks(children)}
          </View>
        );
      if (token.type === 'heading_open')
        return (
          <Text
            key={index}
            selectable
            accessibilityRole="header"
            style={[
              styles.body,
              {
                fontSize:
                  token.tag === 'h1' ? 23 : token.tag === 'h2' ? 19 : 16,
                lineHeight: token.tag === 'h1' ? 30 : 25,
                fontWeight: '600',
                marginBottom: 8,
              },
            ]}
          >
            {children.map((child) => inline(tree(child.token.children ?? [])))}
          </Text>
        );
      if (
        token.type === 'bullet_list_open' ||
        token.type === 'ordered_list_open'
      ) {
        const start = Number(token.attrGet('start') ?? 1);
        return (
          <View key={index} style={{ gap: 6, marginBottom: 8 }}>
            {children.map((child, item) => (
              <View key={item} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={[styles.body, { minWidth: 18 }]}>
                  {token.type === 'ordered_list_open'
                    ? `${start + item}.`
                    : '•'}
                </Text>
                <View style={{ flex: 1 }}>{blocks(child.children)}</View>
              </View>
            ))}
          </View>
        );
      }
      if (token.type === 'blockquote_open')
        return (
          <View key={index} style={styles.quote}>
            {blocks(children)}
          </View>
        );
      if (token.type === 'code_block' || token.type === 'fence')
        return (
          <Text key={index} selectable style={styles.code}>
            {token.content.replace(/\n$/, '')}
          </Text>
        );
      if (token.type === 'hr') return <View key={index} style={styles.rule} />;
      return <View key={index}>{blocks(children)}</View>;
    });
  }
  return <View>{blocks(tree(tokens ?? parseDescription(text ?? '')))}</View>;
});
const styles = StyleSheet.create({
  body: { color: '#C7C7C7', fontSize: 15, lineHeight: 23 },
  bold: { fontWeight: '700', color: '#E2E2E2' },
  italic: { fontStyle: 'italic' },
  strike: { textDecorationLine: 'line-through' },
  inlineCode: { fontFamily: 'monospace', backgroundColor: '#202020' },
  quote: {
    borderLeftWidth: 2,
    borderLeftColor: '#505050',
    paddingLeft: 12,
    marginBottom: 8,
  },
  code: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'monospace',
    padding: 12,
    backgroundColor: '#151515',
    borderRadius: 8,
    marginBottom: 8,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#303030',
    marginVertical: 10,
  },
});

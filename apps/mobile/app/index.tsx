import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Banker&apos;sCircle</Text>
      <Text style={styles.subtitle}>
        A private, verified community for financial-services professionals in Lagos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  title: { fontSize: 32, fontWeight: '600' },
  subtitle: { fontSize: 17, color: '#525252' },
});

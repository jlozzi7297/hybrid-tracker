
import { Colors } from '@/constants/theme';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function NutritionScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const styles = createStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>FUEL YOUR PROGRESS</Text>
      <Text style={styles.title}>Nutrition</Text>
      <Text style={styles.subtitle}>Track your daily nutrition.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Calories</Text>
        <Text style={styles.number}>1,850 / 2,600</Text>

        <View style={styles.progressBackground}>
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.muted}>750 calories remaining</Text>
      </View>

      <Text style={styles.heading}>Daily Macros</Text>

      <View style={styles.card}>
        <View style={styles.macroRow}>
          <Text style={styles.label}>Protein</Text>
          <Text style={styles.value}>112 / 150 g</Text>
        </View>

        <View style={styles.macroRow}>
          <Text style={styles.label}>Carbs</Text>
          <Text style={styles.value}>180 / 300 g</Text>
        </View>

        <View style={styles.macroRow}>
          <Text style={styles.label}>Fat</Text>
          <Text style={styles.value}>55 / 80 g</Text>
        </View>
      </View>

      <Text style={styles.heading}>Today's Food</Text>

      <View style={styles.card}>
        <View style={styles.foodRow}>
          <View>
            <Text style={styles.foodName}>Chicken and Rice</Text>
            <Text style={styles.muted}>45 g protein</Text>
          </View>
          <Text style={styles.value}>520 kcal</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.foodRow}>
          <View>
            <Text style={styles.foodName}>Greek Yogurt</Text>
            <Text style={styles.muted}>20 g protein</Text>
          </View>
          <Text style={styles.value}>180 kcal</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.foodRow}>
          <View>
            <Text style={styles.foodName}>Protein Shake</Text>
            <Text style={styles.muted}>35 g protein</Text>
          </View>
          <Text style={styles.value}>250 kcal</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Food entries are examples. Logging and saving meals will be added next.
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: (typeof Colors)['light'] | (typeof Colors)['dark']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingTop: 30,
      paddingBottom: 40,
      gap: 16,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: -10,
    },
    card: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 14,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    number: {
      color: colors.text,
      fontSize: 25,
      fontWeight: '800',
    },
    progressBackground: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
    },
    progressFill: {
      width: '71%',
      height: 8,
      backgroundColor: colors.accent,
      borderRadius: 10,
    },
    muted: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    heading: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginTop: 4,
    },
    macroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    value: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
    foodRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    foodName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 5,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
    },
    footer: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
      marginTop: 4,
    },
  });
}

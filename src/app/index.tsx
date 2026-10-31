
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const styles = createStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>YOUR FITNESS JOURNEY</Text>
          <Text style={styles.title}>Hybrid Tracker</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>FT</Text>
        </View>
      </View>

      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>Let's make today count.</Text>
        <Text style={styles.subtitle}>
          Every rep, every meal, every step forward.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Today's Overview</Text>
        <Text style={styles.dateLabel}>DAILY GOALS</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statIcon}>◉</Text>
          </View>
          <Text style={styles.statNumber}>1,850</Text>
          <Text style={styles.statCaption}>of 2,600 kcal</Text>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: '71%' }]} />
          </View>
          <Text style={styles.remaining}>750 remaining</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>Protein</Text>
            <Text style={styles.statIcon}>◆</Text>
          </View>
          <Text style={styles.statNumber}>112 g</Text>
          <Text style={styles.statCaption}>of 150 g goal</Text>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
          <Text style={styles.remaining}>38 g remaining</Text>
        </View>
      </View>

      <View style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <View>
            <Text style={styles.cardEyebrow}>STAY CONSISTENT</Text>
            <Text style={styles.workoutTitle}>Your Workout</Text>
          </View>
          <View style={styles.workoutIcon}>
            <Text style={styles.workoutIconText}>↗</Text>
          </View>
        </View>

        <Text style={styles.workoutDescription}>
          Keep building momentum, one set at a time.
        </Text>

        <View style={styles.workoutStats}>
          <View>
            <Text style={styles.workoutStatNumber}>12</Text>
            <Text style={styles.workoutStatLabel}>Total sets</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View>
            <Text style={styles.workoutStatNumber}>4</Text>
            <Text style={styles.workoutStatLabel}>Exercises</Text>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/workout')}
        >
          <Text style={styles.primaryButtonText}>Open Workout</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Quick Access</Text>
      </View>

      <Pressable
        style={styles.quickCard}
        onPress={() => router.push('/nutrition')}
      >
        <View style={styles.quickIcon}>
          <Text style={styles.quickIconText}>＋</Text>
        </View>
        <View style={styles.quickInfo}>
          <Text style={styles.quickTitle}>Nutrition</Text>
          <Text style={styles.quickDescription}>
            Review calories and daily macros
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={styles.quickCard}
        onPress={() => router.push('/progress')}
      >
        <View style={styles.quickIcon}>
          <Text style={styles.quickIconText}>↗</Text>
        </View>
        <View style={styles.quickInfo}>
          <Text style={styles.quickTitle}>Your Progress</Text>
          <Text style={styles.quickDescription}>
            Track your goals and weight history
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Text style={styles.footer}>
        Small improvements add up. Keep showing up.
      </Text>
    </ScrollView>
  );
}

function createStyles(
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingTop: 30,
      paddingBottom: 40,
      gap: 18,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      marginTop: 4,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarText: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 14,
    },
    greeting: {
      gap: 6,
      marginTop: 4,
      marginBottom: 2,
    },
    greetingTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    heading: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    dateLabel: {
      color: colors.textSecondary,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      gap: 9,
    },
    statTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    statIcon: {
      color: colors.accent,
      fontSize: 16,
    },
    statNumber: {
      color: colors.text,
      fontSize: 23,
      fontWeight: '800',
    },
    statCaption: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    progressBackground: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
      marginTop: 3,
    },
    progressFill: {
      height: 6,
      backgroundColor: colors.accent,
      borderRadius: 10,
    },
    remaining: {
      color: colors.textSecondary,
      fontSize: 10,
    },
    workoutCard: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 18,
      gap: 16,
    },
    workoutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardEyebrow: {
      color: colors.accent,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    workoutTitle: {
      color: colors.text,
      fontSize: 21,
      fontWeight: '800',
      marginTop: 5,
    },
    workoutIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    workoutIconText: {
      color: colors.accent,
      fontSize: 23,
      fontWeight: '700',
    },
    workoutDescription: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    workoutStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
    },
    workoutStatNumber: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    workoutStatLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 3,
    },
    verticalDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },
    primaryButton: {
      minHeight: 48,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    buttonArrow: {
      color: '#FFFFFF',
      fontSize: 20,
    },
    quickCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 15,
      padding: 14,
    },
    quickIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickIconText: {
      color: colors.accent,
      fontSize: 22,
      fontWeight: '700',
    },
    quickInfo: {
      flex: 1,
      gap: 4,
    },
    quickTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    quickDescription: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    chevron: {
      color: colors.textSecondary,
      fontSize: 25,
    },
    footer: {
      color: colors.textSecondary,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 4,
    },
  });
}

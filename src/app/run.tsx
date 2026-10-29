// Import the app's shared color palette so the screen follows the phone's light/dark appearance.
import { Colors } from '@/constants/theme';
// Expo Location provides foreground GPS permissions and live location updates.
import * as Location from 'expo-location';
// React hooks manage screen state, timers, and references that should survive re-renders.
import { useEffect, useRef, useState } from 'react';
// React Native components build the screen and its controls.
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
// MapView draws the map, Polyline draws the recorded route, and Marker marks the latest GPS point.
import MapView, { Marker, Polyline, Region } from 'react-native-maps';

// The run can be ready to start, actively running, paused, or completed.
type RunStatus = 'ready' | 'running' | 'paused' | 'finished';

// Store only the latitude and longitude needed to draw and measure the route.
type Coordinate = {
  latitude: number;
  longitude: number;
};

// Default map area used before GPS has found the runner; it is not the user's actual location.
const DEFAULT_MAP_REGION: Region = {
  latitude: 40.75,
  longitude: -73.8,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function RunScreen() {
  // Select the matching colors for the current device appearance.
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const styles = createStyles(colors);

  // Keep the run's current metrics and status in React state so the UI refreshes automatically.
  const [status, setStatus] = useState<RunStatus>('ready');
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gpsReady, setGpsReady] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [currentCoordinate, setCurrentCoordinate] = useState<Coordinate | null>(null);

  // Keep references to GPS and map objects without triggering unnecessary re-renders.
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const previousPosition = useRef<Coordinate | null>(null);
  const startTime = useRef(0);
  const elapsedBeforeStart = useRef(0);

  // Update the elapsed timer once per second while a run is active.
  useEffect(() => {
    if (status !== 'running') return;

    const timer = setInterval(() => {
      setElapsed(
        elapsedBeforeStart.current +
          Math.floor((Date.now() - startTime.current) / 1000),
      );
    }, 1000);

    // Clear the timer whenever the run pauses, finishes, or the screen unmounts.
    return () => clearInterval(timer);
  }, [status]);

  // Stop receiving GPS updates if the user leaves this screen.
  useEffect(() => {
    return () => {
      subscription.current?.remove();
    };
  }, []);

  // Calculate the straight-line distance between two GPS points using the Haversine formula.
  function distanceBetween(a: Coordinate, b: Coordinate) {
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const earthRadius = 6371000; // Approximate Earth radius in meters.
    const dLat = radians(b.latitude - a.latitude);
    const dLon = radians(b.longitude - a.longitude);
    const lat1 = radians(a.latitude);
    const lat2 = radians(b.latitude);

    const value =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  // Request permission and start listening for GPS points to measure distance and draw the route.
  async function startGps() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      // GPS route recording needs permission while the app is in the foreground.
      if (permission.status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Allow location access while using the app to measure your run and draw its route.',
        );
        return false;
      }

      // Avoid accidentally leaving a previous GPS subscription active.
      subscription.current?.remove();
      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 3,
        },
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Ignore inaccurate fixes to reduce GPS noise in distance and the drawn route.
          if (accuracy !== null && accuracy > 35) return;

          const next: Coordinate = { latitude, longitude };
          const previous = previousPosition.current;

          // Ignore implausibly large jumps instead of adding false distance or a false route line.
          if (previous) {
            const meters = distanceBetween(previous, next);
            if (meters > 50) return;

            // Add only accepted GPS movement to distance and the route line.
            setDistance((total) => total + meters);
          }

          // Update the marker and route only after this GPS point passes the accuracy/jump checks.
          setCurrentCoordinate(next);
          setGpsReady(true);
          setRouteCoordinates((points) => [...points, next]);
          previousPosition.current = next;

          // Keep the map centered on the runner as new GPS points arrive.
          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.006,
              longitudeDelta: 0.006,
            },
            350,
          );
        },
      );

      return true;
    } catch {
      // Give the user a clear message if location services cannot start.
      Alert.alert(
        'Unable to start GPS',
        'Check your location settings and try again.',
      );
      return false;
    }
  }

  // Start a new run or resume a paused run.
  async function startRun() {
    if (status === 'paused') {
      const started = await startGps();
      if (!started) return;

      elapsedBeforeStart.current = elapsed;
      startTime.current = Date.now();
      setStatus('running');
      return;
    }

    // Clear metrics and the previous route before a completely new run.
    setElapsed(0);
    setDistance(0);
    setGpsReady(false);
    setRouteCoordinates([]);
    setCurrentCoordinate(null);
    previousPosition.current = null;
    elapsedBeforeStart.current = 0;

    const started = await startGps();
    if (!started) return;

    startTime.current = Date.now();
    setStatus('running');
  }

  // Pause timing and GPS updates while preserving the route recorded so far.
  function pauseRun() {
    const currentElapsed =
      elapsedBeforeStart.current +
      Math.floor((Date.now() - startTime.current) / 1000);

    setElapsed(currentElapsed);
    elapsedBeforeStart.current = currentElapsed;
    subscription.current?.remove();
    subscription.current = null;
    previousPosition.current = null;
    setStatus('paused');
  }

  // Finish the run and keep the recorded route visible in the summary.
  function finishRun() {
    const currentElapsed =
      elapsedBeforeStart.current +
      (status === 'running' ? Math.floor((Date.now() - startTime.current) / 1000) : 0);

    setElapsed(currentElapsed);
    subscription.current?.remove();
    subscription.current = null;
    previousPosition.current = null;
    setStatus('finished');
  }

  // Reset all run data, including the route polyline, for a fresh session.
  function resetRun() {
    subscription.current?.remove();
    subscription.current = null;
    previousPosition.current = null;
    elapsedBeforeStart.current = 0;
    setElapsed(0);
    setDistance(0);
    setGpsReady(false);
    setRouteCoordinates([]);
    setCurrentCoordinate(null);
    setStatus('ready');
  }

  // Convert meters to miles and calculate the average pace in minutes per mile.
  const miles = distance / 1609.344;
  const paceSeconds = miles > 0.01 ? elapsed / miles : 0;
  const paceMinutes = Math.floor(paceSeconds / 60);
  const paceRemainder = Math.floor(paceSeconds % 60);

  // Format elapsed time as HH:MM:SS.
  const time = [
    Math.floor(elapsed / 3600),
    Math.floor((elapsed % 3600) / 60),
    elapsed % 60,
  ]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');

  // Show a placeholder pace until the runner has covered a measurable distance.
  const pace =
    miles > 0.01
      ? `${paceMinutes}:${String(paceRemainder).padStart(2, '0')}`
      : '--:--';

  // Select the map's initial camera region from the latest accepted GPS coordinate.
  const mapRegion = currentCoordinate
    ? {
        latitude: currentCoordinate.latitude,
        longitude: currentCoordinate.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      }
    : DEFAULT_MAP_REGION;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Screen heading and current run status. */}
      <Text style={styles.eyebrow}>OUTDOOR TRAINING</Text>
      <Text style={styles.title}>Run</Text>
      <Text style={styles.subtitle}>Find your pace. Beat your best.</Text>

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, status === 'running' && styles.statusDotActive]} />
        <Text style={styles.statusText}>
          {status === 'ready' && 'Ready when you are'}
          {status === 'running' && 'Run in progress'}
          {status === 'paused' && 'Run paused'}
          {status === 'finished' && 'Run completed'}
        </Text>
      </View>

      {/* Main metrics card: distance, elapsed time, pace, and GPS status. */}
      <View style={styles.mainCard}>
        <Text style={styles.metricLabel}>DISTANCE</Text>
        <View style={styles.distanceRow}>
          <Text style={styles.distanceNumber}>{miles.toFixed(2)}</Text>
          <Text style={styles.distanceUnit}>mi</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricsGrid}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>ELAPSED TIME</Text>
            <Text style={styles.metricValue}>{time}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>AVG. PACE</Text>
            <Text style={styles.metricValue}>{pace}</Text>
            <Text style={styles.metricHint}>min / mile</Text>
          </View>
        </View>

        <View style={styles.gpsNotice}>
          <Text style={styles.gpsIcon}>⌖</Text>
          <Text style={styles.gpsText}>
            {status === 'ready'
              ? 'GPS starts when you begin your run.'
              : gpsReady
                ? 'GPS signal received'
                : 'Waiting for a reliable GPS signal...'}
          </Text>
        </View>
      </View>

      {/* Live route map: the blue line grows as reliable GPS coordinates arrive. */}
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Your route</Text>
          <Text style={styles.mapSubtitle}>
            {routeCoordinates.length > 1 ? `${routeCoordinates.length} GPS points` : 'Live GPS map'}
          </Text>
        </View>
        {currentCoordinate ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            showsUserLocation
            showsMyLocationButton
            followsUserLocation={false}
            toolbarEnabled={false}
          >
            {/* Draw the route captured during this run. */}
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={colors.accent}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            )}
            {/* Mark the most recently accepted GPS point. */}
            <Marker coordinate={currentCoordinate} title="Current position" />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderIcon}>⌖</Text>
            <Text style={styles.mapPlaceholderTitle}>Map will appear when GPS locks</Text>
            <Text style={styles.mapPlaceholderText}>
              Start your run outdoors and allow location access to see your position and route.
            </Text>
          </View>
        )}
      </View>

      {/* Show a summary after finishing, otherwise show the run controls. */}
      {status === 'finished' ? (
        <View style={styles.actionStack}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Run summary</Text>
            <Text style={styles.summaryText}>You ran {miles.toFixed(2)} miles in {time}.</Text>
            <Text style={styles.summaryText}>Average pace: {pace} min/mile</Text>
            <Text style={styles.summaryText}>Route points recorded: {routeCoordinates.length}</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={resetRun}>
            <Text style={styles.primaryButtonText}>Start new run</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actionStack}>
          {status === 'running' ? (
            <View style={styles.buttonRow}>
              <Pressable style={[styles.primaryButton, styles.flexButton]} onPress={pauseRun}>
                <Text style={styles.primaryButtonText}>Pause</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, styles.flexButton]} onPress={finishRun}>
                <Text style={styles.secondaryButtonText}>Finish</Text>
              </Pressable>
            </View>
          ) : status === 'paused' ? (
            <View style={styles.buttonRow}>
              <Pressable style={[styles.primaryButton, styles.flexButton]} onPress={startRun}>
                <Text style={styles.primaryButtonText}>Resume</Text>
              </Pressable>
              <Pressable style={[styles.secondaryButton, styles.flexButton]} onPress={finishRun}>
                <Text style={styles.secondaryButtonText}>Finish</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.primaryButton} onPress={startRun}>
              <Text style={styles.primaryButtonText}>Start run</Text>
            </Pressable>
          )}

          <Text style={styles.disclaimer}>
            Keep your phone secure while running. GPS accuracy varies with your surroundings.
          </Text>
        </View>
      )}

      {/* Explain the current limitation so the user knows the route is not saved permanently yet. */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Route tracking note</Text>
        <Text style={styles.infoText}>
          The map follows your GPS while this screen is active. The route stays visible after you
          finish, but it is not saved permanently if you leave the screen or close the app yet.
        </Text>
      </View>
    </ScrollView>
  );
}

// Keep styling in one function so colors update automatically with the device theme.
function createStyles(colors: (typeof Colors)['light'] | (typeof Colors)['dark']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingTop: 30, paddingBottom: 40, gap: 16 },
    eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
    title: { color: colors.text, fontSize: 32, fontWeight: '800' },
    subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: -10 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textSecondary },
    statusDotActive: { backgroundColor: colors.success },
    statusText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    mainCard: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 22,
      padding: 22,
      gap: 16,
    },
    metricLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
    distanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    distanceNumber: { color: colors.text, fontSize: 64, fontWeight: '800', fontVariant: ['tabular-nums'] },
    distanceUnit: { color: colors.textSecondary, fontSize: 18, fontWeight: '600' },
    divider: { height: 1, backgroundColor: colors.border },
    metricsGrid: { flexDirection: 'row', gap: 20 },
    metric: { flex: 1, gap: 8 },
    metricValue: { color: colors.text, fontSize: 25, fontWeight: '800', fontVariant: ['tabular-nums'] },
    metricHint: { color: colors.textSecondary, fontSize: 11, marginTop: -5 },
    gpsNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    gpsIcon: { color: colors.accent, fontSize: 20, fontWeight: '700' },
    gpsText: { flex: 1, color: colors.textSecondary, fontSize: 12 },
    mapCard: {
      overflow: 'hidden',
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
    },
    mapHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    mapTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    mapSubtitle: { color: colors.textSecondary, fontSize: 11 },
    map: { height: 280, width: '100%' },
    mapPlaceholder: {
      height: 220,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      gap: 8,
    },
    mapPlaceholderIcon: { color: colors.accent, fontSize: 32, fontWeight: '700' },
    mapPlaceholderTitle: { color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
    mapPlaceholderText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
    actionStack: { gap: 12 },
    buttonRow: { flexDirection: 'row', gap: 12 },
    flexButton: { flex: 1 },
    primaryButton: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      paddingHorizontal: 18,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: colors.background === '#F3F7FC' ? '#FFFFFF' : '#0B0F14',
      fontSize: 15,
      fontWeight: '800',
    },
    secondaryButton: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      paddingHorizontal: 18,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: '800' },
    disclaimer: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    summaryCard: {
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 18,
      gap: 8,
    },
    summaryTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
    summaryText: { color: colors.textSecondary, fontSize: 13 },
    infoCard: { backgroundColor: colors.backgroundSelected, borderRadius: 16, padding: 16, gap: 6 },
    infoTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
    infoText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  });
}

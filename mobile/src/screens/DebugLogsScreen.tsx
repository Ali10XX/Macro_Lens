import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { Button, Card, Chip, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLogs, clearLogs, exportLogs, LogLevel } from '../utils/logger';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
}

export default function DebugLogsScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | null>(null);

  const loadLogs = async () => {
    try {
      const logEntries = await getLogs();
      setLogs(logEntries.reverse()); // Show newest first
      setFilteredLogs(logEntries.reverse());
    } catch (error) {
      Alert.alert('Error', 'Failed to load logs');
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, selectedLevel]);

  const filterLogs = () => {
    let filtered = logs;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        log =>
          log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by log level
    if (selectedLevel !== null) {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    setFilteredLogs(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearLogs();
              await loadLogs();
              Alert.alert('Success', 'Logs cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear logs');
            }
          },
        },
      ]
    );
  };

  const handleExportLogs = async () => {
    try {
      const logsString = await exportLogs();
      await Share.share({
        message: logsString,
        title: 'MacroLens Debug Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const getLogLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG:
        return '#64748b';
      case LogLevel.INFO:
        return '#3b82f6';
      case LogLevel.WARN:
        return '#f59e0b';
      case LogLevel.ERROR:
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getLogLevelIcon = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <Card style={styles.logCard}>
      <Card.Content>
        <View style={styles.logHeader}>
          <Text style={styles.logIcon}>{getLogLevelIcon(item.level)}</Text>
          <Text style={[styles.logLevel, { color: getLogLevelColor(item.level) }]}>
            {LogLevel[item.level]}
          </Text>
          <Text style={styles.logCategory}>[{item.category}]</Text>
          <Text style={styles.logTimestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        <Text style={styles.logMessage}>{item.message}</Text>
        {item.data && (
          <Text style={styles.logData}>
            Data: {JSON.stringify(item.data, null, 2)}
          </Text>
        )}
        {item.stackTrace && (
          <Text style={styles.logStackTrace}>
            Stack: {item.stackTrace}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Logs</Text>
        <Text style={styles.subtitle}>{filteredLogs.length} entries</Text>
      </View>

      <View style={styles.controls}>
        <Searchbar
          placeholder="Search logs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filterChips}>
          <Chip
            selected={selectedLevel === null}
            onPress={() => setSelectedLevel(null)}
            style={styles.chip}
          >
            All
          </Chip>
          <Chip
            selected={selectedLevel === LogLevel.ERROR}
            onPress={() => setSelectedLevel(LogLevel.ERROR)}
            style={styles.chip}
          >
            Errors
          </Chip>
          <Chip
            selected={selectedLevel === LogLevel.WARN}
            onPress={() => setSelectedLevel(LogLevel.WARN)}
            style={styles.chip}
          >
            Warnings
          </Chip>
          <Chip
            selected={selectedLevel === LogLevel.INFO}
            onPress={() => setSelectedLevel(LogLevel.INFO)}
            style={styles.chip}
          >
            Info
          </Chip>
        </View>

        <View style={styles.actionButtons}>
          <Button mode="outlined" onPress={handleExportLogs} style={styles.button}>
            Export
          </Button>
          <Button mode="outlined" onPress={handleClearLogs} style={styles.button}>
            Clear
          </Button>
        </View>
      </View>

      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={(item, index) => `${item.timestamp}-${index}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.logsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  controls: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchbar: {
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    marginRight: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  logsList: {
    flex: 1,
    padding: 16,
  },
  logCard: {
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  logCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 8,
  },
  logTimestamp: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 'auto',
  },
  logMessage: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  logStackTrace: {
    fontSize: 11,
    color: '#ef4444',
    fontFamily: 'monospace',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
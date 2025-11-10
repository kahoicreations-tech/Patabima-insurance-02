import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Motor2StaticDataService from '@services/Motor2StaticDataService';
import { Colors } from '@constants/Colors';

/**
 * Debug Component to Test Motor2 Static Data Implementation
 * Add this to your Motor2 flow temporarily to verify static loading
 */
export default function DebugStaticData() {
  const [loadTime, setLoadTime] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    testStaticLoad();
    getCacheInfo();
  }, []);

  const testStaticLoad = async () => {
    const startTime = performance.now();
    
    try {
      const data = await Motor2StaticDataService.getCategories();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setLoadTime(duration);
      setCategories(data);
      
      console.log('🔍 STATIC DATA TEST:', {
        loadTime: `${duration.toFixed(2)}ms`,
        categoriesCount: data.length,
        firstCategory: data[0]?.name,
      });
    } catch (error) {
      console.error('❌ Static data load failed:', error);
    }
  };

  const getCacheInfo = async () => {
    try {
      const status = await Motor2StaticDataService.getCacheStatus();
      setCacheStatus(status);
      console.log('💾 Cache Status:', status);
    } catch (error) {
      console.error('❌ Cache status failed:', error);
    }
  };

  const toggleDebug = () => {
    const newState = !debugEnabled;
    setDebugEnabled(newState);
    Motor2StaticDataService.setDebug(newState);
    console.log(`🔧 Debug mode: ${newState ? 'ENABLED' : 'DISABLED'}`);
  };

  const forceUpdate = async () => {
    console.log('🔄 Forcing update from backend...');
    try {
      await Motor2StaticDataService.forceUpdate();
      await testStaticLoad();
      await getCacheInfo();
      console.log('✅ Force update complete');
    } catch (error) {
      console.error('❌ Force update failed:', error);
    }
  };

  const clearCache = async () => {
    console.log('🗑️ Clearing cache...');
    try {
      await Motor2StaticDataService.clearCache();
      await testStaticLoad();
      await getCacheInfo();
      console.log('✅ Cache cleared');
    } catch (error) {
      console.error('❌ Clear cache failed:', error);
    }
  };

  const getResultEmoji = () => {
    if (!loadTime) return '⏳';
    if (loadTime < 5) return '🚀'; // Excellent!
    if (loadTime < 50) return '✅'; // Good
    if (loadTime < 200) return '⚠️'; // OK
    return '❌'; // Too slow
  };

  const getResultText = () => {
    if (!loadTime) return 'Testing...';
    if (loadTime < 5) return 'EXCELLENT! Using static data';
    if (loadTime < 50) return 'GOOD! Using AsyncStorage cache';
    if (loadTime < 200) return 'OK - Could be faster';
    return 'SLOW - Not using static data';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🔍 Static Data Test Results</Text>
        
        {/* Load Time Result */}
        <View style={[styles.resultBox, loadTime < 5 ? styles.success : styles.warning]}>
          <Text style={styles.emoji}>{getResultEmoji()}</Text>
          <Text style={styles.resultText}>{getResultText()}</Text>
          <Text style={styles.timeText}>
            Load Time: {loadTime ? `${loadTime.toFixed(2)}ms` : '...'}
          </Text>
          <Text style={styles.targetText}>Target: &lt;5ms</Text>
        </View>

        {/* Categories Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📦 Categories Loaded</Text>
          <Text style={styles.infoText}>Count: {categories.length}</Text>
          <Text style={styles.infoText}>
            Names: {categories.map(c => c.name || c.category_name).join(', ')}
          </Text>
        </View>

        {/* Cache Status */}
        {cacheStatus && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💾 Cache Status</Text>
            <Text style={styles.infoText}>
              Memory Cache: {cacheStatus.categoriesInMemory ? '✅ Active' : '❌ Empty'}
            </Text>
            <Text style={styles.infoText}>
              AsyncStorage: {cacheStatus.categoriesInStorage ? '✅ Cached' : '❌ Empty'}
            </Text>
            <Text style={styles.infoText}>
              Last Sync: {cacheStatus.lastSyncTime || 'Never'}
            </Text>
          </View>
        )}

        {/* Debug Controls */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, debugEnabled && styles.buttonActive]} 
            onPress={toggleDebug}
          >
            <Text style={styles.buttonText}>
              {debugEnabled ? '🔇 Disable Debug' : '🔊 Enable Debug'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={forceUpdate}>
            <Text style={styles.buttonText}>🔄 Force Update</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={clearCache}>
            <Text style={styles.buttonText}>🗑️ Clear Cache</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testStaticLoad}>
            <Text style={styles.buttonText}>🔁 Re-test Load</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>📋 What to Look For:</Text>
          <Text style={styles.instructionText}>🚀 &lt;5ms = Using static files (perfect!)</Text>
          <Text style={styles.instructionText}>✅ 5-50ms = Using AsyncStorage (good)</Text>
          <Text style={styles.instructionText}>⚠️ 50-200ms = Cache hit but slow</Text>
          <Text style={styles.instructionText}>❌ &gt;200ms = Still using API (problem)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text,
  },
  resultBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  success: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  warning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 8,
  },
  targetText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoBox: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 16,
    gap: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text,
  },
  instructionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

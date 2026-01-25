/**
 * Global Error Boundary Component
 * 
 * Catches unhandled React errors and displays a friendly error screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('🚨 [ErrorBoundary] Caught error:', error);
    console.error('🚨 [ErrorBoundary] Error info:', errorInfo);
    
    // Store error details in state
    this.setState({
      error,
      errorInfo
    });
    
    // You could send error to error tracking service here
    // Example: Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleShowDetails = () => {
    const { error, errorInfo } = this.state;
    Alert.alert(
      'Error Details',
      `${error?.toString()}\n\n${errorInfo?.componentStack || ''}`,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="warning" size={64} color="#E63946" style={styles.icon} />
            
            <Text style={styles.title}>Something Went Wrong</Text>
            
            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>
            
            <Text style={styles.suggestion}>
              Try restarting the app. If the problem persists, please contact support.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Mode):</Text>
                <ScrollView style={styles.errorScroll}>
                  <Text style={styles.errorText}>
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text style={styles.errorText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
            
            <TouchableOpacity style={styles.resetButton} onPress={this.handleReset}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.resetButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            {__DEV__ && (
              <TouchableOpacity style={styles.detailsButton} onPress={this.handleShowDetails}>
                <Text style={styles.detailsButtonText}>Show Full Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center'
  },
  icon: {
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22
  },
  suggestion: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    maxHeight: 200
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 8
  },
  errorScroll: {
    maxHeight: 150
  },
  errorText: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'monospace',
    lineHeight: 16
  },
  resetButton: {
    backgroundColor: '#D5222B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  buttonIcon: {
    marginRight: 8
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  detailsButton: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  detailsButtonText: {
    color: '#D5222B',
    fontSize: 14,
    textDecorationLine: 'underline'
  }
});

export default ErrorBoundary;

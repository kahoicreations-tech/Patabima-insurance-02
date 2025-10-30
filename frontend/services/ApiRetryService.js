/**
 * API Retry Service
 * 
 * Implements intelligent retry logic with exponential backoff for API calls.
 * Improves app resilience by automatically retrying failed requests due to
 * network issues, server errors, or rate limiting.
 * 
 * Features:
 * - Exponential backoff (1s, 2s, 4s, 8s...)
 * - Configurable max retries (default: 3)
 * - Only retries retryable errors (5xx, timeouts, network failures)
 * - Skips non-retryable errors (4xx client errors)
 * - Jitter to prevent thundering herd
 * 
 * @module ApiRetryService
 * @version 2.0
 */

/**
 * API Retry Service Class
 * Provides retry functionality for API calls with exponential backoff
 */
class ApiRetryService {
  /**
   * Retry an API call with exponential backoff
   * 
   * @param {Function} apiCall - The API call function to retry (should return a Promise)
   * @param {Object} options - Retry configuration options
   * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
   * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
   * @param {number} options.backoffFactor - Multiplier for exponential backoff (default: 2)
   * @param {boolean} options.jitter - Add random jitter to delay (default: true)
   * @param {Function} options.shouldRetry - Custom function to determine if error is retryable
   * @param {Function} options.onRetry - Callback function called before each retry
   * @returns {Promise<any>} Result of the API call
   * @throws {Error} Last error if all retries fail
   * 
   * @example
   * const result = await apiRetryService.retryWithBackoff(
   *   () => djangoAPI.getCategories(),
   *   {
   *     maxRetries: 3,
   *     onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`)
   *   }
   * );
   */
  async retryWithBackoff(apiCall, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      jitter = true,
      shouldRetry = (error) => this.isRetryableError(error),
      onRetry = null
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Execute the API call
        const result = await apiCall();
        
        // Success! Return result
        if (attempt > 0) {
          console.log(`✓ API call succeeded on attempt ${attempt + 1}/${maxRetries + 1}`);
        }
        return result;
      } catch (error) {
        lastError = error;
        
        // Log the error
        console.log(`✗ API call failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
        
        // Don't retry if error is not retryable or we've exhausted retries
        if (!shouldRetry(error)) {
          console.log(`  Error is not retryable: ${this.getErrorType(error)}`);
          break;
        }
        
        if (attempt === maxRetries) {
          console.log(`  Max retries (${maxRetries}) reached`);
          break;
        }
        
        // Calculate delay for next attempt
        const currentDelay = Math.min(delay, maxDelay);
        const delayWithJitter = jitter 
          ? currentDelay * (0.5 + Math.random() * 0.5) // Add 0-50% jitter
          : currentDelay;
        
        console.log(`  Retrying in ${Math.round(delayWithJitter)}ms...`);
        
        // Call onRetry callback if provided
        if (onRetry) {
          try {
            await onRetry(attempt + 1, error, delayWithJitter);
          } catch (callbackError) {
            console.warn('onRetry callback error:', callbackError);
          }
        }
        
        // Wait before retrying
        await this.delay(delayWithJitter);
        
        // Increase delay for next attempt (exponential backoff)
        delay = delay * backoffFactor;
      }
    }

    // All retries failed, throw the last error
    throw lastError;
  }

  /**
   * Check if an error is retryable
   * 
   * @param {Error} error - Error object to check
   * @returns {boolean} True if error should trigger a retry
   */
  isRetryableError(error) {
    // Network errors (no response from server)
    if (error.message?.includes('Network request failed')) {
      console.log('  Retryable: Network request failed');
      return true;
    }
    
    if (error.message?.includes('timeout')) {
      console.log('  Retryable: Request timeout');
      return true;
    }
    
    if (error.message?.includes('ECONNREFUSED')) {
      console.log('  Retryable: Connection refused');
      return true;
    }
    
    if (error.message?.includes('ETIMEDOUT')) {
      console.log('  Retryable: Connection timed out');
      return true;
    }
    
    // Check HTTP status code if available
    const status = error.response?.status;
    
    if (!status) {
      // No status code means network error
      console.log('  Retryable: No status code (network error)');
      return true;
    }
    
    // 5xx server errors
    if (status >= 500 && status < 600) {
      console.log(`  Retryable: Server error (${status})`);
      return true;
    }
    
    // 429 Rate limiting
    if (status === 429) {
      console.log('  Retryable: Rate limited (429)');
      return true;
    }
    
    // Specific gateway errors
    if ([502, 503, 504].includes(status)) {
      console.log(`  Retryable: Gateway error (${status})`);
      return true;
    }
    
    // 4xx client errors are not retryable (except 429)
    if (status >= 400 && status < 500) {
      console.log(`  Not retryable: Client error (${status})`);
      return false;
    }
    
    // Default: don't retry unknown errors
    console.log('  Not retryable: Unknown error type');
    return false;
  }

  /**
   * Get error type for logging
   * 
   * @param {Error} error - Error object
   * @returns {string} Error type description
   * @private
   */
  getErrorType(error) {
    const status = error.response?.status;
    
    if (!status) {
      if (error.message?.includes('Network request failed')) return 'Network Error';
      if (error.message?.includes('timeout')) return 'Timeout';
      return 'Unknown Network Error';
    }
    
    if (status >= 500) return `Server Error (${status})`;
    if (status === 429) return 'Rate Limited';
    if (status >= 400) return `Client Error (${status})`;
    
    return `HTTP ${status}`;
  }

  /**
   * Delay helper function
   * 
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>} Promise that resolves after delay
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a specific API call with default options
   * Convenience wrapper for common API retry patterns
   * 
   * @param {Function} apiCall - The API call function
   * @returns {Promise<any>} Result of the API call
   */
  async retry(apiCall) {
    return this.retryWithBackoff(apiCall);
  }

  /**
   * Retry with aggressive settings for critical operations
   * 
   * @param {Function} apiCall - The API call function
   * @returns {Promise<any>} Result of the API call
   */
  async retryAggressive(apiCall) {
    return this.retryWithBackoff(apiCall, {
      maxRetries: 5,
      initialDelay: 500,
      maxDelay: 15000,
      backoffFactor: 2.5
    });
  }

  /**
   * Retry with conservative settings for non-critical operations
   * 
   * @param {Function} apiCall - The API call function
   * @returns {Promise<any>} Result of the API call
   */
  async retryConservative(apiCall) {
    return this.retryWithBackoff(apiCall, {
      maxRetries: 2,
      initialDelay: 2000,
      maxDelay: 5000,
      backoffFactor: 1.5
    });
  }

  /**
   * Execute multiple API calls with retry logic in parallel
   * 
   * @param {Array<Function>} apiCalls - Array of API call functions
   * @param {Object} options - Retry options (same as retryWithBackoff)
   * @returns {Promise<Array>} Array of results (settled)
   */
  async retryAll(apiCalls, options = {}) {
    const promises = apiCalls.map(apiCall => 
      this.retryWithBackoff(apiCall, options)
        .then(result => ({ status: 'fulfilled', value: result }))
        .catch(error => ({ status: 'rejected', reason: error }))
    );
    
    return Promise.all(promises);
  }

  /**
   * Wrap an API service to automatically retry all its methods
   * 
   * @param {Object} apiService - API service object
   * @param {Object} options - Retry options
   * @returns {Proxy} Proxied API service with retry logic
   * 
   * @example
   * const resilientAPI = apiRetryService.wrapService(djangoAPI, { maxRetries: 3 });
   * const categories = await resilientAPI.getCategories(); // Automatically retried
   */
  wrapService(apiService, options = {}) {
    return new Proxy(apiService, {
      get: (target, prop) => {
        const original = target[prop];
        
        // Only wrap functions
        if (typeof original !== 'function') {
          return original;
        }
        
        // Return wrapped function with retry logic
        return (...args) => {
          return this.retryWithBackoff(
            () => original.apply(target, args),
            options
          );
        };
      }
    });
  }
}

// Export singleton instance
const apiRetryService = new ApiRetryService();

export default apiRetryService;

// Export class for testing or custom instances
export { ApiRetryService };

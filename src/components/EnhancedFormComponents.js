import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Image
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

// ENHANCED FORM COMPONENTS FOR ALL INSURANCE CATEGORIES

export const EnhancedTextInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  required = false, 
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  ...otherProps 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
      <View style={[styles.inputWrapper, multiline && styles.multilineWrapper, error && styles.errorInput]}>
        <TextInput
          style={[styles.textInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...otherProps}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export const EnhancedSelectInput = ({ 
  label, 
  value, 
  placeholder = "Select an option", 
  onPress, 
  required = false, 
  error,
  ...otherProps 
}) => {
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
      <TouchableOpacity 
        style={[styles.selectWrapper, error && styles.errorInput]} 
        onPress={onPress}
        {...otherProps}
      >
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export const EnhancedEmailInput = ({ label = "Email", value, onChangeText, required = false, ...otherProps }) => {
  return (
    <EnhancedTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder="Enter email address"
      keyboardType="email-address"
      autoCapitalize="none"
      required={required}
      {...otherProps}
    />
  );
};

export const EnhancedPhoneInput = ({ label = "Phone Number", value, onChangeText, required = false, ...otherProps }) => {
  const handleChange = useCallback((text) => {
    // Allow only digits, +, and spaces
    const cleaned = text.replace(/[^0-9+\s]/g, '');
    onChangeText(cleaned);
  }, [onChangeText]);

  return (
    <EnhancedTextInput
      label={label}
      value={value}
      onChangeText={handleChange}
      placeholder="Enter phone number"
      keyboardType="phone-pad"
      required={required}
      {...otherProps}
    />
  );
};

export const EnhancedIDInput = ({ label = "ID Number", value, onChangeText, required = false, ...otherProps }) => {
  const handleChange = useCallback((text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    onChangeText(cleaned);
  }, [onChangeText]);

  return (
    <EnhancedTextInput
      label={label}
      value={value}
      onChangeText={handleChange}
      placeholder="Enter ID number"
      keyboardType="numeric"
      required={required}
      {...otherProps}
    />
  );
};

export const EnhancedDatePicker = ({
  label = 'Date of Birth',
  value,
  onDateChange,
  placeholder = 'Select date',
  minAge = 16, // Allow 16+ for insurance
  maxAge = 85, // Reasonable max age for insurance
  required = false
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const { selectedDate, maxDate, minDate } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // Use current date as default instead of calculated age
    const defaultDate = new Date(today); // Current date: July 20, 2025
    
    return {
      selectedDate: value ? new Date(value) : defaultDate,
      maxDate: new Date(currentYear - minAge, currentMonth, currentDay), // Latest selectable date
      minDate: new Date(currentYear - maxAge, currentMonth, currentDay)  // Earliest selectable date
    };
  }, [value, minAge, maxAge]);

  const handleDateChange = useCallback((event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date && event.type === 'set') {
      // Format the date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      onDateChange(formattedDate);
      
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  }, [onDateChange]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB');
  }, []);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
};

// DEPARTURE DATE PICKER - Can't select past dates
export const EnhancedDepartureDatePicker = ({
  label = 'Departure Date',
  value,
  onDateChange,
  placeholder = 'Select departure date',
  required = false
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const { selectedDate, maxDate, minDate } = useMemo(() => {
    const today = new Date();
    // Set time to start of day to avoid timezone issues
    today.setHours(0, 0, 0, 0);
    
    // Default to tomorrow for departure
    const defaultDate = new Date(today);
    defaultDate.setDate(today.getDate() + 1);
    
    // Max date: 2 years from now (reasonable for travel planning)
    const maxTravelDate = new Date(today);
    maxTravelDate.setFullYear(today.getFullYear() + 2);
    
    return {
      selectedDate: value ? new Date(value) : defaultDate,
      maxDate: maxTravelDate,
      minDate: today // Can't select past dates
    };
  }, [value]);

  const handleDateChange = useCallback((event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date && event.type === 'set') {
      const formattedDate = date.toISOString().split('T')[0];
      onDateChange(formattedDate);
      
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  }, [onDateChange]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB');
  }, []);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="airplane-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
};

// EMPLOYMENT START DATE PICKER - Reasonable range for employment (within last 40 years to today)
export const EnhancedEmploymentDatePicker = ({
  label = 'Employment Start Date',
  value,
  onDateChange,
  placeholder = 'Select employment start date',
  required = false
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const { selectedDate, maxDate, minDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Employment date can be in the past (reasonable: up to 40 years ago)
    const pastDate = new Date(today);
    pastDate.setFullYear(today.getFullYear() - 40);
    
    // Default to 1 year ago for employment start
    const defaultDate = new Date(today);
    defaultDate.setFullYear(today.getFullYear() - 1);
    
    return {
      selectedDate: value ? new Date(value) : defaultDate,
      maxDate: today, // Can't start employment in the future
      minDate: pastDate // Reasonable limit for past employment
    };
  }, [value]);

  const handleDateChange = useCallback((event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date && event.type === 'set') {
      const formattedDate = date.toISOString().split('T')[0];
      onDateChange(formattedDate);
      
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  }, [onDateChange]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB');
  }, []);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="briefcase-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
};

// RETURN DATE PICKER - Can't be before departure date
export const EnhancedReturnDatePicker = ({
  label = 'Return Date',
  value,
  onDateChange,
  placeholder = 'Select return date',
  departureDate, // Required prop to set minimum date
  required = false
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const { selectedDate, maxDate, minDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Minimum date is departure date or today, whichever is later
    let minimumDate = today;
    if (departureDate) {
      const depDate = new Date(departureDate);
      minimumDate = depDate > today ? depDate : today;
    }
    
    // Default to day after departure or tomorrow
    const defaultDate = new Date(minimumDate);
    defaultDate.setDate(minimumDate.getDate() + 1);
    
    // Max date: 2 years from now
    const maxTravelDate = new Date(today);
    maxTravelDate.setFullYear(today.getFullYear() + 2);
    
    return {
      selectedDate: value ? new Date(value) : defaultDate,
      maxDate: maxTravelDate,
      minDate: minimumDate
    };
  }, [value, departureDate]);

  const handleDateChange = useCallback((event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date && event.type === 'set') {
      const formattedDate = date.toISOString().split('T')[0];
      onDateChange(formattedDate);
      
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  }, [onDateChange]);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB');
  }, []);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="airplane-outline" size={20} color={Colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
};

// Enhanced File Upload Component with OCR Integration
export const EnhancedFileUpload = ({
  label,
  required = false,
  documentType,
  onFileSelect,
  onOCRProcess,
  existingDocument = null,
  extractedData = null,
  isProcessing = false,
  error = null,
  ...otherProps
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(async () => {
    try {
      setIsUploading(true);
      
      Alert.alert(
        "Select Document",
        `Choose how to upload your ${documentType?.type || 'document'}`,
        [
          {
            text: "Camera",
            onPress: async () => {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (permission.granted) {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                });
                
                if (!result.canceled && result.assets[0]) {
                  const file = {
                    uri: result.assets[0].uri,
                    type: 'image',
                    name: `${documentType?.type || 'document'}_${Date.now()}.jpg`,
                    size: result.assets[0].fileSize || 'Unknown size'
                  };
                  
                  if (onFileSelect) onFileSelect(file);
                  if (onOCRProcess && documentType?.scannable) {
                    onOCRProcess(file, documentType);
                  }
                }
              }
            }
          },
          {
            text: "Gallery",
            onPress: async () => {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (permission.granted) {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                });
                
                if (!result.canceled && result.assets[0]) {
                  const file = {
                    uri: result.assets[0].uri,
                    type: 'image',
                    name: `${documentType?.type || 'document'}_${Date.now()}.jpg`,
                    size: result.assets[0].fileSize || 'Unknown size'
                  };
                  
                  if (onFileSelect) onFileSelect(file);
                  if (onOCRProcess && documentType?.scannable) {
                    onOCRProcess(file, documentType);
                  }
                }
              }
            }
          },
          {
            text: "Files",
            onPress: async () => {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
              });
              
              if (!result.canceled && result.assets[0]) {
                const file = {
                  uri: result.assets[0].uri,
                  type: result.assets[0].mimeType?.includes('pdf') ? 'pdf' : 'image',
                  name: result.assets[0].name,
                  size: result.assets[0].size || 'Unknown size'
                };
                
                if (onFileSelect) onFileSelect(file);
                if (onOCRProcess && documentType?.scannable && file.type === 'image') {
                  onOCRProcess(file, documentType);
                }
              }
            }
          },
          { text: "Cancel", style: "cancel" }
        ]
      );
    } catch (error) {
      console.error('File upload error:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [documentType, onFileSelect, onOCRProcess]);

  const getFileIcon = () => {
    if (existingDocument) {
      if (existingDocument.type === 'pdf') return 'document-text';
      if (existingDocument.type === 'image') return 'image';
      return 'attach';
    }
    return documentType?.icon === '📸' ? 'camera' : 'cloud-upload';
  };

  const getStatusColor = () => {
    if (error) return Colors.error;
    if (existingDocument) return Colors.success;
    if (isProcessing || isUploading) return Colors.warning;
    return Colors.textSecondary;
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing with OCR...';
    if (isUploading) return 'Uploading...';
    if (existingDocument && extractedData) return 'Uploaded & Data Extracted';
    if (existingDocument) return 'Uploaded Successfully';
    return `Tap to upload ${documentType?.type || 'document'}`;
  };

  return (
    <View style={styles.fileUploadContainer}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.fileUploadWrapper,
          error && styles.errorInput,
          existingDocument && styles.successInput,
          (isProcessing || isUploading) && styles.processingInput
        ]}
        onPress={handleFileUpload}
        disabled={isProcessing || isUploading}
      >
        <View style={styles.fileUploadContent}>
          <View style={styles.fileUploadIconSection}>
            <Ionicons 
              name={getFileIcon()} 
              size={24} 
              color={getStatusColor()} 
            />
          </View>
          
          <View style={styles.fileUploadTextSection}>
            <Text style={[styles.fileUploadText, { color: getStatusColor() }]}>
              {existingDocument ? existingDocument.name : (documentType?.type || 'Document')}
            </Text>
            <Text style={[styles.fileUploadStatus, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          
          <View style={styles.fileUploadActionSection}>
            {(isProcessing || isUploading) ? (
              <Ionicons name="hourglass" size={20} color={Colors.warning} />
            ) : existingDocument ? (
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            ) : (
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Show extracted data if available */}
      {extractedData && Object.keys(extractedData).length > 0 && (
        <View style={styles.extractedDataContainer}>
          <Text style={styles.extractedDataTitle}>📄 Extracted Data:</Text>
          {Object.entries(extractedData).map(([key, value]) => (
            <View key={key} style={styles.extractedDataItem}>
              <Text style={styles.extractedDataLabel}>{key}:</Text>
              <Text style={styles.extractedDataValue}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {documentType?.description && (
        <Text style={styles.fileUploadDescription}>
          {documentType.description}
        </Text>
      )}
    </View>
  );
};

// Enhanced Document List Component
export const EnhancedDocumentList = ({ 
  documents = [], 
  onRemoveDocument,
  title = "Uploaded Documents" 
}) => {
  if (!documents || documents.length === 0) return null;

  return (
    <View style={styles.documentListContainer}>
      <Text style={styles.documentListTitle}>{title}</Text>
      {documents.map((doc, index) => (
        <View key={doc.id || index} style={styles.documentListItem}>
          <View style={styles.documentListIconSection}>
            <Ionicons 
              name={doc.type === 'pdf' ? 'document-text' : 'image'} 
              size={20} 
              color={Colors.primary} 
            />
          </View>
          
          <View style={styles.documentListContent}>
            <Text style={styles.documentListName}>{doc.name || doc.type}</Text>
            <Text style={styles.documentListMeta}>
              {doc.size} • {doc.scanned ? 'OCR Processed' : 'Uploaded'}
              {doc.extractedData && ' • Data Extracted'}
            </Text>
          </View>
          
          {onRemoveDocument && (
            <TouchableOpacity
              style={styles.documentListRemove}
              onPress={() => onRemoveDocument(doc.id || index)}
            >
              <Ionicons name="close-circle" size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  required: {
    color: Colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  multilineWrapper: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  dateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textLight,
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  selectText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  selectPlaceholder: {
    color: Colors.textLight,
  },
  errorInput: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  
  // File Upload Styles
  fileUploadContainer: {
    marginBottom: Spacing.lg,
  },
  fileUploadWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 60,
  },
  successInput: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '05',
  },
  processingInput: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + '05',
  },
  fileUploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileUploadIconSection: {
    marginRight: Spacing.md,
  },
  fileUploadTextSection: {
    flex: 1,
  },
  fileUploadText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  fileUploadStatus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fileUploadActionSection: {
    marginLeft: Spacing.sm,
  },
  fileUploadDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  
  // Extracted Data Styles
  extractedDataContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.success + '10',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  extractedDataTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  extractedDataItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  extractedDataLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    minWidth: 80,
  },
  extractedDataValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  // Document List Styles
  documentListContainer: {
    marginTop: Spacing.lg,
  },
  documentListTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  documentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  documentListIconSection: {
    marginRight: Spacing.md,
  },
  documentListContent: {
    flex: 1,
  },
  documentListName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  documentListMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  documentListRemove: {
    padding: Spacing.xs,
  },
});

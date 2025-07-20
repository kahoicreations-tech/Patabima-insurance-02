import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';

/**
 * Enhanced Document Upload Component
 */
export const EnhancedDocumentUpload = ({ 
  label, 
  documentType, 
  onDocumentSelect, 
  uploadedDocument,
  error,
  required = false
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const showUploadOptions = () => {
    Alert.alert(
      'Upload Document',
      `Choose how you want to upload your ${documentType}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: captureWithCamera },
        { text: 'Gallery', onPress: selectFromGallery },
        { text: 'Files', onPress: selectDocument },
      ]
    );
  };

  const captureWithCamera = async () => {
    try {
      setIsUploading(true);
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to capture documents.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processDocument(result.assets[0], 'image');
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      setIsUploading(true);
      
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is needed to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processDocument(result.assets[0], 'image');
      }
    } catch (error) {
      console.error('Gallery selection error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const selectDocument = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileType = asset.mimeType?.includes('pdf') ? 'pdf' : 'image';
        await processDocument(asset, fileType);
      }
    } catch (error) {
      console.error('Document selection error:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const processDocument = async (asset, fileType) => {
    try {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (asset.size && asset.size > maxSize) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (asset.mimeType && !allowedTypes.includes(asset.mimeType)) {
        Alert.alert('Invalid File Type', 'Please select a JPEG, PNG, or PDF file.');
        return;
      }

      const documentData = {
        uri: asset.uri,
        type: fileType,
        name: asset.name || `${documentType}_${Date.now()}.${fileType === 'pdf' ? 'pdf' : 'jpg'}`,
        size: asset.size,
        mimeType: asset.mimeType,
        documentType,
        uploadedAt: new Date().toISOString()
      };

      // Call the parent component's handler
      if (onDocumentSelect) {
        await onDocumentSelect(documentData);
      }

      Alert.alert('Success', 'Document uploaded successfully!');
    } catch (error) {
      console.error('Document processing error:', error);
      Alert.alert('Error', 'Failed to process document. Please try again.');
    }
  };

  const removeDocument = () => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onDocumentSelect(null)
        }
      ]
    );
  };

  const getDocumentIcon = () => {
    if (uploadedDocument) {
      return uploadedDocument.type === 'pdf' ? 'document-text' : 'image';
    }
    return 'cloud-upload-outline';
  };

  const getDocumentName = () => {
    if (uploadedDocument) {
      return uploadedDocument.name || 'Document uploaded';
    }
    return `Upload ${documentType}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      <TouchableOpacity 
        style={[
          styles.uploadArea, 
          uploadedDocument && styles.uploadedArea,
          error && styles.errorArea
        ]} 
        onPress={uploadedDocument ? null : showUploadOptions}
        disabled={isUploading}
      >
        {isUploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Uploading...</Text>
          </View>
        ) : (
          <>
            {uploadedDocument && uploadedDocument.type === 'image' && uploadedDocument.uri ? (
              <Image source={{ uri: uploadedDocument.uri }} style={styles.previewImage} />
            ) : (
              <Ionicons 
                name={getDocumentIcon()} 
                size={48} 
                color={uploadedDocument ? Colors.success : Colors.primary} 
              />
            )}
            
            <Text style={[
              styles.uploadText,
              uploadedDocument && styles.uploadedText
            ]}>
              {getDocumentName()}
            </Text>
            
            {uploadedDocument && (
              <Text style={styles.documentInfo}>
                {uploadedDocument.type?.toUpperCase()} • {formatFileSize(uploadedDocument.size)}
              </Text>
            )}
            
            {!uploadedDocument && (
              <Text style={styles.uploadHint}>
                Tap to capture, select from gallery, or choose file
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>

      {uploadedDocument && (
        <View style={styles.documentActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={showUploadOptions}
          >
            <Ionicons name="refresh" size={16} color={Colors.primary} />
            <Text style={styles.actionText}>Replace</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.removeButton]} 
            onPress={removeDocument}
          >
            <Ionicons name="trash" size={16} color={Colors.error} />
            <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.medium,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.small,
    color: Colors.text,
  },
  required: {
    color: Colors.error,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: Colors.lightGray + '20',
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadedArea: {
    borderColor: Colors.success,
    borderStyle: 'solid',
    backgroundColor: Colors.success + '10',
  },
  errorArea: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.primary,
    marginTop: Spacing.small,
  },
  previewImage: {
    width: 80,
    height: 60,
    borderRadius: 4,
    marginBottom: Spacing.small,
  },
  uploadText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.small,
  },
  uploadedText: {
    color: Colors.success,
  },
  documentInfo: {
    ...Typography.caption,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: Spacing.xsmall,
  },
  uploadHint: {
    ...Typography.caption,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: Spacing.small,
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.small,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
  },
  removeButton: {
    // Additional styles for remove button if needed
  },
  actionText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: Spacing.xsmall,
  },
  removeText: {
    color: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.small,
  },
});

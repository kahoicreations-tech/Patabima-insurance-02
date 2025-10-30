import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

// Import constants
import { Colors, Typography, Spacing } from '../../../../../constants';

const KYCDetailsStep = ({
  formData,
  onUpdateFormData,
  showHeader = true,
  requiredDocuments = ['nationalId', 'kraPin', 'logbook'],
  errors = {}
}) => {
  const [uploading, setUploading] = useState(null);

  // Document labels and descriptions
  const documentTypes = {
    nationalId: {
      label: 'National ID',
      description: 'Front and back of National ID',
      icon: 'card-outline'
    },
    kraPin: {
      label: 'KRA PIN Certificate',
      description: 'Valid KRA PIN certificate',
      icon: 'document-text-outline'
    },
    logbook: {
      label: 'Vehicle Logbook',
      description: 'Both sides of vehicle logbook',
      icon: 'car-outline'
    }
  };

  // Request permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera and media access to upload documents.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    }
    return true;
  };

  // Handle document selection
  const handleSelectDocument = async (documentType) => {
    if (!(await requestPermissions())) return;

    setUploading(documentType);

    // Show action sheet for upload options
    Alert.alert(
      'Upload Document',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => captureImage(documentType),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImage(documentType),
        },
        {
          text: 'Choose File (PDF)',
          onPress: () => pickDocument(documentType),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setUploading(null),
        },
      ]
    );
  };

  // Capture image using camera
  const captureImage = async (documentType) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        handleDocumentSuccess(documentType, {
          uri: asset.uri,
          name: `${documentType}_${new Date().getTime()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
        });
      } else {
        setUploading(null);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setUploading(null);
    }
  };

  // Pick image from gallery
  const pickImage = async (documentType) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        handleDocumentSuccess(documentType, {
          uri: asset.uri,
          name: `${documentType}_${new Date().getTime()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
        });
      } else {
        setUploading(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      setUploading(null);
    }
  };

  // Pick document (PDF)
  const pickDocument = async (documentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        handleDocumentSuccess(documentType, {
          uri: result.uri,
          name: result.name,
          type: 'application/pdf',
          size: result.size || 0,
        });
      } else {
        setUploading(null);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
      setUploading(null);
    }
  };

  // Handle successful document upload
  const handleDocumentSuccess = (documentType, documentData) => {
    // Simulate upload delay
    setTimeout(() => {
      // Update form data with the document information
      const updatedDocuments = {
        ...formData.documents,
        [documentType]: {
          ...documentData,
          uploadedAt: new Date().toISOString()
        }
      };
      
      onUpdateFormData({ documents: updatedDocuments });
      setUploading(null);
    }, 1000);
  };

  // Remove document
  const handleRemoveDocument = (documentType) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedDocuments = { ...formData.documents };
            updatedDocuments[documentType] = null;
            onUpdateFormData({ documents: updatedDocuments });
          }
        }
      ]
    );
  };

  // Get file name or truncated version
  const getFileName = (document) => {
    if (!document || !document.name) return '';
    return document.name.length > 20
      ? document.name.substring(0, 17) + '...'
      : document.name;
  };

  // Get file size in readable format
  const getFileSize = (document) => {
    if (!document || !document.size) return '';
    
    const sizeInKB = document.size / 1024;
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)} KB`;
    } else {
      return `${(sizeInKB / 1024).toFixed(1)} MB`;
    }
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KYC Documents</Text>
          <Text style={styles.headerSubtitle}>
            Upload the required documents to continue
          </Text>
        </View>
      )}

      {requiredDocuments.map((docType) => (
        <View key={docType} style={styles.documentSection}>
          <View style={styles.documentHeader}>
            <View style={styles.documentTitleContainer}>
              <Ionicons 
                name={documentTypes[docType].icon} 
                size={22} 
                color={Colors.primary} 
              />
              <Text style={styles.documentTitle}>{documentTypes[docType].label}</Text>
            </View>
            {errors[docType] && (
              <Text style={styles.errorText}>{errors[docType]}</Text>
            )}
          </View>
          
          <Text style={styles.documentDescription}>
            {documentTypes[docType].description}
          </Text>

          {formData.documents[docType] ? (
            <View style={styles.uploadedDocument}>
              <View style={styles.documentInfo}>
                <Ionicons 
                  name={formData.documents[docType].type === 'application/pdf' ? 'document' : 'image'} 
                  size={24} 
                  color={Colors.success} 
                />
                <View style={styles.documentMeta}>
                  <Text style={styles.documentName}>
                    {getFileName(formData.documents[docType])}
                  </Text>
                  <Text style={styles.documentSize}>
                    {getFileSize(formData.documents[docType])}
                  </Text>
                </View>
              </View>

              {formData.documents[docType].uri && formData.documents[docType].type !== 'application/pdf' && (
                <Image 
                  source={{ uri: formData.documents[docType].uri }} 
                  style={styles.documentPreview} 
                  resizeMode="cover"
                />
              )}

              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveDocument(docType)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleSelectDocument(docType)}
              disabled={uploading === docType}
            >
              {uploading === docType ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={22} color={Colors.white} />
                  <Text style={styles.uploadButtonText}>Upload Document</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
        <Text style={styles.infoText}>
          All documents must be clear, complete and valid. This helps us process your insurance quote faster.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  documentSection: {
    marginBottom: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  documentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  documentDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontFamily: 'Poppins_400Regular',
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    fontFamily: 'Poppins_500Medium',
  },
  uploadedDocument: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentMeta: {
    marginLeft: 8,
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: 'Poppins_500Medium',
  },
  documentSize: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  documentPreview: {
    height: 120,
    borderRadius: 6,
    marginTop: 12,
    backgroundColor: '#EFEFEF',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: Colors.error,
    fontSize: 14,
    marginRight: 4,
    fontFamily: 'Poppins_400Regular',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontFamily: 'Poppins_400Regular',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  }
});

export default KYCDetailsStep;
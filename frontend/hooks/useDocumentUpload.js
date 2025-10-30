import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

/**
 * Custom hook for handling document upload functionality
 */
export const useDocumentUpload = () => {
  const [uploadedDocuments, setUploadedDocuments] = useState({});

  // Request permissions for image/document picking
  const requestMediaPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload documents.');
        return false;
      }
    }
    return true;
  };

  // Show document upload options
  const uploadDocument = useCallback(async (documentType) => {
    try {
      // Request permissions
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) return;

      Alert.alert(
        'Upload Document',
        'Choose upload method',
        [
          { text: 'Camera', onPress: () => captureDocument(documentType) },
          { text: 'Gallery', onPress: () => pickDocument(documentType) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  }, []);

  // Capture document using camera
  const captureDocument = useCallback(async (documentType) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedDocuments(prev => ({
          ...prev,
          [documentType]: {
            uri: result.assets[0].uri,
            type: 'image',
            name: `${documentType}_${Date.now()}.jpg`
          }
        }));
        Alert.alert('Success', 'Document captured successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture document. Please try again.');
    }
  }, []);

  // Pick document from storage
  const pickDocument = useCallback(async (documentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedDocuments(prev => ({
          ...prev,
          [documentType]: {
            uri: result.assets[0].uri,
            type: result.assets[0].mimeType?.includes('pdf') ? 'pdf' : 'image',
            name: result.assets[0].name
          }
        }));
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  }, []);

  // Remove a document
  const removeDocument = useCallback((documentType) => {
    setUploadedDocuments(prev => {
      const updatedDocs = { ...prev };
      delete updatedDocs[documentType];
      return updatedDocs;
    });
    Alert.alert('Document Removed', 'Document has been removed successfully.');
  }, []);

  // Check if required documents are uploaded
  const checkRequiredDocuments = useCallback((requiredDocs) => {
    const missingDocs = requiredDocs.filter(doc => !uploadedDocuments[doc]);
    if (missingDocs.length > 0) {
      Alert.alert('Required Documents', `Please upload the following documents: ${missingDocs.join(', ')}`);
      return false;
    }
    return true;
  }, [uploadedDocuments]);

  return {
    uploadedDocuments,
    setUploadedDocuments,
    uploadDocument,
    removeDocument,
    checkRequiredDocuments
  };
};

export default useDocumentUpload;

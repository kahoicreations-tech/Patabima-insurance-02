/* Backup of corrupted DynamicVehicleForm.js for reference */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import motorPricingService from '../../../../../services/MotorInsurancePricingService';

const DynamicPolicyForm = ({ selectedProduct, onDataChange, initialData = {}, values, onChange, errors = {}, productType, onUnderwriterComparison, onUnderwriterSelection }) => {
	const [formData, setFormData] = useState(initialData || values || {});
	const [validationErrors, setValidationErrors] = useState(errors);
	const [underwriterComparisons, setUnderwriterComparisons] = useState([]);
	const [comparingUnderwriters, setComparingUnderwriters] = useState(false);
	const [comparisonError, setComparisonError] = useState(null);
	const [lastComparisonData, setLastComparisonData] = useState(null);
	const [selectedUnderwriter, setSelectedUnderwriter] = useState(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
  
	// Ref to track comparison trigger and prevent duplicates
	const comparisonTriggerRef = useRef(null);
	const comparisonTimeoutRef = useRef(null);

	// Check if a field should be locked (TOR/Third Party with auto-filled data)
	const isFieldLocked = useCallback((fieldKey) => {
		// Check if form data has global lock flag
		const globalLock = formData.isLocked === true;
    
		// Check if specific field has lock metadata
		const fieldHasAutoFill = formData[`${fieldKey}_isAutoFilled`] === true;
		const fieldFromLogbook = formData[`${fieldKey}_autoFillSource`] === 'logbook';
    
		// Fields that can be locked: make, model, year, registrationNumber, chassisNumber
		const lockableFields = ['make', 'model', 'year', 'registrationNumber', 'chassisNumber'];
    
		// Lock if: global lock flag is set AND field is lockable AND has auto-fill data
		return globalLock && lockableFields.includes(fieldKey) && fieldHasAutoFill && fieldFromLogbook;
	}, [formData]);

	// Render a locked field with visual indicator
	const renderLockedField = useCallback((field) => {
		const value = formData[field.key] ?? '';
		return (
			<View key={field.key} style={styles.fieldContainer}>
				<Text style={styles.label}>
					{field.label} {field.required && <Text style={styles.required}>*</Text>}
				</Text>
				<TextInput
					style={[styles.input, { backgroundColor: '#f1f3f5', color: '#6c757d' }]}
					value={String(value)}
					editable={false}
				/>
				{validationErrors[field.key] && (
					<Text style={styles.errorText}>{validationErrors[field.key]}</Text>
				)}
			</View>
		);
	}, [formData, validationErrors]);

	const getIdentificationLabel = useCallback(() => {
		return formData.identificationType === 'Chassis Number' ? 'Chassis Number' : 'Vehicle Registration';
	}, [formData.identificationType]);

	const getIdentificationPlaceholder = useCallback(() => {
		return formData.identificationType === 'Chassis Number' ? 'Enter chassis number' : 'e.g., KDA 123A';
	}, [formData.identificationType]);

	const getFormFields = () => {
		const fields = [
			{ key: 'financialInterest', label: 'Financial Interest', type: 'radio', required: true, options: ['Yes', 'No'] },
			{ key: 'identificationType', label: 'Vehicle Identification Type', type: 'radio', required: true, options: ['Vehicle Registration', 'Chassis Number'] },
			{ key: 'registrationNumber', label: getIdentificationLabel(), type: 'text', required: true, placeholder: getIdentificationPlaceholder() },
			{ key: 'cover_start_date', label: 'Cover Start Date', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
		];

		const subcategoryCode = selectedProduct?.subcategory_code?.toLowerCase() || '';
		const coverageType = (selectedProduct?.coverage_type || '').toLowerCase();
		const isThirdPartyLike = (
			coverageType.includes('third_party') ||
			coverageType.includes('third-party') ||
			coverageType === 'tor' ||
			subcategoryCode.includes('tor') ||
			subcategoryCode.includes('third_party') ||
			subcategoryCode.includes('third-party')
		);

		if (!isThirdPartyLike) {
			fields.push(
				{ key: 'make', label: 'Vehicle Make', type: 'text', required: true, placeholder: 'Toyota' },
				{ key: 'model', label: 'Vehicle Model', type: 'text', required: true, placeholder: 'Axio' },
				{ key: 'year', label: 'Year of Manufacture', type: 'number', required: true, placeholder: '2016' }
			);
		}

		// Placeholder to render the underwriter list in this step (except for comprehensive)
		fields.push({ key: 'underwriter', label: 'Available Underwriters', type: 'underwriter', required: false });

		return fields;
	};

	// ... rest of corrupted content omitted for brevity in backup

};

export default DynamicPolicyForm;

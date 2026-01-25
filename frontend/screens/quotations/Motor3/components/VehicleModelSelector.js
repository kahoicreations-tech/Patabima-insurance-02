/**
 * VehicleModelSelector - Dynamic model dropdown based on selected make
 * Loads models from catalog or allows manual entry for "Other" make
 */

import React, { useMemo } from 'react';
import DropdownSelect from './DropdownSelect';
import { getModelsForMake } from '../../../../constants/vehicleCatalog';

const VehicleModelSelector = React.memo(
  ({
    value,
    onValueChange,
    selectedMake,
    required = true,
    error = null,
    disabled = false,
    testID,
  }) => {
    // Get models for selected make
    const modelOptions = useMemo(() => {
      if (!selectedMake || selectedMake === 'Other') {
        return [{ value: 'Other', label: 'Other (Manual Entry)' }];
      }

      const models = getModelsForMake(selectedMake) || [];
      
      return [
        ...models.map((model) => ({
          value: model,
          label: model,
        })),
        { value: 'Other', label: 'Other (Manual Entry)' },
      ];
    }, [selectedMake]);

    const isDisabled = disabled || !selectedMake;

    return (
      <DropdownSelect
        label="Vehicle Model"
        value={value}
        options={modelOptions}
        onValueChange={onValueChange}
        placeholder={
          !selectedMake
            ? 'Select make first'
            : selectedMake === 'Other'
            ? 'Enter model manually'
            : 'Select vehicle model'
        }
        required={required}
        error={error}
        searchable
        disabled={isDisabled}
        helpText={
          !selectedMake
            ? 'Please select a vehicle make first'
            : modelOptions.length > 10
            ? `${modelOptions.length - 1} models available`
            : null
        }
        testID={testID}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.selectedMake === nextProps.selectedMake &&
      prevProps.error === nextProps.error &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

VehicleModelSelector.displayName = 'VehicleModelSelector';

export default VehicleModelSelector;

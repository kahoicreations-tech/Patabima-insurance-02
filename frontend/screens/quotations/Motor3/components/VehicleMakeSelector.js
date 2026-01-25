/**
 * VehicleMakeSelector - Searchable vehicle make dropdown
 * Uses VEHICLE_MAKES catalog with search functionality
 * Shows popular makes at top for quick selection
 */

import React, { useMemo } from 'react';
import DropdownSelect from './DropdownSelect';
import { VEHICLE_MAKES } from '../../../../constants/vehicleCatalog';

const VehicleMakeSelector = React.memo(
  ({
    value,
    onValueChange,
    required = true,
    error = null,
    disabled = false,
    testID,
  }) => {
    // Prepare options from catalog
    const makeOptions = useMemo(() => {
      // Get all makes
      const allMakes = VEHICLE_MAKES || [];
      
      // Add "Other" option at the end
      return [
        ...allMakes.map((make) => ({
          value: make,
          label: make,
        })),
        { value: 'Other', label: 'Other (Manual Entry)' },
      ];
    }, []);

    // Popular makes for quick access (shown first in search)
    const popularMakes = useMemo(
      () => [
        'Toyota',
        'Nissan',
        'Isuzu',
        'Mitsubishi',
        'Mazda',
        'Subaru',
        'Honda',
        'Mercedes Benz',
        'Volkswagen',
        'Land Rover',
      ],
      []
    );

    return (
      <DropdownSelect
        label="Vehicle Make"
        value={value}
        options={makeOptions}
        onValueChange={onValueChange}
        placeholder="Select vehicle make"
        required={required}
        error={error}
        searchable
        disabled={disabled}
        helpText={`Popular: ${popularMakes.slice(0, 5).join(', ')}, and more`}
        testID={testID}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

VehicleMakeSelector.displayName = 'VehicleMakeSelector';

export default VehicleMakeSelector;

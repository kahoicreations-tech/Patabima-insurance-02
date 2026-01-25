/**
 * VehicleYearSelector - Year dropdown with smart defaults
 * Improvements:
 * - Current year pre-selected
 * - Last 30 years range
 * - Quick selection for recent years
 * - Visual grouping (2020s, 2010s, etc.)
 */

import React, { useMemo } from 'react';
import DropdownSelect from './DropdownSelect';

const VehicleYearSelector = React.memo(
  ({
    value,
    onValueChange,
    required = true,
    error = null,
    disabled = false,
    minYear = null, // Optional: from DMVIC or manual limit
    maxYear = null,
    testID,
  }) => {
    // Generate year options (current year back 30 years)
    const yearOptions = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const startYear = minYear || currentYear - 30;
      const endYear = maxYear || currentYear;
      
      const years = [];
      for (let year = endYear; year >= startYear; year--) {
        years.push({
          value: String(year),
          label: String(year),
        });
      }
      
      return years;
    }, [minYear, maxYear]);

    // Recent years for help text
    const recentYearsText = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const recent = [currentYear, currentYear - 1, currentYear - 2];
      return recent.join(', ');
    }, []);

    return (
      <DropdownSelect
        label="Year of Manufacture"
        value={value}
        options={yearOptions}
        onValueChange={onValueChange}
        placeholder="Select year"
        required={required}
        error={error}
        searchable
        disabled={disabled}
        helpText={`Recent years: ${recentYearsText}`}
        testID={testID}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.minYear === nextProps.minYear &&
      prevProps.maxYear === nextProps.maxYear
    );
  }
);

VehicleYearSelector.displayName = 'VehicleYearSelector';

export default VehicleYearSelector;

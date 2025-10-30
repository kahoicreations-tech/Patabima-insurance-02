import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * DynamicFormRenderer
 * Renders a form from schema.sections[].fields[] supporting basic types plus repeater.
 * Props:
 *  schema: { sections: [{ title, fields: [...] }] }
 *  value: current form data object
 *  onChange: (data) => void
 */
export default function DynamicFormRenderer({ schema, value, onChange, showValidation = true, validateOnChange = true }) {
  const [errors, setErrors] = useState({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [datePickers, setDatePickers] = useState({}); // track open pickers

  // Use parent's value directly (controlled component)
  const formData = value || {};

  const runValidation = useCallback((field, val) => {
    if (!field) return null;
    const v = val === undefined || val === null ? '' : val;
    if (field.required && (v === '' || (Array.isArray(v) && v.length === 0))) return 'Required';
    if (field.type === 'number') {
      const num = Number(v);
      if (v !== '' && isNaN(num)) return 'Must be a number';
      if (field.min !== undefined && num < field.min) return `Min ${field.min}`;
      if (field.max !== undefined && num > field.max) return `Max ${field.max}`;
    }
    if (field.pattern) {
      try { const re = new RegExp(field.pattern); if (v && !re.test(v)) return 'Invalid format'; } catch {}
    }
    return null;
  }, []);

  const validateAll = useCallback((data) => {
    const newErrors = {};
    (schema?.sections||[]).forEach(section => {
      (section.fields||[]).forEach(field => {
        if (field.type === 'repeater') {
          const arr = data[field.name];
          if (field.required && (!Array.isArray(arr) || arr.length === 0)) newErrors[field.name] = 'At least one item required';
        } else {
          const err = runValidation(field, data[field.name]);
          if (err) newErrors[field.name] = err;
        }
      });
    });
    return newErrors;
  }, [schema, runValidation]);

  const updateField = useCallback((name, val, fieldMeta) => {
    const next = { ...formData, [name]: val };
    if (validateOnChange && fieldMeta) {
      const err = runValidation(fieldMeta, val);
      setErrors(e => ({ ...e, [name]: err || undefined }));
    }
    onChange && onChange(next);
  }, [formData, onChange, runValidation, validateOnChange]);

  const validateAndExpose = useCallback(() => {
    const allErrors = validateAll(formData);
    setErrors(allErrors);
    setShowAllErrors(true);
    return { valid: Object.keys(allErrors).length === 0, errors: allErrors };
  }, [formData, validateAll]);

  // expose validate via ref pattern (if parent passes function prop later we can adapt)
  useEffect(() => { /* placeholder for future imperative handle */ }, []);

  const renderField = (field, index, sectionIndex) => {
    const fieldValue = formData[field.name] ?? '';

    if (field.type === 'repeater') {
      const items = Array.isArray(fieldValue) ? fieldValue : [];
      const addItem = () => {
        const newItem = {};
        (field.itemSchema?.fields || []).forEach(f => { newItem[f.name] = ''; });
        const next = [...items, newItem];
        updateField(field.name, next, field);
      };
      const updateItem = (i, key, val) => {
        const next = items.map((it, idx) => idx === i ? { ...it, [key]: val } : it);
        updateField(field.name, next, field);
      };
      return (
        <View key={`${sectionIndex}-${index}`} style={styles.repeaterContainer}>
          <Text style={styles.label}>{field.label}</Text>
          {showValidation && errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
          {items.map((item, i) => (
            <View key={i} style={styles.repeaterItem}>
              {(field.itemSchema?.fields || []).map(sub => (
                <View key={sub.name} style={styles.inputGroup}>
                  <Text style={styles.subLabel}>{sub.label}</Text>
                  <TextInput
                    value={item[sub.name]}
                    onChangeText={t => updateItem(i, sub.name, t)}
                    style={styles.input}
                    placeholder={sub.label}
                  />
                </View>
              ))}
            </View>
          ))}
          <TouchableOpacity onPress={addItem} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add {field.itemSchema?.itemLabel || 'Item'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (field.type === 'select' && Array.isArray(field.options)) {
      return (
        <View key={`${sectionIndex}-${index}`} style={styles.inputGroup}>
          <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
          <View style={styles.selectContainer}>
            {(field.options || []).map(opt => (
              <TouchableOpacity key={opt.value || opt} onPress={() => updateField(field.name, opt.value ?? opt, field)} style={[styles.chip, (fieldValue === (opt.value ?? opt)) && styles.chipActive]}>
                <Text style={[styles.chipText, (fieldValue === (opt.value ?? opt)) && styles.chipTextActive]}>{opt.label || opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {showValidation && errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
        </View>
      );
    }

    if (field.type === 'boolean') {
      return (
        <View key={`${sectionIndex}-${index}`} style={[styles.inputGroup, styles.booleanRow]}>
          <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
          <Switch value={!!fieldValue} onValueChange={v => updateField(field.name, v, field)} />
          {showValidation && errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
        </View>
      );
    }

    if (field.type === 'date') {
      const showPicker = !!datePickers[field.name];
      const displayVal = fieldValue ? new Date(fieldValue).toLocaleDateString() : 'Select Date';
      return (
        <View key={`${sectionIndex}-${index}`} style={styles.inputGroup}>
          <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickers(p => ({ ...p, [field.name]: true }))}>
            <Text style={styles.dateButtonText}>{displayVal}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={fieldValue ? new Date(fieldValue) : new Date()}
              mode="date"
              display="default"
              onChange={(evt, dt) => {
                setDatePickers(p => ({ ...p, [field.name]: false }));
                if (dt) updateField(field.name, dt.toISOString().substring(0,10), field);
              }}
            />
          )}
          {showValidation && errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
        </View>
      );
    }

    // Basic text/number/email/select placeholder (select rendered as text for now)
    return (
      <View key={`${sectionIndex}-${index}`} style={styles.inputGroup}>
        <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
        <TextInput
          value={String(fieldValue)}
          keyboardType={field.type === 'number' ? 'numeric' : 'default'}
          onChangeText={t => updateField(field.name, t, field)}
          placeholder={field.label}
          style={styles.input}
        />
        {showValidation && errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {(schema?.sections || []).map((section, sIdx) => (
        <View key={sIdx} style={styles.section}>
          {!!section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
          {(section.fields || []).map((field, fIdx) => renderField(field, fIdx, sIdx))}
        </View>
      ))}
      {showValidation && showAllErrors && Object.keys(errors).length > 0 && (
        <View style={styles.validationSummary}>
          <Text style={styles.validationSummaryTitle}>Please fix {Object.keys(errors).length} field(s)</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  subLabel: { fontSize: 12, color: '#555', marginBottom: 2 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, fontSize: 14 },
  repeaterContainer: { marginVertical: 10 },
  repeaterItem: { padding: 8, backgroundColor: '#fafafa', borderRadius: 6, marginBottom: 8 },
  addButton: { backgroundColor: '#D5222B', padding: 10, borderRadius: 6, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600' }
  ,selectContainer: { flexDirection:'row', flexWrap:'wrap' },
  chip: { backgroundColor:'#f2f2f2', paddingHorizontal:10, paddingVertical:6, borderRadius:16, marginRight:6, marginBottom:6 },
  chipActive: { backgroundColor:'#D5222B' },
  chipText: { color:'#333', fontSize:12 },
  chipTextActive: { color:'#fff' },
  booleanRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  dateButton: { borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:10, backgroundColor:'#fff' },
  dateButtonText: { fontSize:14 },
  errorText: { color:'#b00020', fontSize:11, marginTop:4 },
  validationSummary: { backgroundColor:'#fff3cd', padding:12, margin:12, borderRadius:8, borderWidth:1, borderColor:'#ffe69c' },
  validationSummaryTitle: { color:'#8a6d3b', fontSize:13, fontWeight:'600' }
});

import React from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * DynamicForm
 * props:
 *  - schema: { fields: [ { key, label, type, required, schema(for repeat_group) } ] }
 *  - values: object state
 *  - onChange: (key, value) => void
 */
export const DynamicForm = ({ schema, values, onChange }) => {
  if (!schema || !Array.isArray(schema.fields)) return null;

  return (
    <View style={styles.container}>
      {schema.fields.map(field => {
        const val = values[field.key];
        switch (field.type) {
          case 'text':
          case 'number':
            return (
              <View key={field.key} style={styles.field}> 
                <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
                <TextInput
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  value={val?.toString() || ''}
                  onChangeText={t => onChange(field.key, field.type === 'number' ? (t ? Number(t) : '') : t)}
                  style={styles.input}
                  placeholder={field.label}
                />
              </View>
            );
          case 'boolean':
            return (
              <View key={field.key} style={styles.switchRow}> 
                <Text style={styles.label}>{field.label}</Text>
                <Switch value={!!val} onValueChange={v => onChange(field.key, v)} />
              </View>
            );
          case 'multi_select':
            // Simplified: treat as toggle chip set (for now empty list)
            return (
              <View key={field.key} style={styles.field}> 
                <Text style={styles.label}>{field.label}</Text>
                <Text style={styles.placeholder}>Multi-select UI TBD</Text>
              </View>
            );
          case 'file':
            return (
              <View key={field.key} style={styles.field}> 
                <Text style={styles.label}>{field.label}</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => {/* integrate file picker later */}}>
                  <Text style={styles.uploadText}>{val ? 'File Selected' : 'Select a file'}</Text>
                </TouchableOpacity>
              </View>
            );
          case 'date':
            return (
              <View key={field.key} style={styles.field}> 
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  value={val || ''}
                  onChangeText={t => onChange(field.key, t)}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            );
          case 'repeat_group':
            const items = Array.isArray(val) ? val : [];
            return (
              <View key={field.key} style={styles.field}> 
                <Text style={styles.label}>{field.label}</Text>
                {items.map((row, idx) => (
                  <View key={idx} style={styles.groupRow}>
                    {(field.schema || []).map(sub => (
                      <TextInput
                        key={sub.key}
                        placeholder={sub.label}
                        value={row[sub.key]?.toString() || ''}
                        onChangeText={t => {
                          const clone = [...items];
                          clone[idx] = { ...clone[idx], [sub.key]: t };
                          onChange(field.key, clone);
                        }}
                        style={[styles.input, styles.groupInput]}
                      />
                    ))}
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => onChange(field.key, [...items, {}])}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            );
          default:
            return (
              <View key={field.key} style={styles.field}> 
                <Text style={styles.label}>{field.label}</Text>
                <Text style={styles.placeholder}>Unsupported field type: {field.type}</Text>
              </View>
            );
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { },
  field: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  placeholder: { color: '#888', fontSize: 12 },
  uploadBtn: { backgroundColor: '#f2f2f2', padding: 12, borderRadius: 8, alignItems: 'center' },
  uploadText: { color: '#333' },
  groupRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  groupInput: { flex: 1 },
  addBtn: { backgroundColor: '#D5222B', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontWeight: '600' }
});

export default DynamicForm;

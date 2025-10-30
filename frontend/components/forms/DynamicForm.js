import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Colors, Spacing, Typography } from '../../constants';

const DynamicForm = ({ fields, onSubmit }) => {
  const { control, handleSubmit, formState: { errors } } = useForm();

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <View key={field.name} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}</Text>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={field.placeholder}
                />
              )}
              name={field.name}
              rules={field.rules}
            />
            {errors[field.name] && <Text style={styles.errorText}>{errors[field.name].message}</Text>}
          </View>
        );
      // Add other field types here (dropdown, radio, etc.)
      default:
        return null;
    }
  };

  return (
    <View>
      {fields.map(renderField)}
      <Button title="Submit" onPress={handleSubmit(onSubmit)} />
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: Spacing.medium,
  },
  label: {
    ...Typography.body,
    marginBottom: Spacing.small,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 5,
    padding: Spacing.medium,
    ...Typography.body,
  },
  errorText: {
    color: Colors.danger,
    marginTop: Spacing.small,
  },
});

export default DynamicForm;

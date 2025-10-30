import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants';
import Card from '../common/Card';
import Button from '../common/Button';

const CampaignCard = ({
  title,
  description,
  ctaText = 'Learn More',
  onPress,
  style
}) => {
  return (
    <Card style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      
      <Button
        title={ctaText}
        onPress={onPress}
        size="small"
        style={styles.ctaButton}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 260,
    marginRight: Spacing.lg,
    backgroundColor: Colors.cardBackground,
  },
  content: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.lg,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  ctaButton: {
    alignSelf: 'flex-start',
  },
});

export default CampaignCard;

import { ActivityIndicator, View } from 'react-native';
import React, { memo } from 'react';

export const Loading = memo(() => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'black',
    }}>
    <ActivityIndicator size="large" style={{ alignSelf: 'center' }} />
  </View>
));

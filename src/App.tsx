/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {StyleSheet, View} from 'react-native';
import React, {Suspense} from 'react';

import {CameraPage} from './CameraPage';
import {Loading} from './components/Loading';

function App(): JSX.Element {
  return (
    <View style={{flex: 1}}>
      <Suspense fallback={<Loading />}>
        <CameraPage />
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({});
export default App;

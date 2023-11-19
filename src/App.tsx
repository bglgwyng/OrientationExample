/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {StyleSheet, View} from 'react-native';
import React, {Suspense, memo, useEffect} from 'react';

import {
  Camera,
  useCameraDevices,
  useCameraFormat,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {Loading} from './Loading';
import {cameraFormatFilters} from './consts';
import {cameraPermissionAtom} from './cameraPermission';
import {useAtom} from 'jotai';

function App(): JSX.Element {
  return (
    <View style={{flex: 1}}>
      <Suspense fallback={<Loading />}>
        <CameraPage />
      </Suspense>
    </View>
  );
}

const CameraPage = memo(() => {
  const [cameraPermission, requestCameraPermission] =
    useAtom(cameraPermissionAtom);

  useEffect(() => {
    if (cameraPermission === 'not-determined') {
      requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);
  if (cameraPermission === 'denied') {
    throw new Error('Camera permission is denied');
  }

  const device = useCameraDevices().find(device => device.position === 'back');
  const format = useCameraFormat(device, cameraFormatFilters);

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
  }, []);

  if (!device) return null;

  return (
    <Camera
      device={device}
      format={format}
      pixelFormat="yuv"
      style={StyleSheet.absoluteFill}
      frameProcessor={frameProcessor}
      isActive
    />
  );
});

const styles = StyleSheet.create({});

export default App;

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {Button, SafeAreaView, StyleSheet, View} from 'react-native';
import React, {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';

import {
  Camera,
  CameraPosition,
  useCameraDevices,
  useCameraFormat,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {Loading} from './Loading';
import {cameraFormatFilters} from './consts';
import {cameraPermissionAtom} from './cameraPermission';
import {saveFrame} from './frameProcessors/saveFrame';
import {useAtom} from 'jotai';
import {useSharedValue} from 'react-native-worklets-core';

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

  const [position, flip] = useReducer(
    (prev: CameraPosition) => (prev === 'back' ? 'front' : 'back'),
    'back',
  );

  const device = useCameraDevices().find(
    device => device.position === position,
  );
  const format = useCameraFormat(device, cameraFormatFilters);

  const shouldCaptureNextFrame = useSharedValue(false);
  const captureNextFrame = useCallback(() => {
    shouldCaptureNextFrame.value = true;
  }, [shouldCaptureNextFrame]);

  const shoot = useCallback(async () => {
    CameraRoll.save((await camera.current!.takePhoto()).path);
  }, []);

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';

    if (shouldCaptureNextFrame.value) {
      shouldCaptureNextFrame.value = false;
      saveFrame(frame, {albumName: 'Debug'});
    }
  }, []);

  const camera = useRef<Camera>(null);

  if (!device) return null;

  return (
    <View style={{flex: 1}}>
      <Camera
        ref={camera}
        device={device}
        format={format}
        pixelFormat="yuv"
        style={StyleSheet.absoluteFill}
        frameProcessor={frameProcessor}
        photo
        isActive
      />
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1}} />
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1}}>
            <Button title="Capture" onPress={captureNextFrame} />
          </View>
          <View style={{flex: 1}}>
            <Button title="Shoot" onPress={shoot} />
          </View>
          <View style={{flex: 1}}>
            <Button title="Flip" onPress={flip} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
});

const styles = StyleSheet.create({});

export default App;

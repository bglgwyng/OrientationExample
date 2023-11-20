/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {
  Button,
  SafeAreaView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import React, {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import {
  Camera,
  useCameraDevices,
  useCameraFormat,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {Loading} from './components/Loading';
import {cameraFormatFilters} from './consts';
import {cameraPermissionAtom} from './atoms/cameraPermissionAtom';
import {getFrameInfo} from './utils/frameInfo';
import {runOnJS} from 'react-native-reanimated';
import {saveFrame} from './frameProcessors/saveFrame';
import {scanFaces} from './frameProcessors/scanFaces';
import {useAtom} from 'jotai';
import {useSharedValue} from 'react-native-worklets-core';
import BoundingBox from './components/BoundingBox';
import FaceTracker, {TrackedFace} from './FaceTracker';
import useOrientationEffect from './hooks/useOrientationEffect';
import useRunInJsCallback from './hooks/useRunInJsCallback';

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
  const windowDimensions = useWindowDimensions();
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

  const camera = useRef<Camera>(null);

  const [direction, flip] = useReducer(
    (prev: Direction) => (prev === 'back' ? 'front' : 'back'),
    'back',
  );

  const device = useCameraDevices().find(
    device => device.position === direction,
  );
  const format = useCameraFormat(device, cameraFormatFilters);

  const shouldCaptureNextFrame = useSharedValue(false);
  const captureNextFrame = useCallback(() => {
    shouldCaptureNextFrame.value = true;
  }, [shouldCaptureNextFrame]);

  const shoot = useCallback(async () => {
    CameraRoll.save((await camera.current!.takePhoto()).path);
  }, []);

  const faceTracker = useMemo(
    () => new FaceTracker(windowDimensions, direction === 'front'),
    [direction, windowDimensions],
  );

  const [trackedFaces, setTrackedFaces] = useState<TrackedFace[]>([]);
  useEffect(() => {
    const subscription = faceTracker.subject.subscribe(setTrackedFaces);

    return () => {
      subscription.unsubscribe();
    };
  }, [faceTracker.observable, faceTracker.subject]);

  const nextDetectedFaces = useRunInJsCallback(faceTracker.next, [faceTracker]);

  const [deviceOrientation, setDeviceOrientation] =
    useState<DeviceOrientation>('portrait');
  useOrientationEffect(newOrientation => {
    'worklet';
    runOnJS(setDeviceOrientation)(newOrientation);
  });

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      if (shouldCaptureNextFrame.value) {
        shouldCaptureNextFrame.value = false;
        saveFrame(frame, {albumName: 'Debug'});
      }

      const frameInfo = getFrameInfo(frame, direction);
      const orientedFrameInfo = getFrameInfo(
        frame,
        direction,
        deviceOrientation,
      );

      // FIXME: `runAsync` is not working
      // runAsync(frame, () => {
      //   'worklet';
      const faces = scanFaces(frame, frameInfo, orientedFrameInfo);
      nextDetectedFaces(faces, frameInfo);
    },
    [deviceOrientation, direction, nextDetectedFaces, shouldCaptureNextFrame],
  );

  return (
    <View style={{flex: 1}}>
      {device && (
        <Camera
          device={device}
          ref={camera}
          format={format}
          pixelFormat="yuv"
          style={StyleSheet.absoluteFill}
          frameProcessor={frameProcessor}
          photo
          isActive
        />
      )}
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
      {trackedFaces.map(face => (
        <BoundingBox key={face.trackingId} bounds={face.animatedBounds} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({});
export default App;

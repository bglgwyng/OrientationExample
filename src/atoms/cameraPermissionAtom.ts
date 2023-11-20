import {Camera} from 'react-native-vision-camera';
import {atom} from 'jotai';
import permissionRequestMutex from '../utils/permissionRequestMutex';

export const cameraPermissionAtom = atom(
  get => get(baseAtom),
  (get, set) => {
    permissionRequestMutex.runExclusive(async () => {
      const permission = await Camera.requestCameraPermission();
      set(baseAtom, Promise.resolve(permission));
    });
  },
);

const baseAtom = atom(Camera.getCameraPermissionStatus());

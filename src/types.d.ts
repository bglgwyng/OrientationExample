import {ExifOrientation} from './utils/exifOrientation';
import {Orientation} from 'react-native-vision-camera';

declare global {
  type Size = {width: number; height: number};

  type Rect = {
    top: number;
    left: number;
    width: number;
    height: number;
  };

  type FrameInfo = {
    width: number;
    height: number;
    exifOrientation: ExifOrientation;
    timestamp: number;
  };

  type Point2D = {x: number; y: number};
  type Point3D = {x: number; y: number; z: number};

  type DeviceOrientation = Orientation;
  type Direction = CameraPosition;

  interface Face {
    leftEyeOpenProbability: number;
    rollAngle: number;
    pitchAngle: number;
    yawAngle: number;
    bounds: {
      top: number;
      left: number;
      height: number;
      width: number;
    };
    trackingId: number;
  }
}

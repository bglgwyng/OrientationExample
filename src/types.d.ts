import {ExifOrientation} from './utils/exifOrientation';

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

  type Point = {x: number; y: number};

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

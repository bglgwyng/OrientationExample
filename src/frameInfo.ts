import {
  ExifOrientation,
  compose,
  fromDeviceOrientation,
  inverse,
  isTransposed,
  transformFromHorizontal,
} from './exifOrientation';

import {Frame, Orientation, PhotoFile} from 'react-native-vision-camera';
import {Matrix3x3} from './matrix3x3';
import {Platform} from 'react-native';

export const getFrameInfo = (
  frame: Frame,
  direction: Direction,
  deviceOrientation: Orientation = 'portrait',
): FrameInfo => {
  'worklet';
  const frameExifOrientation =
    Platform.OS === 'ios'
      ? // orientation 값 무시하고 `portrait`으로 간주
        frame.isMirrored
        ? ExifOrientation.MirrorHorizontal
        : ExifOrientation.Horizontal
      : // android에선 `isMirrored`를 무시하고 `false`로 간주
        {
          portrait: ExifOrientation.Horizontal,
          'portrait-upside-down': ExifOrientation.Rotate180,
          'landscape-left': ExifOrientation.Rotate270,
          'landscape-right': ExifOrientation.Rotate90,
        }[frame.orientation];
  // portrait에서 `saveFrame`하면 `frameExifOrientation`의 방향을 가지는 사진이 저장되어야함
  // saveFrame(frame, { albumName: "Debug" });
  return {
    width: frame.width,
    height: frame.height,
    exifOrientation: compose(
      fromDeviceOrientation(deviceOrientation, direction),
      frameExifOrientation,
    ),
    timestamp: frame.timestamp,
  };
};

export const getFrameInfoFromPhoto = (
  photo: PhotoFile,
  direction: Direction,
  deviceOrientation: Orientation = 'portrait',
): FrameInfo => {
  'worklet';
  const {width, height, metadata, isMirrored} = photo;
  const frameExifOrientation =
    metadata?.Orientation ??
    (isMirrored
      ? {
          portrait: ExifOrientation.MirrorHorizontal,
          'portrait-upside-down': ExifOrientation.MirrorVertical,
          // TODO: 맞느지 확인
          'landscape-left': ExifOrientation.MirrorHorizontalRotate270,
          'landscape-right': ExifOrientation.MirrorHorizontalRotate90,
        }
      : {
          portrait: ExifOrientation.Horizontal,
          'portrait-upside-down': ExifOrientation.Rotate180,
          'landscape-left': ExifOrientation.Rotate270,
          'landscape-right': ExifOrientation.Rotate90,
        })[photo.orientation];
  // portrait에서 `saveFrame`하면 `frameExifOrientation`의 방향을 가지는 사진이 저장되어야함
  // saveFrame(frame, { albumName: "Debug" });
  return {
    width,
    height,
    exifOrientation: compose(
      fromDeviceOrientation(deviceOrientation, direction),
      frameExifOrientation,
    ),
    timestamp: 0,
  };
};

export const imageSize = (frameInfo: FrameInfo): Size => {
  'worklet';
  const {width, height, exifOrientation} = frameInfo;
  return isTransposed(exifOrientation)
    ? {width: height, height: width}
    : {width, height};
};

export const getRect = (frameInfo: FrameInfo): Rect => {
  'worklet';
  return {
    left: 0,
    top: 0,
    ...imageSize(frameInfo),
  };
};

export const transformTo = (
  frameInfo: FrameInfo,
  to: ExifOrientation,
): readonly [newFrame: FrameInfo, transform: Matrix3x3] => {
  'worklet';
  const oldOrientation = frameInfo.exifOrientation;
  return [
    {...frameInfo, exifOrientation: to},
    transformFromHorizontal(
      compose(inverse(oldOrientation), to),
      ...(isTransposed(oldOrientation)
        ? ([frameInfo.height, frameInfo.width] as const)
        : ([frameInfo.width, frameInfo.height] as const)),
    ),
  ];
};

export const transformBack = (
  frameInfo: FrameInfo,
  from: ExifOrientation,
): readonly [newFrame: FrameInfo, transform: Matrix3x3] => {
  'worklet';
  const to = frameInfo.exifOrientation;

  return [
    frameInfo,
    transformFromHorizontal(
      compose(inverse(from), to),
      ...(isTransposed(from) !== isTransposed(to)
        ? ([frameInfo.height, frameInfo.width] as const)
        : ([frameInfo.width, frameInfo.height] as const)),
    ),
  ];
};

export const transformBy = (
  frameInfo: FrameInfo,
  by: ExifOrientation,
): readonly [newFrame: FrameInfo, transform: Matrix3x3] => {
  'worklet';
  const {exifOrientation} = frameInfo;
  return [
    {...frameInfo, exifOrientation: compose(exifOrientation, by)},
    transformFromHorizontal(
      by,
      ...(isTransposed(exifOrientation)
        ? ([frameInfo.height, frameInfo.width] as const)
        : ([frameInfo.width, frameInfo.height] as const)),
    ),
  ];
};

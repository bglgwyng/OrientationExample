import {Frame, Orientation} from 'react-native-vision-camera';
import {
  Matrix3x3,
  identity,
  multiply,
  rotate,
  scale,
  translate,
} from './matrix3x3';
import {Platform} from 'react-native';

export enum ExifOrientation {
  Horizontal = 1,
  MirrorHorizontal = 2,
  Rotate180 = 3,
  MirrorVertical = 4,
  MirrorHorizontalRotate270 = 5,
  Rotate90 = 6,
  MirrorHorizontalRotate90 = 7,
  Rotate270 = 8,
}

const orientations = [
  ExifOrientation.Horizontal,
  ExifOrientation.MirrorHorizontal,
  ExifOrientation.Rotate180,
  ExifOrientation.MirrorVertical,
  ExifOrientation.MirrorHorizontalRotate270,
  ExifOrientation.Rotate90,
  ExifOrientation.MirrorHorizontalRotate90,
  ExifOrientation.Rotate270,
];

// r is clockwize 90deg rotation
// f is horizontal flip
const operationMap = {
  [ExifOrientation.Horizontal]: '',
  [ExifOrientation.MirrorHorizontal]: 'f',
  [ExifOrientation.Rotate180]: 'rr',
  [ExifOrientation.MirrorVertical]: 'frr',
  [ExifOrientation.MirrorHorizontalRotate270]: 'frrr',
  [ExifOrientation.Rotate90]: 'rrr',
  [ExifOrientation.MirrorHorizontalRotate90]: 'fr',
  [ExifOrientation.Rotate270]: 'r',
};

const operation = (orientation: ExifOrientation) => operationMap[orientation];

const normalize = (operation: string) => {
  while (true) {
    const operation$ = operation
      .replace(/ff/g, '')
      .replace(/rrrr/g, '')
      .replace('rf', 'frrr');
    if (operation$ === operation) {
      return operation;
    }
    operation = operation$;
  }
};

export const isTransposed = (orientation: ExifOrientation) => {
  'worklet';
  return orientation >= ExifOrientation.MirrorHorizontalRotate270;
};

const inverseMap = Object.fromEntries(
  orientations.map(i => [
    i,
    orientations.find(j => normalize(operation(i) + operation(j)) === '')!,
  ]),
);

export const inverse = (orientation: ExifOrientation): ExifOrientation => {
  'worklet';
  return inverseMap[orientation];
};

export const transformFromHorizontal = (
  orientation: ExifOrientation,
  width: number,
  height: number,
): Matrix3x3 => {
  'worklet';
  return {
    [ExifOrientation.Horizontal]: () => identity,
    [ExifOrientation.MirrorHorizontal]: () =>
      multiply(translate(width, 0), scale(-1, 1)),
    [ExifOrientation.Rotate180]: () =>
      multiply(rotate(Math.PI), translate(-width, -height)),
    [ExifOrientation.MirrorVertical]: () =>
      multiply(translate(0, height), scale(1, -1)),
    [ExifOrientation.MirrorHorizontalRotate270]: () =>
      multiply(rotate(-Math.PI / 2), scale(-1, 1)),
    [ExifOrientation.Rotate90]: () =>
      multiply(rotate(-Math.PI / 2), translate(-width, 0)),
    [ExifOrientation.MirrorHorizontalRotate90]: () =>
      multiply(
        multiply(rotate(Math.PI / 2), translate(width, -height)),
        scale(-1, 1),
      ),
    [ExifOrientation.Rotate270]: () =>
      multiply(rotate(Math.PI / 2), translate(0, -height)),
  }[orientation]();
};

export const fromFrame: (frame: Frame) => ExifOrientation =
  Platform.OS === 'ios'
    ? ({orientation, isMirrored}) => {
        'worklet';
        // orientation 값 무시하고 `portrait`으로 간주
        return isMirrored
          ? ExifOrientation.MirrorHorizontal
          : ExifOrientation.Horizontal;
      }
    : ({orientation}) => {
        'worklet';
        // android에선 `isMirrored`를 무시하고 `false`로 간주
        return {
          portrait: ExifOrientation.Horizontal,
          'portrait-upside-down': ExifOrientation.Rotate180,
          'landscape-left': ExifOrientation.Rotate270,
          'landscape-right': ExifOrientation.Rotate90,
        }[orientation];
      };

export const fromPhotoOrientation: (
  orientation: Orientation,
  direction: Direction,
) => ExifOrientation =
  Platform.OS === 'ios'
    ? (orientation, position) => {
        'worklet';
        // TODO: ios Frame 구현을 고쳐야함
        return position === 'front'
          ? ExifOrientation.MirrorHorizontal
          : ExifOrientation.Horizontal;
      }
    : (orientation, position) => {
        'worklet';
        // Android에서 front camera로 찍은 사진은 옵션을 어떻게 주든 무조건 mirrored되는 듯
        return compose(
          position === 'front'
            ? ExifOrientation.MirrorHorizontal
            : ExifOrientation.Horizontal,
          {
            portrait: ExifOrientation.Horizontal,
            'portrait-upside-down': ExifOrientation.Rotate180,
            'landscape-left': ExifOrientation.Rotate270,
            'landscape-right': ExifOrientation.Rotate90,
          }[orientation],
        );
      };

export const mirror = (orientation: ExifOrientation) => {
  'worklet';
  return {
    [ExifOrientation.Horizontal]: ExifOrientation.MirrorHorizontal,
    [ExifOrientation.MirrorHorizontal]: ExifOrientation.Horizontal,
    [ExifOrientation.Rotate180]: ExifOrientation.MirrorVertical,
    [ExifOrientation.MirrorVertical]: ExifOrientation.Rotate180,
    [ExifOrientation.MirrorHorizontalRotate270]: ExifOrientation.Rotate90,
    [ExifOrientation.Rotate90]: ExifOrientation.MirrorHorizontalRotate270,
    [ExifOrientation.MirrorHorizontalRotate90]: ExifOrientation.Rotate270,
    [ExifOrientation.Rotate270]: ExifOrientation.MirrorHorizontalRotate90,
  }[orientation];
};

const composeMap: Record<number, Record<number, number>> = {};
for (const i of orientations) {
  composeMap[i] = {};
  for (const j of orientations) {
    const k = normalize(operation(i) + operation(j));

    composeMap[i][j] = orientations.find(i => operation(i) === k)!;
  }
}

export const compose = (...xs: ExifOrientation[]): ExifOrientation => {
  'worklet';
  return xs.reduce(
    (x, y) => composeMap[x][y < 0 ? inverse(-y) : y],
    ExifOrientation.Horizontal,
  );
};

export const fromDeviceOrientation = (
  orientation: Orientation,
  position: Direction,
): ExifOrientation => {
  'worklet';
  const exifOrientation: ExifOrientation =
    position === 'front'
      ? {
          portrait: ExifOrientation.Horizontal,
          'portrait-upside-down': ExifOrientation.Rotate180,
          'landscape-left': ExifOrientation.Rotate270,
          'landscape-right': ExifOrientation.Rotate90,
        }[orientation]
      : {
          portrait: ExifOrientation.Horizontal,
          'portrait-upside-down': ExifOrientation.Rotate180,
          'landscape-left': ExifOrientation.Rotate90,
          'landscape-right': ExifOrientation.Rotate270,
        }[orientation];

  return exifOrientation;
};

const isMirroredMap = Object.fromEntries(
  orientations.map(i => [i, normalize(operation(i))[0] === 'f']),
);

export const isMirrored = (orientation: ExifOrientation) => {
  'worklet';
  return isMirroredMap[orientation];
};

export const fromFrameOrientation = (frame: Frame) =>
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

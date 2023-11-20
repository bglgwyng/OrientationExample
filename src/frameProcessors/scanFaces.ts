import {ExifOrientation, compose, inverse} from '../utils/exifOrientation';
import {Frame, VisionCameraProxy} from 'react-native-vision-camera';
import {Platform} from 'react-native';
import {applyToRect} from '../utils/matrix3x3';
import {transformBy, transformTo} from '../utils/frameInfo';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('scanFaces')!;

export const scanFaces = (
  frame: Frame,
  frameInfo: FrameInfo,
  orientedFrameInfo: FrameInfo,
): Face[] => {
  'worklet';

  const faces = plugin.call(frame, {
    orientation: orientedFrameInfo.exifOrientation,
  }) as any as Face[];

  if (Platform.OS === 'ios') {
    // TODO: ios는 frame이 mirrored 되어있는데 안되어있는척
    const transformation = transformTo(
      frameInfo,
      ExifOrientation.Horizontal,
    )[1];

    for (const i of faces) {
      i.bounds = applyToRect(transformation, i.bounds);
    }
  } else if (Platform.OS === 'android') {
    // 안드로이드는 좌표가 orientation 적용된 상태로 나옴. 사실 이게 더 좋은 동작임.
    // 근데 ios 코드를 반대로 짜는 수고를 피하기 위해 ios에 맞춰 다시 원래대로 돌려줘야 함.
    // TODO: 나중엔 ios에 반대 처리를 하자
    // TODO: 좀더 의미를 잘 표현하자
    const transformation = transformBy(
      orientedFrameInfo,
      compose(
        orientedFrameInfo.exifOrientation,
        inverse(frameInfo.exifOrientation),
      ),
    )[1];

    for (const i of faces) {
      i.bounds = applyToRect(transformation, i.bounds);
    }
  }

  return faces;
};

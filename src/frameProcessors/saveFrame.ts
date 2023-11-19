import {Frame, VisionCameraProxy} from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('saveFrame')!;

export const saveFrame = (
  frame: Frame,
  options: {albumName: string},
): Face[] => {
  'worklet';
  return plugin.call(frame, options) as any;
};

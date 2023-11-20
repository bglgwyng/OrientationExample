import {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useSharedValue,
} from 'react-native-reanimated';

const useOrientationEffect = (
  fn: (
    prepareResult: DeviceOrientation,
    preparePreviousResult: DeviceOrientation | null,
  ) => void,
) => {
  const gravity = useAnimatedSensor(SensorType.GRAVITY, {});
  const lastOrientation = useSharedValue<DeviceOrientation | null>(null);

  useAnimatedReaction(
    (): readonly [orientation: DeviceOrientation, isFlat: boolean] => {
      const {pitch, roll, yaw} = pitchRollYawFromGravity(gravity.sensor.value);

      const isFlat = Math.abs(yaw) >= 45;

      if (Math.abs(pitch) < 45) {
        return [roll < 0 ? 'portrait' : 'portrait-upside-down', isFlat];
      } else {
        return [pitch < 0 ? 'landscape-right' : 'landscape-left', isFlat];
      }
    },
    ([orientation, isFlat]) => {
      if (
        !lastOrientation.value ||
        (orientation !== lastOrientation.value && !isFlat)
      ) {
        fn(orientation, lastOrientation.value);
        lastOrientation.value = orientation;
      }
    },
    [gravity.sensor],
  );
};

export default useOrientationEffect;

type PitchRollYaw = {
  pitch: number;
  roll: number;
  yaw: number;
};

export const pitchRollYawFromGravity = (v: Point3D): PitchRollYaw => {
  'worklet';

  const {x, y, z} = v;

  const pitch = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
  const roll = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
  const yaw = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);

  return {pitch, roll, yaw};
};

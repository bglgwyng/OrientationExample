import Animated, {SharedValue, useAnimatedStyle} from 'react-native-reanimated';

type Props = {
  bounds: SharedValue<Face['bounds']>;
};
const BoundingBox = (props: Props) => {
  const {bounds} = props;
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return bounds.value;
  }, [bounds]);
  return (
    <Animated.View
      style={[
        {borderWidth: 2, borderColor: 'white', position: 'absolute'},
        animatedStyle,
      ]}
    />
  );
};

export default BoundingBox;

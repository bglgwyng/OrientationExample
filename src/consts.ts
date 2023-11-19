import {Dimensions, Platform} from 'react-native';
import {FormatFilter} from 'react-native-vision-camera';
import StaticSafeAreaInsets from 'react-native-static-safe-area-insets';

export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Platform.select<number>({
  android:
    Dimensions.get('screen').height - StaticSafeAreaInsets.safeAreaInsetsBottom,
  ios: Dimensions.get('window').height,
}) as number;
export const screenAspectRatio = screenHeight / screenWidth;

export const cameraFormatFilters: FormatFilter[] = [
  {videoAspectRatio: screenAspectRatio},
  {videoResolution: {width: 1920, height: 1080}},
  {photoAspectRatio: screenAspectRatio},
  {photoResolution: {width: 1920, height: 1080}},
];

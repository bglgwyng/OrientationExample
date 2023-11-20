import {ContextType} from 'react-native-worklets-core';
import {useMemo} from 'react';

const useRunInJsCallback = <C extends ContextType, T, A extends unknown[]>(
  fn: (this: C, ...args: A) => T,
  deps: unknown[],
): ((...args: A) => Promise<T>) =>
  useMemo(() => Worklets.createRunInJsFn(fn), deps);

export default useRunInJsCallback;

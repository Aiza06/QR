import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

type Props = {
  children: ReactNode;
  delay?: number;
  translateY?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Small entrance animation for dashboard sections. The animation runs once on
 * mount and is skipped by the platform's native driver on web.
 */
export default function AdminReveal({
  children,
  delay = 0,
  translateY = 14,
  style,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 440,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [translateY, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

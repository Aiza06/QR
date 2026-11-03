import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const USE_NATIVE_DRIVER = Platform.OS !== "web";

type HoverEvent = Parameters<NonNullable<PressableProps["onHoverIn"]>>[0];
type PressEvent = Parameters<NonNullable<PressableProps["onPressIn"]>>[0];

type Props = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  hoverScale?: number;
  hoverTranslateX?: number;
  hoverTranslateY?: number;
  pressScale?: number;
};

/**
 * Pressable with a short hover lift/scale animation on pointer devices.
 *
 * React Native's Pressable style callback only exposes `pressed`, so the hover
 * state is tracked locally. The transform is animated with the native driver
 * on iOS/Android and with the JS driver on web.
 */
export default function InteractivePressable({
  children,
  style,
  hoverStyle,
  pressedStyle,
  hoverScale = 1.02,
  hoverTranslateX = 0,
  hoverTranslateY = 0,
  pressScale = 0.97,
  disabled = false,
  onHoverIn,
  onHoverOut,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(
    () => () => {
      scale.stopAnimation();
      translateX.stopAnimation();
      translateY.stopAnimation();
    },
    [scale, translateX, translateY],
  );

  const animateTo = (nextScale: number, nextX: number, nextY: number) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: nextScale,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(translateX, {
        toValue: nextX,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(translateY, {
        toValue: nextY,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  const handleHoverIn = (event: HoverEvent) => {
    if (disabled) return;
    setHovered(true);
    animateTo(hoverScale, hoverTranslateX, hoverTranslateY);
    onHoverIn?.(event);
  };

  const handleHoverOut = (event: HoverEvent) => {
    setHovered(false);
    if (!pressed) animateTo(1, 0, 0);
    onHoverOut?.(event);
  };

  const handlePressIn = (event: PressEvent) => {
    setPressed(true);
    animateTo(
      pressScale,
      hovered ? hoverTranslateX : 0,
      hovered ? hoverTranslateY : 0,
    );
    onPressIn?.(event);
  };

  const handlePressOut = (event: PressEvent) => {
    setPressed(false);
    animateTo(
      hovered ? hoverScale : 1,
      hovered ? hoverTranslateX : 0,
      hovered ? hoverTranslateY : 0,
    );
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        hovered && !disabled ? hoverStyle : null,
        pressed ? pressedStyle : null,
        {
          transform: [{ translateX }, { translateY }, { scale }],
        },
        Platform.OS === "web"
          ? disabled
            ? styles.cursorDefault
            : styles.cursorPointer
          : null,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cursorPointer: {
    cursor: "pointer",
  },
  cursorDefault: {
    cursor: "auto",
  },
});

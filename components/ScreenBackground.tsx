import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  children: ReactNode;
};

export default function ScreenBackground({ children }: Props) {
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#F4FBF8", "#FCFEFD", "#EEF8F3"]}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.blobTop} />
      <View pointerEvents="none" style={styles.blobBottom} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3FAF6",
  },
  blobTop: {
    position: "absolute",
    top: -190,
    right: -180,
    width: 540,
    height: 430,
    borderRadius: 270,
    backgroundColor: "rgba(169, 232, 213, 0.2)",
    transform: [{ rotate: "12deg" }],
  },
  blobBottom: {
    position: "absolute",
    bottom: -230,
    left: -190,
    width: 580,
    height: 450,
    borderRadius: 290,
    backgroundColor: "rgba(205, 242, 231, 0.24)",
    transform: [{ rotate: "-14deg" }],
  },
});

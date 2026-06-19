import { useEffect } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

export default function WelcomeScreen() {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(10);

  useEffect(() => {
    const timing = { duration: 600, easing: Easing.out(Easing.quad) };
    logoOpacity.value = withTiming(1, timing);
    logoScale.value = withTiming(1, timing);
    textOpacity.value = withDelay(200, withTiming(1, timing));
    textTranslateY.value = withDelay(200, withTiming(0, timing));
    buttonOpacity.value = withDelay(450, withTiming(1, timing));
    buttonTranslateY.value = withDelay(450, withTiming(0, timing));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <LinearGradient colors={["#1e293b", "#0f172a", "#000000"]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 justify-between px-6 pt-6 pb-10">
        <View className="items-center">
          <Animated.View style={logoStyle}>
            <Image
              source={require("../logo.png")}
              className="w-[140px] h-[79px]"
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <View className="items-center px-2">
          <Animated.View style={textStyle}>
            <Text className="text-white text-5xl font-extrabold text-center leading-tight tracking-tight">
              Welcome to the{"\n"}
              <Text className="text-blue-500">EXPERIENCE!</Text>
            </Text>
            <Text className="text-gray-400 text-base text-center mt-5 leading-relaxed">
              Track your workouts. Crush your goals.{"\n"}Every rep counts.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={buttonStyle}>
          <Pressable
            onPress={() => router.replace("/(tabs)/home")}
            className="bg-blue-600 rounded-2xl py-5 items-center active:opacity-80"
          >
            <Text className="text-white text-xl font-bold tracking-wide">Get Started</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

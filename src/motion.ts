import {
  FadeIn,
  FadeInDown,
  FadeOut,
  Easing,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';
// A damped settle keeps row movement continuous without an elastic bounce.
export const reorderSpring = {
  damping: 54,
  stiffness: 650,
  mass: 1,
  overshootClamping: true,
  energyThreshold: 1e-4,
  reduceMotion: ReduceMotion.System,
};
export const rowRemovalTiming = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};
export const rowTransition = LinearTransition.springify()
  .damping(reorderSpring.damping)
  .stiffness(reorderSpring.stiffness)
  .mass(reorderSpring.mass)
  .energyThreshold(reorderSpring.energyThreshold)
  .reduceMotion(ReduceMotion.System);
export const appear = FadeIn.duration(150).reduceMotion(ReduceMotion.System);
export const disappear = FadeOut.duration(120).reduceMotion(
  ReduceMotion.System,
);

export const menuAppear = FadeInDown.withInitialValues({
  transform: [{ translateY: 6 }],
})
  .duration(150)
  .reduceMotion(ReduceMotion.System);

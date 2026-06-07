import { StyleSheet, View } from "react-native";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";

type ProgressStepsProps = {
  activeStep: number;
  totalSteps?: number;
};

export function ProgressSteps({ activeStep, totalSteps = 3 }: ProgressStepsProps) {
  const { colors } = useThemeContext();
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.step,
            { backgroundColor: index < activeStep ? colors.primary : colors.secondary },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginBottom: verticalScale(28),
  },
  step: {
    flex: 1,
    height: moderateScale(6),
    borderRadius: 999,
  },
});

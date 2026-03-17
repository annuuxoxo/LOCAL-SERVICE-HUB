import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const C = Colors.light;
  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        const name = filled ? "star" : half ? "star-half" : "star-outline";
        if (interactive) {
          return (
            <Pressable key={i} onPress={() => onRate?.(i + 1)}>
              <Ionicons name={name} size={size} color={C.rating} />
            </Pressable>
          );
        }
        return <Ionicons key={i} name={name} size={size} color={C.rating} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2 },
});

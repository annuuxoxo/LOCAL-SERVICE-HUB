import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MapView = ({ children, style, ...props }) =>
  React.createElement(
    View,
    { style: [styles.map, style] },
    React.createElement(View, { style: styles.placeholder },
      React.createElement(Text, { style: styles.text }, "Map (Mobile Only)")
    ),
    children
  );

const Marker = ({ children }) => null;
const Callout = ({ children }) => null;
const Circle = () => null;
const Polygon = () => null;
const Polyline = () => null;
const Overlay = () => null;

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
});

export default MapView;
export { Marker, Callout, Circle, Polygon, Polyline, Overlay };

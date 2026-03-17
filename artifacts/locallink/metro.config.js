const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    "react-native-maps": path.resolve(__dirname, "shims/react-native-maps.web.js"),
  },
  resolveRequest: (context, moduleName, platform) => {
    if (platform === "web" && moduleName === "react-native-maps") {
      return {
        filePath: path.resolve(__dirname, "shims/react-native-maps.web.js"),
        type: "sourceFile",
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;

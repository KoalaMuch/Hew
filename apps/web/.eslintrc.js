module.exports = {
  extends: "next/core-web-vitals",
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  rules: {
    "react-hooks/exhaustive-deps": "error",
  },
};

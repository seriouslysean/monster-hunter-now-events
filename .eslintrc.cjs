module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.c?js"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  rules: {
    // Extensions for known files are always required when using type="module"
    "import/extensions": ["error", "ignorePackages", { js: "always" }],
  },
};

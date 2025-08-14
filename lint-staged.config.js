export default {
  '*.{js,ts,sol,json,md}': ['prettier --write'],
  'contracts/**/*.sol': ['solhint --max-warnings 0'],
  'src/**/*.{js,ts}': ['eslint --fix'],
};

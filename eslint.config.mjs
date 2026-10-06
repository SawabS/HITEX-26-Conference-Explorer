import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: ["preview/dist/**", ".next/**", "out/**", "node_modules/**"] },
];
export default config;

// Billing-only plugin: the ordinary OpenAI relay owns transport and token
// usage, while this policy makes fixed request rules price each image.
export const meta = {
  apiVersion: 1,
  key: "sunburst",
  name: "Sunburst",
  icon: "OpenAI.Color",
  description: {
    en: "Sunburst image billing customization",
    zh: "Sunburst 图片计费定制",
  },
  version: "1.0.0",
  author: { name: "QuantumNous" },
  models: ["gpt-image-2.5-sunburst", "gpt-image-2.5-flare", "gpt-image-2.5"],
  fetchMode: "per_task",
  billing: { requestRules: { fixedPriceUnit: "image" } },
};

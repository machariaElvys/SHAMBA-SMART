// src/data/cropDictionary.js
export const CROP_DICTIONARY = [
  {
    key: "maize",
    name: "Maize",
    scientificName: "Zea mays",
    aliases: ["corn"],
    overview:
      "Maize is a warm-season cereal crop. It performs best with steady moisture during early growth and flowering.",
    idealMoisture: { min: 55, max: 70, note: "Avoid prolonged dryness during tasseling/silking." },
    idealTemp: { min: 22, max: 32, note: "Heat stress may occur above ~35°C." },
    wateringTips: [
      "Water deeply but not too frequently; keep soil consistently moist.",
      "Most sensitive stages: flowering and grain filling.",
      "Mulching helps reduce evaporation in hot periods.",
    ],
    growthNotes: [
      "Prefers well-drained loam soils.",
      "Requires full sun (6–8+ hours).",
      "Watch for nutrient needs, especially nitrogen.",
    ],
    commonIssues: ["Fall armyworm", "Stemborers", "Nitrogen deficiency", "Drought stress"],
  },
  {
    key: "beans",
    name: "Beans",
    scientificName: "Phaseolus vulgaris",
    aliases: ["common bean"],
    overview:
      "Beans prefer moderate conditions and well-drained soils. Overwatering can increase disease risk.",
    idealMoisture: { min: 50, max: 65, note: "Too much moisture can encourage fungal issues." },
    idealTemp: { min: 18, max: 28, note: "Flower drop can happen with extreme heat." },
    wateringTips: [
      "Keep soil evenly moist, especially during flowering.",
      "Avoid waterlogging; improve drainage if needed.",
      "Water early morning to reduce disease risk.",
    ],
    growthNotes: [
      "Moderate nitrogen needs (beans fix nitrogen but still need good soil).",
      "Rotate crops to reduce pest/disease pressure.",
    ],
    commonIssues: ["Aphids", "Bean rust", "Root rot", "Flower drop (heat stress)"],
  },
  {
    key: "tomato",
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    aliases: ["nyanya"],
    overview:
      "Tomatoes need consistent moisture. Irregular watering often causes fruit problems and reduced yield.",
    idealMoisture: { min: 55, max: 72, note: "Consistency matters more than high moisture." },
    idealTemp: { min: 20, max: 30, note: "Above ~32°C can reduce fruit set." },
    wateringTips: [
      "Water consistently to prevent blossom end rot and cracking.",
      "Avoid wetting leaves often; water at the base.",
      "Mulch helps maintain stable moisture.",
    ],
    growthNotes: [
      "Stake or support plants for good airflow and cleaner fruit.",
      "Fertility matters—balanced feeding improves fruiting.",
    ],
    commonIssues: ["Blight", "Blossom end rot", "Whiteflies", "Fruit cracking"],
  },
  {
    key: "sukuma",
    name: "Sukuma Wiki",
    scientificName: "Brassica oleracea (kale group)",
    aliases: ["kale"],
    overview:
      "Sukuma grows well with steady moisture and cool-to-moderate temperatures. Harvest is often continuous.",
    idealMoisture: { min: 50, max: 70, note: "Keep soil moist for tender leaves." },
    idealTemp: { min: 16, max: 28, note: "Heat can cause bitterness and pest pressure." },
    wateringTips: [
      "Water regularly for continuous leaf production.",
      "Reduce stress to avoid tough or bitter leaves.",
    ],
    growthNotes: [
      "Harvest outer leaves first for continuous growth.",
      "Good soil fertility improves leaf size and color.",
    ],
    commonIssues: ["Cabbage aphids", "Cutworms", "Leaf miners", "Heat stress"],
  },
];

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { collectionProducts } from "../src/data/collections";

const outputPath = resolve(
  import.meta.dirname,
  "../../backend/src/data/catalog-products.json",
);

writeFileSync(outputPath, JSON.stringify(collectionProducts, null, 2));
console.log(`Exported ${collectionProducts.length} products to ${outputPath}`);

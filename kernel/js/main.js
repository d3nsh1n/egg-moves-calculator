import fs from "fs-extra";
import { DataLib } from "./tools/dataLib.js";
import "./tools/dataLoader.js";
import { DataLoader } from "./tools/dataLoader.js";
const filePath = "data/species/092_gastly.json";
export async function main() {
  new DataLib();
  new DataLoader();
  return;
}
export function writeToTest(data) {
  fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}
main();
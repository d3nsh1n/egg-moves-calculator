import fs from "fs-extra";
import { DataLib } from "./tools/dataLib.js";
import "./tools/dataLoader.js";
import { DataLoader } from "./tools/dataLoader.js";
import chalk from "chalk";
import { getMinimumParents, suggestMoves } from "./breed_calculator.js";
const filePath = "data/species/092_gastly.json";
export async function main() {
  new DataLib();
  new DataLoader(true);
  const moves = await suggestMoves("Mimikyu");
  writeToTest(moves);
  console.log(DataLib.INHERITABLE_MOVES["Mimikyu-disguised"]);
  const min = getMinimumParents(moves);
  console.log(chalk.blue("Min parents:"));
  console.log(min);
}
export function writeToTest(data) {
  fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}
main();
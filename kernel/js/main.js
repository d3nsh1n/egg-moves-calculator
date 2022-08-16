import fs from "fs-extra";
import "./tools/dataLoader.js";
import { DataLoader } from "./tools/dataLoader.js";
import chalk from "chalk";
import { getBreedingPaths, getMinimumParents, suggestMoves } from "./breed_calculator.js";
const filePath = "data/species/092_gastly.json";
export async function main() {
  new DataLoader();
  const m = ["A", "B", "C", "D"];
  const sortedParentsInfo = [{
    parent: "par1",
    amount: 3,
    inMoves: ["A", "B", "C"],
    notInMoves: ["D"]
  }, {
    parent: "par2",
    amount: 3,
    inMoves: ["A", "D", "C"],
    notInMoves: ["B"]
  }, {
    parent: "par3",
    amount: 1,
    inMoves: ["D"],
    notInMoves: ["A", "B", "C"]
  }];
  const paths = getBreedingPaths(sortedParentsInfo);
  console.log(chalk.bgRed("RESULT"));
  console.log(paths);
  return;
  const moves = await suggestMoves("Cofagrigus");
  writeToTest(moves);
  const min = getMinimumParents(moves);
  console.log(chalk.blue("Min parents:"));
  console.log(min);
}
export function writeToTest(data) {
  fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}
main();
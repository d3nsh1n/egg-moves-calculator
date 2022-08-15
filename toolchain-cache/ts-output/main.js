import fs from "fs-extra";
import { DataLib } from "./tools/dataLib";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import { getMinimumParents, suggestMoves } from "./breed_calculator";
const filePath = "data/species/092_gastly.json";
export async function main() {
    new DataLoader();
    console.log(DataLib.getDefaultForm("Mimikyu").name);
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
//# sourceMappingURL=main.js.map
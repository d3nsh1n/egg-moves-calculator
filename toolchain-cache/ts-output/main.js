import fs from "fs-extra";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import { getMinimumParents, suggestMoves } from "./breed_calculator";
const filePath = "data/species/092_gastly.json";
export async function main() {
    new DataLoader();
    const moves = await suggestMoves("Ferrothorn", 4);
    console.log(moves);
    const paths = getMinimumParents(moves, true);
    console.log(chalk.bgRed.black("FINAL RESULT"));
    writeToTest(paths);
}
export function writeToTest(data) {
    fs.writeFileSync("data/out/test.json", JSON.stringify(data, null, 4));
}
main();
//# sourceMappingURL=main.js.map
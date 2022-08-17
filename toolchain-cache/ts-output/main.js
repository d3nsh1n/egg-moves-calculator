import fs from "fs-extra";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";
import { getMinimumParents, suggestMoves } from "./breed_calculator";
import { getBasic, getSpeciesForm } from "./lib/utils";
const filePath = "data/species/092_gastly.json";
export async function main() {
    const [species, form] = getSpeciesForm("Gengar-");
    new DataLoader();
    console.log(getBasic("Gengar"));
    console.log(getBasic("Gastly"));
    console.log(getBasic("Ninetales-alolan"));
    console.log(getBasic("Vulpix-alolan"));
    console.log(getBasic("Aegislash"));
    console.log(getBasic("Honedge"));
    const suggested = await suggestMoves("Gengar");
    writeToTest(suggested);
    return;
    const moves = await suggestMoves("Cofagrigus");
    writeToTest(moves);
    const min = getMinimumParents(moves);
    console.log(chalk.blue("Min parents:"));
    console.log(min);
}
export function writeToTest(data) {
    fs.writeFileSync("data/out/test.json", JSON.stringify(data, null, 4));
}
main();
//# sourceMappingURL=main.js.map
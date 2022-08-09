import fs from "fs-extra";
import { DataLib } from "./tools/dataLib";
import "./tools/dataLoader";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    new DataLib();
    new DataLoader();
    return;
    // const libToTest = DataLib.INHERITABLE_MOVES;
    // console.log(Object.keys(libToTest).length);
    // writeToTest(libToTest);

    // console.log(Object.keys(DataLib.EGG_MOVES_LIB_2).length);
}

export function writeToTest(data: any) {
    fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}

main();

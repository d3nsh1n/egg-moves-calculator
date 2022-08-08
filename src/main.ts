import fs from "fs-extra";
import path from "path";
import { isPokemonData, PokemonData } from "./lib/pokemonlib";
import "./tools/dataLib";
import { DataLib } from "./tools/dataLib";

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    const libToTest = DataLib.INHERITABLE_MOVES;
    console.log(Object.keys(libToTest).length);
    writeToTest(libToTest);

    // console.log(Object.keys(DataLib.EGG_MOVES_LIB_2).length);
}

//#region helpers

export function writeToTest(data: any) {
    fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}

//#endregion

main();

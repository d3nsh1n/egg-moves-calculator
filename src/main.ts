import fs from "fs-extra";
import path from "path";
import { isPokemonData, PokemonData } from "./lib/datalib";
import "./tools/data_library";
import { DataLib, writeToTest } from "./tools/data_library";

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/092_gastly.json";

export async function main() {
    const libToTest = DataLib.INHERITABLE_MOVES;
    console.log(Object.keys(libToTest).length);
    writeToTest(libToTest);

    // console.log(Object.keys(DataLib.EGG_MOVES_LIB_2).length);
}

main();

import fs from "fs-extra";
import path from "path";
import { isPokemonJSON, PokemonJSON } from "./lib";

// const filePath = "data/species/092_gastly.json";
const filePath = "data/species/037_vulpix.json";

export async function main() {
    const pokemonJSON: PokemonJSON = JSON.parse(
        await fs.readFile(filePath, {
            encoding: "utf-8",
        })
    );
    // if (!isPokemonJSON(pokemonJSON))        throw console.error("Incorrect file format!");
    const eggMoves = getEggMoves(pokemonJSON);
    console.log(">>> Egg Moves:", eggMoves);
}

export function getEggMoves(json: PokemonJSON): { [form: string]: string[] } {
    const eggMoves: { [form: string]: string[] } = {};
    for (const form of json.forms) {
        eggMoves[form.name || "normal"] = form.moves.eggMoves;
    }
    return eggMoves;
}

main();

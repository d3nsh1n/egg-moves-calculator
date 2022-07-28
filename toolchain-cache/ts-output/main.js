import fs from "fs-extra";
const filePath = "data/species/037_vulpix.json";
export async function main() {
    const pokemonJSON = JSON.parse(await fs.readFile(filePath, {
        encoding: "utf-8",
    }));
    const eggMoves = getEggMoves(pokemonJSON);
    console.log(">>> Egg Moves:", eggMoves);
}
export function getEggMoves(json) {
    const eggMoves = {};
    for (const form of json.forms) {
        eggMoves[form.name || "normal"] = form.moves.eggMoves;
    }
    return eggMoves;
}
main();
//# sourceMappingURL=main.js.map
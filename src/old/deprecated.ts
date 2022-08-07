// export function getSpeciesMoves(pokemonData: PokemonData, key: MoveKeys): SpeciesMoves {
//     const moves: SpeciesMoves = {};
//     for (const form of pokemonData.forms) {
//         const formMoves = form.moves?.[key];
//         if (!is.array<string>(formMoves)) {
//             console.log(chalk.yellow(form.name, "Moves are not a list of strings!"));
//             continue;
//         }
//         moves[form.name || "normal"] = formMoves;
//     }
//     return moves;
// }

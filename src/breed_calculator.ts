import { SuggestedMove } from "./lib/lib";
import { MoveUsage, toPixelmonMove, toPixelmonName } from "./lib/smogonlib";
import { getMoveUsage } from "./smogon_stats";
import { DataLib } from "./tools/dataLib";
import { DataLoader } from "./tools/dataLoader";
import chalk from "chalk";

export async function suggestMoves(fullName: string) {
    let movesFound = 0;
    const suggestedMoves: SuggestedMove[] = [];

    const moveUsage: MoveUsage = toPixelmonMove(await getMoveUsage(fullName)) as MoveUsage;
    console.log(chalk.blue("USAGE:"));
    console.log(moveUsage);
    const eggMoves = DataLoader.getFormMoves(DataLib.FORMS[fullName], "eggMoves") as string[];
    console.log(chalk.blue("MOVES:"));
    console.log(eggMoves);

    //* Grab Egg Moves first
    for (const usedMove in moveUsage) {
        if (eggMoves?.includes(usedMove)) {
            suggestedMoves.push({ move: usedMove, usage: moveUsage[usedMove], method: "EGG", parents: DataLib.INHERITABLE_MOVES[fullName][usedMove].parents });
            delete moveUsage[usedMove];
            movesFound++;
            if (movesFound === 4) return suggestedMoves;
        }
    }

    //* Fill rest
    for (const usedMove in moveUsage) {
        suggestedMoves.push({ move: usedMove, usage: moveUsage[usedMove], method: "TUTOR?TODO", parents: DataLib.INHERITABLE_MOVES[fullName][usedMove].parents });
        movesFound++;
        if (movesFound === 4) return suggestedMoves;
    }

    return suggestedMoves;
}

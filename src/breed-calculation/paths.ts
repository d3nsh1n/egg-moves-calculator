import { performance } from "perf_hooks";
import { BreedingPath, ParentInfo, SuggestedMove } from "../lib/lib";
import chalk from "chalk";
import { arrayEquals, deepCopy } from "../lib/utils";
import { Logger } from "../lib/logger";
import { isSameEvoLine } from "../pixelmon-data-manager/pixelmonutils";
import { DataManager } from "../pixelmon-data-manager/_data_manager";

const { log, warn, error } = new Logger(true, "PathGenerator", "#234807");

export function toParentInfo(suggestedMoves: SuggestedMove[]): ParentInfo[] {
    const parentsInfo: ParentInfo[] = [];
    const parentsChecked: string[] = [];

    //* For each suggested move
    for (const suggestedMove of suggestedMoves) {
        // Parents wont exist for (self) tutor moves
        if (!suggestedMove.parents) continue;

        //* Iterate not already checked parents
        for (const parent in suggestedMove.parents) {
            if (parentsChecked.includes(parent)) continue;

            const inMoves: string[] = [];
            const notInMoves: string[] = [];
            //* Iterate through each move, and count how many of them include the parent as a source
            for (const move of suggestedMoves) {
                // Parents wont exist for (self) tutor moves
                if (!move.parents) continue;

                if (Object.keys(move.parents).includes(parent)) {
                    inMoves.push(move.move);
                } else {
                    notInMoves.push(move.move);
                }
            }
            //* Mark as checked
            parentsChecked.push(parent);

            //* Store info
            parentsInfo.push({ parent, amount: inMoves.length, inMoves, notInMoves });
        }
    }
    parentsInfo.sort(_sortParentInfo);
    return parentsInfo;
}
function _sortParentInfo(a: ParentInfo, b: ParentInfo) {
    if (a.amount < b.amount) return 1;
    if (a.amount > b.amount) return -1;
    return 0;
}

export function getBreedingPaths(sortedParentsInfo: ParentInfo[]): BreedingPath[] {
    const startTime = performance.now();

    const final = [...getParentPaths(sortedParentsInfo)];
    const minLength = Math.min(...final.map((e) => e.length));

    log(chalk.bgMagenta(`getBreedingPaths took ${(performance.now() - startTime).toFixed(0)} ms.`));
    return final.filter((e) => e.length === minLength);
}

function getParentPaths(parentsToCheck: ParentInfo[], moves?: string[], currentPath?: BreedingPath): BreedingPath[] {
    if (parentsToCheck.length === 0) {
        return [];
    }

    // Create moves and path if not provided
    moves ||= [...parentsToCheck[0].inMoves, ...parentsToCheck[0].notInMoves];
    currentPath ||= { length: 0, parents: [] };

    // Result
    const parentPaths: BreedingPath[] = [];

    let index = 0;
    for (const initialParent of parentsToCheck) {
        index++;
        const remainingMoves = moves.filter((move) => initialParent.notInMoves.includes(move));

        const parentMakesProgress = remainingMoves.length < moves.length;
        if (!parentMakesProgress) {
            continue;
        }

        const branch = deepCopy(currentPath);
        addParentToPath(branch, initialParent);

        //* If path is complete push it, otherwise call recursively for the array tail
        if (remainingMoves.length === 0) {
            parentPaths.push(branch);
        } else {
            parentPaths.push(...getParentPaths(parentsToCheck.slice(index), remainingMoves, branch));
        }
    }

    return parentPaths;
}

function addParentToPath(path: BreedingPath, parent: ParentInfo) {
    path.length++;
    path.parents.push(parent.parent);
}

export function compressPaths(paths: BreedingPath[]) {
    log("Compressing - WIP");
    for (const path of paths) {
        for (const parentName of path.parents) {
            if (typeof parentName !== "string") continue;
            const parent = DataManager.PokemonRegistry.get(parentName);
            for (const otherPath of [...paths.slice(paths.indexOf(path) + 1)]) {
                // if (arrayEquals(path.parents.slice(path.parents.indexOf(parent), 1), otherPath.parents.slice(path.parents.indexOf(parent), 1)))
                for (const otherParentName of otherPath.parents) {
                    if (typeof otherParentName !== "string" || otherParentName === parentName) continue;
                    const otherParent = DataManager.PokemonRegistry.get(otherParentName);

                    if (isSameEvoLine(otherParent, parent) && arrayEquals(path.parents.slice(path.parents.indexOf(parentName), 1), otherPath.parents.slice(otherPath.parents.indexOf(otherParentName), 1))) {
                        // console.log([[parentName, otherParentName], ...path.parents.slice(path.parents.indexOf(parentName), 1)]);
                    }
                }
            }
        }
    }
}

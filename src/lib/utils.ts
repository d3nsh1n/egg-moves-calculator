import { EggGroupsLib, INHERITABLE_KEYS, MoveLearnData, MoveParents } from "./lib";
import { EggGroups, FormData, LevelUpMoveData, MoveKeys, PokemonData } from "../pixelmon-data-manager/pixelmonlib";
import chalk from "chalk";
import is from "@sindresorhus/is";
import { SetRequired } from "type-fest";
import { error, unboundLog } from "./logger";
import { Pokemon } from "./pokemon";

const __CONTEXT__ = "";
const LOG = false;
const log = (...data: any) => unboundLog(LOG, __CONTEXT__, "#995599", ...data);

export function EmptyObject<T>(): T {
    return {} as T;
}

export function arrayEquals<T>(arr1: T[], arr2: T[], orderMatters = false): boolean {
    //todo implement order matters?
    if (arr1.length !== arr2.length) return false;

    // Same length arrays, doesn't matter which you iterate and compare to the other, you just need 1 mismatch to ensure not same
    // (since subset is already handled)
    for (const element of arr1) {
        if (!arr2.includes(element)) return false;
    }
    return true;
}
export function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

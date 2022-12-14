import { Pokemon } from "src/pokemon";
import { EggGroups, FormData, LevelUpMoveData, MoveKeys, PokemonData } from "./Pixelmon Data Manager/pixelmonlib";

export const MOVE_KEYS: MoveKeys[] = ["levelUpMoves", "tutorMoves", "eggMoves", "tmMoves8", "trMoves", "hmMoves", "transferMoves"]; //, "tmMoves7", "tmMoves6", "tmMoves5", "tmMoves4", "tmMoves3", "tmMoves2", "tmMoves1", "tmMoves"];
export const INHERITABLE_KEYS: MoveKeys[] = ["tutorMoves", "eggMoves", "transferMoves", "levelUpMoves"];

//! # === GENERIC === #
export type MoveLearnData = {
    name: string;
    method: MoveKeys;
    level?: number;
};

export type LearnMethodInfo = {
    learnMethods: MoveKeys[];

    //? If egg move
    parents?: string[];

    //? If levelup move
    level?: number;
};

export type MoveParents = {
    [parent: string]: LearnMethodInfo;
};

//! # === MOVE SUGGESTIONS === #
export type SuggestedMove = {
    move: string;
    usage: number;
    //? Note: Can't use LearnMethodInfo type here, because `parents` properties are different (string[] and MoveParents)
    learnMethods: MoveKeys[];
    parents?: MoveParents;
    level?: number;
};

export type ParentInfo = {
    parent: string;
    amount: number;
    inMoves: string[];
    notInMoves: string[];
};

export type BreedingPath = {
    length: number;
    parents: (string | string[])[];
    // parentInfo: {
    //     [parent: string]: ParentInfo;
    // };
};

//! # === LIBRARIES === #
export type LearnableMovesLib = {
    [pokemon: string]: {
        [move: string]: LearnMethodInfo;
    };
};

export type EggGroupsLib = {
    [group in EggGroups]?: string[];
};

export type PokemonLib = {
    [pokemon: string]: Pokemon;
};

export type EvoLinesLib = {
    [base: string]: string[];
};

export type FormIndexLib = {
    [species: string]: string[];
};

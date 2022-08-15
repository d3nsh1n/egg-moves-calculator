import { EggGroups, FormData, LevelUpMoveData, MoveKeys, PokemonData } from "./pokemonlib";

export const MOVE_KEYS: MoveKeys[] = ["levelUpMoves", "tutorMoves", "eggMoves", "tmMoves8", "trMoves", "hmMoves", "transferMoves", "tmMoves7"]; //, "tmMoves6", "tmMoves5", "tmMoves4", "tmMoves3", "tmMoves2", "tmMoves1", "tmMoves"];
export const INHERITABLE_KEYS: MoveKeys[] = ["tutorMoves", "eggMoves", "transferMoves", "levelUpMoves"];

//! # === GENERIC === #
export type LearnMethodInfo = {
    learnMethods: MoveKeys[];

    //? If egg move
    parents?: MoveParents;

    //? If levelup move
    level?: number;
};

export type MoveParents = {
    [parent: string]: LearnMethodInfo;
};

//! # === LIBRARIES === #

//! INHERITABLE_MOVES
export type InheritableMoves = {
    [pokemon: string]: {
        [move: string]: LearnMethodInfo;
    };
};

//! MOVE_SOURCES
export type MoveSources = {
    [move: string]: {
        [pokemon: string]: LearnMethodInfo;
    };
};

export type EggGroupsLib = {
    [group in EggGroups]?: string[];
};

export type Forms = {
    [pokemon: string]: FormData;
};

export type AllPokemonData = {
    [pokemon: string]: PokemonData;
};

//! # === MOVE SUGGESTIONS === #
export type SuggestedMove = {
    move: string;
    usage: number;
    learnMethods: string[];
    parents?: MoveParents;
};

export type ParentInfo = {
    parent: string;
    amount: number;
    inMoves: string[];
    notInMoves: string[];
};

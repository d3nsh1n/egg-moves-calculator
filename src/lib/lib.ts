import { EggGroups, LevelUpMoveData } from "./datalib";

// export type PokemonMovesList = {
//     [pokemon: string]: string[] | LevelUpMovesData;
// };

// export type SpeciesMoves = {
//     [form: string]: string[] | LevelUpMovesData;
// };

// export enum Inheritance {
//     EggMove = "EGG_MOVE",
//     Tutor = "TUTOR",
//     TranferTutor = "TRANSFER_TUTOR",
//     LevelUp = "LEVELUP",
// }

// export type BeneficiaryMoveData = {
//     learnBy: string[];
// };

// export type Inheritors = {
//     [pokemon: string]: InheritorMoves;
// };

// export type InheritorMoves = {
//     [move: string]: InheritorMoveData;
// };

// export type InheritorMoveData = {
//     inheritanceType: string;
//     beneficiaries: MoveLearnableBy;
// };

//! Libraries
export type InheritableMoves = {
    [pokemon: string]: {
        [move: string]: {
            parents: [string, string[]][];
            //todo improve
        };
    };
};

export type LearnableMoves = {
    [move: string]: {
        [pokemon: string]: string[];
    };
};

export type EggGroupsLib = {
    [group in EggGroups]?: string[];
};

export type LevelUpMoves = {
    [pokemon: string]: LevelUpMoveData[];
};

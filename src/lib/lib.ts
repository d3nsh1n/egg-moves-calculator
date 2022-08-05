import { EggGroups, LevelUpMovesData } from "./datalib";

export type MovesLib = {
    [pokemon: string]: SpeciesMoves;
};

export type EggGroupsLib = {
    [group in EggGroups]?: string[];
};

export type SpeciesMoves = {
    [form: string]: string[] | LevelUpMovesData;
};

export enum Inheritance {
    EggMove = "EGG_MOVE",
    Tutor = "TUTOR",
    TranferTutor = "TRANSFER_TUTOR",
    LevelUp = "LEVELUP",
}

export type Beneficiaries = {
    [pokemon: string]: BeneficiaryMoves;
};

export type BeneficiaryMoves = {
    [move: string]: BeneficiaryMoveData;
};

export type BeneficiaryMoveData = {
    learnBy: string[];
};

export type Inheritors = {
    [pokemon: string]: InheritorMoves;
};

export type InheritorMoves = {
    [move: string]: InheritorMoveData;
};

export type InheritorMoveData = {
    inheritanceType: string;
    beneficiaries: BeneficiaryMoves;
};

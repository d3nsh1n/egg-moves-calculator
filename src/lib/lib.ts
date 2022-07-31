export type SpeciesMoves = {
    [pokemon: string]: FormMoves;
};

export type FormMoves = {
    [form: string]: string[];
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

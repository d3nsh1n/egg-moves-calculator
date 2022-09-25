export type UsageStats = {
    tier: string;
    pokemon: string;
    rank: string;
    usage: string;
    raw: string;
    abilities: {
        [ability: string]: string;
    };
    items: {
        [item: string]: string;
    };
    spreads: {
        [nature: string]: {
            [spread: string]: string;
        };
    };
    moves: UsageMoves;
    teammates: {
        [teammate: string]: string;
    };
    checks: {
        [check: string]: {
            ko: string;
            switched: string;
        };
    };
};

export type UsageMoves = {
    [move: string]: string;
};

export type MoveUsage = {
    [move: string]: number;
};

import { LearnMethodInfo } from "../lib/lib";

type Pokemon = string;
type Move = string;

export class MoveRegistry {
    private Pokemon: Map<Pokemon, Set<Move>> = new Map();
    private Moves: Map<Move, Set<Pokemon>> = new Map();
    private LearnInfo: Map<[Pokemon, Move], LearnMethodInfo> = new Map();

    // public addPokemonMoves(pokemon: Pokemon, newMoves: Move[]) {
    //     const uniqueMoves = new Set(newMoves);

    //     const pokemonMoves = MoveRegistry.Pokemon.getOrCreate(pokemon, new Set());

    //     for (const newMove of uniqueMoves) {
    //         pokemonMoves.add(newMove);
    //         this.addMoveSources(newMove, [pokemon]);
    //     }
    // }

    // public addMoveSources(move: Move, pokemon: Pokemon[]) {
    //     const uniquePokemon = new Set(pokemon);

    //     const moveSources = MoveRegistry.Moves.getOrCreate(move, new Set());

    //     for (const pokemon of uniquePokemon) {
    //         moveSources.add(pokemon);
    //         this.addPokemonMoves(pokemon, [move]);
    //     }
    // }

    public addMove(pokemon: Pokemon, move: Move, learnInfo: LearnMethodInfo) {
        // Register Move and Pokemon
        const existingPokemonData = this.Pokemon.getOrCreate(pokemon, new Set([]));
        const existingMoveData = this.Moves.getOrCreate(move, new Set([]));
        existingPokemonData.add(move);
        existingMoveData.add(pokemon);

        // Store Info
        const existingInfo = this.LearnInfo.get([pokemon, move]);
        if (existingInfo !== undefined) {
            // Move is learned via more than one means, append new data
            existingInfo.learnMethods.push(...learnInfo.learnMethods);
            existingInfo.level = learnInfo.level;
        } else {
            // First encounter of move
            this.LearnInfo.set([pokemon, move], learnInfo);
        }
    }

    public getPokemonMoves(pokemon: Pokemon): Map<string, LearnMethodInfo> | undefined {
        const out = new Map();
        const moves = this.Pokemon.get(pokemon);
        if (moves === undefined) return undefined;

        for (const move of moves) {
            const inf = this.LearnInfo.get([pokemon, move]);
            out.set(move, inf);
        }
        return out;
    }

    public getMoveSources(move: Move): Map<string, LearnMethodInfo> {
        const out = new Map();
        const pokemon = this.Moves.get(move);
        if (pokemon === undefined) return out;

        for (const poke of pokemon) {
            const inf = this.LearnInfo.get([poke, move]);
            out.set(poke, inf);
        }
        return out;
    }
}

import is from "@sindresorhus/is";
import { EggGroups } from "./pixelmonlib";
import { PokemonRegistry } from "./_pokemon_registry";
import { Logger } from "../lib/logger";

const { log, warn, error } = new Logger(true, "PokemonRegistry", "#232687");

export class EggGroupRegistry {
    private groupMap: Map<EggGroups, string[]> = new Map();

    constructor(pokemonRegistry: PokemonRegistry) {
        for (const [pokemonName, pokemon] of pokemonRegistry.all()) {
            // Forms don't have different egg groups, but we need to store them for each form
            if (is.undefined(pokemon.eggGroups)) continue;

            for (const group of pokemon.eggGroups) {
                const groupMembers = this.groupMap.getOrCreate(group, []);
                if (groupMembers.includes(pokemonName)) continue;
                groupMembers.push(pokemonName);
            }
        }
    }

    public all() {
        return this.groupMap;
    }

    // public get(group: EggGroups) {
    //     return this.reg.get(group) || [];
    // }

    public get(...groups: EggGroups[]): string[] {
        const out: string[] = [];
        for (const group of groups) {
            if (!Object.values(EggGroups).includes(group)) {
                error(`Incorrect Egg Group provided: ${group}.`);
                continue;
            }
            out.push(...(this.groupMap.get(group) || []));
        }
        return [...new Set(out)];
    }
}

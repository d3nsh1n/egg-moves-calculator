import is from "@sindresorhus/is";
import { Logger } from "../lib/logger";
import { Pokemon } from "../lib/pokemon";
import { EggGroups } from "./pixelmonlib";

const { log, warn, error } = new Logger(true, "PokemonRegistry", "#642687");

export class PokemonRegistry {
    private pokemonMap: Map<string, Pokemon> = new Map();
    public Forms: Map<string, string[]> = new Map();
    public EvoLines: Map<string, string[]> = new Map();

    constructor(pokemonList: Pokemon[]) {
        for (const pokemon of pokemonList) {
            const pokemonName = pokemon.toString();
            this.pokemonMap.set(pokemonName, pokemon);

            // Register form in the index
            const forms = this.Forms.getOrCreate(pokemon.name, []);
            forms.push(pokemon.form);
        }
    }

    public generateEvoLines() {
        //? Not done in constructor cause isBasic() requires a filled DataManager.PokemonRegistry; Fix too messy?
        // Establish evo lines
        for (const [pokemonName, pokemon] of this.pokemonMap) {
            if (pokemon.isBasic()) {
                this.EvoLines.set(pokemonName, []);
            }
        }

        // Populate evo lines
        for (const [pokemonName, pokemon] of this.pokemonMap) {
            const basic = pokemon.getBasic(this);
            const lineMembers = this.EvoLines.get(basic.toString());
            if (is.undefined(lineMembers)) {
                log(error(`No evo line ${basic} exists for ${pokemonName}.`));
                continue;
            }
            lineMembers.push(pokemonName);
            const x = this.get("asd", true);
        }
    }

    // * ==============
    public all() {
        return this.pokemonMap;
    }

    public get(pokemonName: string, allowUndefined: true): Pokemon | undefined;
    public get(pokemonName: string): Pokemon;
    public get(pokemonName: string, allowUndefined?: true): Pokemon | undefined {
        const pokemon = this.pokemonMap.get(pokemonName);
        if (pokemon === undefined && !allowUndefined) {
            error(`No data found for ${pokemonName}`);
            return undefined;
        }
        return pokemon;
    }
}

import "./tools/data_library";
import { DataLib, writeToTest } from "./tools/data_library";
const filePath = "data/species/092_gastly.json";
export async function main() {
    const libToTest = DataLib.INHERITABLE_MOVES;
    console.log(Object.keys(libToTest).length);
    writeToTest(libToTest);
}
main();
//# sourceMappingURL=main.js.map
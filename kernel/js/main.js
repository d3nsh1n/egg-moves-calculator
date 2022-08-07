import "./tools/data_library.js";
import { DataLib, writeToTest } from "./tools/data_library.js";
const filePath = "data/species/092_gastly.json";
export async function main() {
  const libToTest = DataLib.INHERITABLE_MOVES;
  console.log(Object.keys(libToTest).length);
  writeToTest(libToTest);
}
main();
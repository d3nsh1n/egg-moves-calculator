import fs from "fs-extra";
import "./tools/dataLib.js";
import { DataLib } from "./tools/dataLib.js";
const filePath = "data/species/092_gastly.json";
export async function main() {
  const libToTest = DataLib.INHERITABLE_MOVES;
  console.log(Object.keys(libToTest).length);
  writeToTest(libToTest);
}
export function writeToTest(data) {
  fs.writeFileSync("data/test.json", JSON.stringify(data, null, 4));
}
main();
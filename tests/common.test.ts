import { readFileSync } from "fs";

import { parseJSON, parseXML } from "../src/common/parser";
import { buildJSON, buildXML } from "../src/common/builder";

describe("Parse Testing", () => {
    const answer = { key: "value" }
    it("JSON", () => {
        const jsonfile = './tests/sample/json-file-utf8.json'
        const content = parseJSON(jsonfile)
        expect(content).toEqual(answer);
    });
    it("XML", () => {
        const xmlfile = './tests/sample/xml-file.xml'
        const content = parseXML(xmlfile)
        expect(content).toEqual(answer);
    });
});


describe("Build Testing", () => {
    const content = { key: "value" }
    it("JSON", () => {
        const file = './.temp/temp.json'
        const answer = readFileSync('./tests/sample/build.json', { encoding: "utf-8" })
        buildJSON(file, content)
        const result = readFileSync(file, { encoding: "utf-8" })
        expect(result).toEqual(answer);
    });
    it("XML", () => {
        const file = './.temp/temp.xml'
        const answer = readFileSync('./tests/sample/build.xml', { encoding: "utf-8" })
        buildXML(file, content)
        const result = readFileSync(file, { encoding: "utf-8" })
        expect(result).toEqual(answer);
    });
});

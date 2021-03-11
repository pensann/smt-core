import { buildJSON } from "../common/builder"
import { parseJSON } from "../common/parser"
import { modConstructor } from "../mod/mod-core"

console.log("制作字典")
const modEn = modConstructor(".temp/SVE-ENG/Stardew Valley Expanded/[CP] Stardew Valley Expanded")
const modZh = modConstructor(".temp/SVE-CHS/[CP] Stardew Valley Expanded")
const fEn = ".temp/dicten.json"
const fZh = ".temp/dictzh.json"
console.log("解包字典")
modEn.extractDict(fEn)
modZh.extractDict(fZh, "zh")
const dEn: { [index: string]: string } = parseJSON(fEn)
const dZh = parseJSON(fZh)
const dict: { [index: string]: string } = {}
for (const [key, value] of Object.entries(dEn)) {
  dict[value] = dZh[key]
}
buildJSON(".temp/dict.json", dict)

const di = parseJSON(".temp/dict.json")
const mod = modConstructor(".temp/SVE/Stardew Valley Expanded/[CP] Stardew Valley Expanded")
mod.translate(di)

console.log("翻译完了")
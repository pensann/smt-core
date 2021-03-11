import { parseJSON } from "../common/parser"
import { buildJSON } from "../common/builder"
import { travel } from "../common/func"
import { extname, resolve } from "path"

// 解包字典
const dict: { [index: string]: any } = {}
travel(".temp/SVE-CHS/[JA] Stardew Valley Expanded", (m: any) => {
  const ext = extname(m)
  if (ext == ".json") {
    const j = parseJSON(m)
    if (j && j.NameLocalization) {
      dict[j.Name] = j.NameLocalization
    }
    if (j && j.DescriptionLocalization) {
      dict[j.Description] = j.DescriptionLocalization
    }
  }
})

travel(".temp/SVE/Stardew Valley Expanded/[JA] Stardew Valley Expanded", (m: any) => {
  const ext = extname(m)
  if (ext == ".json") {
    const j = parseJSON(m)
    if (dict[j.Name]) {
      j.NameLocalization = dict[j.Name]
    }
    if (dict[j.Description]) {
      j.DescriptionLocalization = dict[j.Description]
    }
    buildJSON(resolve(m), j)
  }
})
import { writeFileSync } from "fs"
import { create } from "xmlbuilder2"

import { Entries } from "./interfaces";

/**
 * 生成Json文件
 * @path 生成的文件路径，包括文件名
 * @jsonObj Json对象
 * @space 格式化间隔符，默认无间隔（不格式化）
 */
function buildJSON(path: string, jsonObj: Object, space?: string) {
  const data = JSON.stringify(jsonObj, null, space)
  writeFileSync(path, data)
}

/**
 * 生成Entries的XML对象
 * @path 生成的文件路径
 * @entries entries
 * @space 格式化间隔符，默认无间隔（不格式化）
 */
function buildXML(path: string, entries: Entries, space?: string) {
  const root = create({ encoding: "utf-8" })
  .ele('entries')
  for (const [key, value] of Object.entries(entries)) {
    root.ele("entry", { id: key }).txt(value)
  }
  writeFileSync(path, root.end({ prettyPrint: true, indent: space }))
}

export { buildJSON, buildXML }
import { readFileSync } from "fs"
import { Parser } from "xml2js"
import { parse } from "jsonc-parser"

import { Entries } from "./interfaces";

/** 返回无BOM头的字符串 */
function stripBOM(str: string) {
  return str.charCodeAt(0) == 0xfeff ?
    str.slice(1)
    : str
}

/** 解析JSON文件，返回JSON对象
 * - 默认使用"utf-8"、"utf-8-sig"编码，可指定编码
 * - 支持跨行的非标准JSON文件(转义为\n)
 * - 换行符支持CRLF和LF，不支持CR换行
 */
function parseJSON(path: string, encoding: BufferEncoding = "utf-8") {
  const sFormated = readFileSync(path, encoding)
  return parse(stripBOM(sFormated))
}

/** 解析XML字符串返回JSON对象 */
function parseXMLStr(str: string) {
  const parser = new Parser()
  const entries: Entries = {}
  parser.parseString(str, (err: string, res: any) => {
    if (err) throw err
    res.entries.entry.forEach((entry: any) => {
      entries[entry.$.id] = entry._
    })
  })
  return entries
}

/** 解析特定格式的XML文件，支持DOM文本应用XML注释(注:正则替换)；
 * @example
 * `
 * <?xml version="1.0" encoding="utf-8"?>
 * <entries>
 *  <entry id="key">value</entry>
 * </entries>
 * `
 */
function parseXML(xmlFile: string, encoding: BufferEncoding = "utf-8") {
  const sFormated = readFileSync(xmlFile, encoding)
    .replace(/<!--[\s\S]*?-->/, "")
  return parseXMLStr(stripBOM(sFormated))
}

export { parseJSON, parseXML }
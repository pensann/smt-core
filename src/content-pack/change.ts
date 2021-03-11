import { resolve, extname, basename, dirname } from "path"
import { readFileSync, writeFileSync } from "fs"

import { parseJSON, parseXML } from "../common/parser"
import { buildJSON } from "../common/builder"
import { joinForSMAPI } from "../common/func";

import { StrType, StrConstructor } from "./str"
import { CommonChange, EditData } from "./interfaces";

/** 类 */
class Change {
  private readonly origin: CommonChange
  public env: string = ''
  // 构造函数
  constructor(change: CommonChange) { this.origin = change }
  public get strFormat() {
    if (this.origin.Target.toLowerCase().includes("dialogue")) {
      return StrType.dialogue
    }
    else if (this.origin.Target.toLowerCase().includes("events")) {
      return StrType.events
    }
  }

  public getContent(): CommonChange {
    // EditData
    if (this.origin.Action == "EditData") {
      const content = this.origin as EditData
      content.Entries = readEntries(content.Entries, this.env, this.strFormat)
      return content
    } else {
      return this.origin
    }
  }

  /** 翻译器：传入回调函数或字典
   * - 传入回调函数：遇到每个文本字符串时执行回调(一般用于提取文本字符串)
   * - 传入字典：返回翻译后的content
   */
  public translator(arg?: ((key: string, value: string) => void) | { [index: string]: string }, mode?: "replace") {
    const content = this.getContent()
    const baseID = content.Action + content.Target + "[When]" + (() => {
      let str = ""
      if (content.When) {
        for (const [key, value] of Object.entries(content.When)) {
          if (key.toLowerCase() != "language") {
            str += key + value
          }
        }
      }
      return str
    })()

    // EditData
    if (content.Action == "EditData") {
      const entries = content.Entries as EditData["Entries"]
      if (!this.tarInclude(
        "AnimationDescriptions",
        "Blueprints",
        "CustomWeddingGuestPositions",
        "CustomNPCExclusions",
        "CraftingRecipes",
        "Locations",
        "ObjectInformation",
        "ObjectContextTags",
        "Characters/Schedules"
      )) {// Entries
        if (entries && typeof entries != "string") {
          for (const [key, value] of Object.entries(entries)) {
            // 注意！entries的key为"set-up"时，字符串不包含文本
            if (key != "set-up" && value) {
              // value为string，可能是Dialogue和Event
              if (typeof value == "string") {
                const id: string = baseID + "Entries" + key
                let n = 0
                // EventsEntries：匹配Target、以及value中同时包含"/"和'"'的
                if (this.strFormat == StrType.events || (value.includes('/') && value.includes('"'))) {
                  const vaList = value.match(/\"[\s\S]*?\"/g) // 字符串列表
                  if (vaList) {
                    let temp = value
                    vaList.forEach((v) => {
                      if (typeof arg == "function") arg(id + n, v.replace(/^\s*"|"\s*$/g, ""))
                      n += 1
                      // 读取时不带引号
                      if (typeof arg == "object") {
                        if (arg[v.replace(/^\s*"|"\s*$/g, "")]) {
                          // 赋值时带引号
                          temp = temp.replaceAll(v, '"' + arg[v.replace(/^\s*"|"\s*$/g, "")] + '"')
                        } else if (mode == "replace") {
                          for (const [origin, result] of Object.entries(arg)) {
                            temp = temp.replaceAll(origin, result)
                          }
                        }
                      }
                    })
                    entries[key] = temp
                  }
                } else {
                  // 其它情况要求全字匹配
                  if (typeof arg == "function") arg(id, value)
                  if (typeof arg == "object") {
                    if (arg[value]) {
                      entries[key] = arg[value]
                    } else if (mode == "replace") {
                      entries[key] = replace(value, arg)
                    }
                  }
                }
              }
              // value不是string，可能是MoveReaction
              else {
                if (value.Reactions) {
                  value.Reactions.forEach((reaction) => {
                    const special = reaction.SpecialResponses
                    if (special) {
                      for (const [k, v] of Object.entries(special)) {
                        const id: string = baseID + "Entries" + key + k + reaction.ID
                        if (v && v.Text) {
                          if (typeof arg == "function") arg(id, v.Text)
                          // dict[id + n] = v.Text
                          if (typeof arg == "object") {
                            if (arg[v.Text]) {
                              v.Text = arg[v.Text]
                            } else if (mode == "replace") {
                              v.Text = replace(v.Text, arg)
                            }
                          }
                        }
                      }
                    }
                  })
                }
              }
            }
          }
        }

        // Fields
        const fields = content.Fields as EditData["Fields"]
        if (fields) {
          for (const [key1, field] of Object.entries(fields)) {
            for (const [key2, value] of Object.entries(field)) {
              const id: string = baseID + "Fields" + key1 + key2
              if (typeof value == "string") {
                if (typeof arg == "function") arg(id, value)
                if (typeof arg == "object") {
                  if (arg[fields[key1][key2]]) {
                    fields[key1][key2] = arg[fields[key1][key2]]
                  } else if (mode == "replace") {
                    fields[key1][key2] = replace(arg[fields[key1][key2]], arg)
                  }
                }
              }
            }
          }
        }
        content.Entries = entries
        content.Fields = fields
      }
    }
    else if (content.Action == "Load" && this.strFormat == StrType.dialogue) {
      const file = resolve(this.env, content.FromFile)
      const fromFilePropNew = joinForSMAPI(dirname(content.FromFile), basename(file, extname(file)) + "-translated" + extname(file))
      const newFile = resolve(this.env, fromFilePropNew)
      const entries = parseJSON(file) as { [index: string]: string }
      for (const [key, value] of Object.entries(entries)) {
        const id = baseID + key
        if (typeof arg == "function") arg(id, value)
        // 读取时不带引号
        if (typeof arg == "object") {
          copyFile(file, newFile)
          content.FromFile = fromFilePropNew
          if (arg[value]) {
            entries[key] = arg[value]
          } else if (mode == "replace") {
            entries[key] = replace(value, arg)
          }
          buildJSON(newFile, entries)
        }
      }
    }
    return content
  }

  private tarInclude(...str: string[]) {
    let result = false
    const content = this.getContent()
    str.forEach((s) => {
      result = content.Target.toLowerCase().includes(s.toLowerCase()) ? true : result
    })
    return result
  }
}

function readEntries(entries: any, env: string, strFormat: StrType | undefined): { [index: string]: string | null } {
  if (typeof entries == "string" && extname(entries).toLowerCase() == ".xml") {
    // 支持XML格式的Entries
    const file = resolve(env, entries)
    entries = {}
    for (const [key, value] of Object.entries(parseXML(file))) {
      const str = StrConstructor(strFormat)
      str.strSrc = value
      entries[key] = str.str
    }
  } else if (entries instanceof Array) {
    // 支持列表形式的Entries
    const newEntries = {} as { [index: string]: string }
    entries.forEach((file: string) => {
      file = resolve(env, file)
      for (const [key, value] of Object.entries(parseXML(file))) {
        const str = StrConstructor(strFormat)
        str.strSrc = value
        newEntries[key] = str.str
      }
    })
    entries = newEntries
  }
  // 原版Entries
  return entries
}

function replace(str: string, dict: { [index: string]: string }) {
  for (const [origin, result] of Object.entries(dict)) {
    str = str.replaceAll(origin, result)
  }
  return str
}

function copyFile(file: string, newFile: string) {
  writeFileSync(newFile, readFileSync(file))
}

export { Change, readEntries }
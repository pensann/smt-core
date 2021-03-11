import { resolve, extname, basename } from "path"
import { existsSync } from "fs"
import { mkdirSync } from "fs"

import { buildJSON, buildXML } from "../common/builder"
import { parseJSON } from "../common/parser"

import { Change } from "../content-pack/change"
import { MetaChange } from "../content-pack/meta"
import { StrConstructor } from "../content-pack/str"

/** 枚举：模组类别 */
enum ModType {
  ContentPack = "ContentPack",
  SMAPI = "SMAPI"
}

/** 接口：模组说明 */
interface Manifest {
  Name: string
  Author: string
  Version: string
  Description?: string
  UniqueID: string
  // 最低SMAPI版本
  MinimumApiVersion?: string
  // ContentPackFor与EntryDll为2选1的关系
  ContentPackFor?: {
    UniqueID: "Pathoschild.ContentPatcher"
    MinimumVersion?: string
  }
  EntryDll?: string
  // 模组依赖
  Dependencies?: [
    {
      UniqueID: string
      MinimumVersion?: string
      IsRequired?: boolean
    }
  ]
  // 更新Key
  UpdateKeys?: string[]
}

/** 星露谷模组类
 * @path 模组相关文件路径
 * @manifest 模组信息
 * @type 模组类型
 * @constructor 模组文件夹路径
 */
class StardewMod {
  public readonly path: {
    folder: string,
    manifest: string,
    src: {
      folder: string,
      srcMain: string
    }
  }
  public manifest: Manifest
  public type: ModType
  constructor(path: string) {
    this.path = {
      folder: path,
      manifest: resolve(path, "manifest.json"),
      src: {
        folder: resolve(path, "src"),
        srcMain: resolve(path, "src", "src.jsonc")
      }
    }
    this.manifest = (() => {
      if (existsSync(this.path.manifest)) {
        return parseJSON(this.path.manifest)
      }
    })()
    this.type = this.manifest.EntryDll ? ModType.SMAPI : ModType.ContentPack
  }
  protected getPath() {
    return this.path
  }
  public build() { }
  public decompile() { }
  public extractDict(path: string, lang?: "zh") { }
  public translate(dict: { [index: string]: string }) { }
}

/** ContentPack
 * @path 模组相关文件路径
 * @manifest 模组信息
 * @type 模组类型
 * @constructor 模组文件夹路径
 * @method build() 从源代码生成content文件
 */
class ContentPack extends StardewMod {
  public readonly path: {
    folder: string,
    manifest: string,
    content: string,  // 扩展
    src: {
      folder: string,
      srcMain: string
    }
  }
  // content属性
  public get content() {
    if (existsSync(this.path.content)) {
      return parseJSON(this.path.content)
    }
  }
  constructor(path: string) {
    super(path)
    this.path = {
      folder: path,
      manifest: super.getPath().manifest,
      content: resolve(path, "content.json"),
      src: {
        folder: super.getPath().src.folder,
        srcMain: super.getPath().src.srcMain
      }
    }
  }
  // 方法
  public build() {
    // const content = { "Format": "1.19.0", "Changes": [] as any }
    if (existsSync(this.path.src.srcMain)) {
      let content: any = {}
      const src = parseJSON(this.path.src.srcMain)
      Object.assign(content, src)

      // 解析MetaChange
      if (src.Meta) {
        delete content.Meta
        src.Meta.forEach((Meta: any) => {
          const meta = new MetaChange(Meta)
          meta.getChange().forEach((entry: any) => {
            src.Changes.push(entry)
          })
        })
      }
      // 解析Change
      content.Changes.forEach((entry: any) => {
        const change = new Change(entry)
        change.env = this.path.src.folder
        content.Changes.push(change.getContent())
        // 解析Replace文件
        if (src.Replace) {
          delete content.Replace
          const replFile = resolve(this.path.src.folder, src.Replace)
          const repl = parseJSON(replFile)
          change.env = this.path.folder
          content.Changes.push(change.translator(repl, "replace"))
        } else {
          content.Changes.push(change.getContent())
        }
      })
      buildJSON(this.path.content, content)
    }
  }

  public decompile() {
    if (existsSync(this.path.content)) {
      // 创建源码文件夹文件夹
      if (!existsSync(this.path.src.folder)) { mkdirSync(this.path.src.folder) }
      // 解析Content，并以此为基准生成src文件
      const src = parseJSON(this.path.content)
      let n = 0
      src.Changes.forEach((entry: any) => {
        const change = new Change(entry)
        if (change.getContent().Action == "EditData" && change.strFormat != undefined) {
          const entries: { [index: string]: any } = {}
          for (const [key, value] of Object.entries(change.getContent().Entries as any)) {
            const str = StrConstructor(change.strFormat, value as string)
            entries[key] = str.strSrc
          }
          n += 1
          const fname = n + '.xml'
          entry.Entries = fname
          buildXML(resolve(this.path.src.folder, fname), entries)
        }
      })
      // 写入文件
      buildJSON(this.path.src.srcMain, src, '\t')
    }
  }
  public extractDict(path: string, lang?: "zh") {
    const dict: { [index: string]: string } = {}
    this.content.Changes.forEach((entry: any) => {
      const change = new Change(entry)
      change.env = this.path.folder
      change.translator((key, value) => {
        if (lang == "zh") {
          // 校验value包含中文再赋值
          const reg = new RegExp("[\\u4E00-\\u9FFF]+", "g")
          if (reg.test(value)) dict[key] = value
        } else {
          dict[key] = value
        }
      })
    })
    buildJSON(path, dict)
  }
  public translate(dict: { [index: string]: string }) {
    const entries: any[] = []
    const content = this.content
    const target = resolve(this.path.folder, basename(this.path.content, extname(this.path.content)) + "-translated" + extname(this.path.content))
    content.Changes.forEach((entry: any) => {
      const change = new Change(entry)
      change.env = this.path.folder
      entries.push(change.translator(dict))
    })
    content.Changes = entries
    buildJSON(target, content)
  }
}

function modConstructor(path: string) {
  const mod = new StardewMod(path)
  if (mod.type == "ContentPack") {
    return new ContentPack(path)
  }
  return mod
}

export { modConstructor, StardewMod, ModType }
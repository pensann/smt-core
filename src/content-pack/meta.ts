import { extname } from "path"

import { CommonChange } from "./interfaces"

import { joinForSMAPI } from "../common/func";

enum Meta {
  Character = "Character",
  Folder = "Folder"
}

interface Character {
  Type: Meta.Character
  ID: string,
  Portrait?: string,
  Sprite?: string,
  Dialogue?: string | {
    [index: string]: string
  },
  EngagementDialogue?: string | {
    [index: string]: string
  },
  MarriageDialogue?: string | {
    [index: string]: string
  },
  Events?: {
    [index: string]: string | {
      [index: string]: string
    },
  },
  Mail?: {
    [index: string]: string
  }
}

interface Folder {
  Type: Meta.Folder,
  Prototype?: {
    [index: string]: string
  },
  Changes: CommonChange[]
}

class MetaChange {
  private content: Character | Folder
  constructor(change: Character | Folder) {
    this.content = change
  }
  public getChange() {
    let result: any
    switch (this.content.Type) {
      case Meta.Character:
        result = new MetaChara(this.content).generate()
        break
      case Meta.Folder:
        result = new MetaFolder(this.content).extract()
        break
      default:
        result = [this.content]
        break
    }
    return result
  }
}

class MetaChara {
  private readonly id: string
  private readonly content: any
  constructor(meta: Character) {
    this.id = meta.ID
    this.content = meta
  }
  public generate() {
    const result: CommonChange[] = []
    const portrait = this.content.Portrait
    if (portrait) {
      result.push({
        Action: "Load",
        Target: joinForSMAPI("Portraits", this.id),
        FromFile: portrait
      })
    }
    const sprite = this.content.Sprite
    if (sprite) {
      result.push({
        Action: "Load",
        Target: joinForSMAPI("Characters", this.id),
        FromFile: sprite
      })
    }
    this.genChara("Dialogue", (entry) => { result.push(entry) })
    this.genChara("EngagementDialogue", (entry) => { result.push(entry) })
    this.genChara("MarriageDialogue", (entry) => { result.push(entry) })

    const events = this.content.Events
    if (events) {
      for (const [key, value] of Object.entries(events)) {
        this.genEvent(key, value, (entry) => { result.push(entry) })
      }
    }

    const mail = this.content.Mail
    if (mail) {
      result.push({
        Action: "EditData",
        Target: joinForSMAPI("Data", "Mail"),
        Entries: mail
      })
    }
    return result
  }
  private genChara(key: string, callback: (entry: CommonChange) => void) {
    if (this.content[key]) {
      let action: "Load" | "EditData" = "EditData"
      const entries = this.content[key]
      if (typeof entries == "string" && extname(entries) == ".json") {
        callback({
          Action: "Load",
          Target: joinForSMAPI("Characters", key, this.id),
          FromFile: entries
        })
      } else {
        callback({
          Action: action,
          Target: joinForSMAPI("Characters", key, this.id),
          Entries: entries
        })
      }

    }
  }
  private genEvent(key: string, value: any, callback: (entry: CommonChange) => void) {
    callback({
      Action: "EditData",
      Target: joinForSMAPI("Data", "Events", key),
      Entries: value
    })
  }
}

class MetaFolder {
  private content: Folder
  constructor(meta: Folder) {
    this.content = meta
  }
  public extract() {
    const changes = this.content.Changes
    const prototype = this.content.Prototype ? this.content.Prototype : {}
    const result: any[] = []
    changes.forEach(entry => {
      let change = {} as { [ingdex: string]: string }
      Object.assign(change, prototype)
      for (const [key, value] of Object.entries(entry)) {
        change[key] = value
      }
      result.push(change)
    })
    return result
  }
}


export { MetaChange }
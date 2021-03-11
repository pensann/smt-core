interface CommonChange {
  Action: "Load" | "EditImage" | "EditData" | "EditMap" | "Include",
  Target: string,
  When?: {
    [index: string]: string
  },
  LogName?: string,
  Enabled?: string,
  Update?: string
  [propName: string]: any
}

interface TextOperations {
  Operation: "Append" | "Prepend",
  Target: string,
  Value: string[],    // breadcrumb path
  Delimiter?: string
}

interface Load extends CommonChange {
  Action: "Load",
  FromFile: string
}

interface EditImage extends CommonChange {
  Action: "EditImage",
  FromFile?: string,
  FromArea?: string,
  ToArea?: string,
  PatchMode?: "Replace" | "Overlay"
}

interface EditData extends CommonChange {
  Action: "EditData",
  Fields?: {
    [index: string]: { [index: string]: string }
  },
  Entries?: string | {
    [index: string]: string | null |
    {
      NPCName: string,
      Reactions: {
        Tag: string,
        Response: string,
        Whitelist: [],
        SpecialResponses: null | {
          [index: string]: {
            ResponsePoint: null,
            Script: "",
            Text: string // 这个需要解析
          }
        },
        ID: string
      }[]
    }
  },
  Patches?: string[],
  MoveEntries?: any,
  TextOperations?: TextOperations,
}

interface EditMap extends CommonChange {
  Action: "EditData",
  FromFile?: string,
  FromArea?: string,
  ToArea?: string,
  PatchMode?: "Replace" | "Overlay" | "ReplaceByLayer",
  MapProperties?: any,
  TextOperations?: TextOperations
}

interface Include extends CommonChange {
  Action: "Include",
  FromFile: string
}

export { CommonChange, EditData }
import { readdirSync, statSync } from "fs";
import { join } from "path";

function joinForSMAPI(...paths: string[]) {
  let result = ""
  paths.forEach((path: any) => {
    result = result.length == 0 ? path : result += "/" + path
  })
  return result
}


function travel(dir: string, callback: Function) {
  readdirSync(dir).forEach((file: string) => {
    let pathname = join(dir, file)
    if (statSync(pathname).isDirectory()) {
      travel(pathname, callback)
    } else {
      callback(pathname)
    }
  })
}

export { joinForSMAPI, travel }

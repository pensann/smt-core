/**
 * 枚举CP类型
 */
enum StrType {
  dialogue,
  events
}

/**
 * CP字符串类
 * - str: 虚拟属性，CP字符串
 * - strSrc: 虚拟属性，源码字符串
 * - ident、depth: 格式化参数
 * - format = undefined: 字符串类型
 * @function getIndent(alter:number) 返回格式化深度
 * @function dropBlank(str:string) 删除全部换行、删除多余空白
 * @function dropBlankLine(str:string) 删除空行
 */
class CPStr {
  private _str: string = "";  // 储存原始字符串

  /** CP兼容的字符串 */
  public get str(): string { return this._str; }
  public set str(value: string) { this._str = value; }

  /** 公共属性 */
  public indent: number | string;
  public depth: number;
  public readonly format: StrType | undefined = undefined;

  /** 构造函数 */
  constructor(str: string = "") {
    this.str = str;
    this.indent = "\t";
    this.depth = 2;
  }

  /** CP源码，赋值时去除"首尾空白"和"全部空行" */
  public set strSrc(v: string) { this._str = CPStr.dropBlankLine(v.replace(/^\s*|\s*$/g, "")); }

  /** 取值时增加首尾换行与缩进 */
  public get strSrc() { return CPStr.dropBlankLine(this.str.replace(/^[\s\S]*$/g, (str) => this.getIndent() + str + this.getIndent(-1))); }

  /** 根据alter计算空白 */
  protected getIndent(alter: number = 0): string {
    const indent = typeof this.indent == "number" ? " ".repeat(this.indent) : this.indent;
    const depth = this.depth + alter;
    const table = depth < 0 ? "" : indent.repeat(depth);
    return "\n" + table;
  }

  /** 静态方法，删除多余空白 */
  protected static dropBlank(str: string) {
    return str
      .replace(/\n/g, "") // 删除全部换行
      .replace(/\t/g, "") // 删除全部制表符
      .replace(/^\s*|\s*$/g, "") // 删除首尾空白
      .replace(/\s+/g, " ") // 连续空白替换为空格
      .replace(/\s*#\s*/g, "#") // 删除＃周围的空白
      .replace(/\s*\^\s*/g, "^"); // 删除^周围的空白
  }

  /** 静态方法，删除多余空行 */
  protected static dropBlankLine(str: string) {
    return str.replace(/(\n\s*\n|\s*?\n)/g, "\n");
  }
}





/**
 * Dialogue字符串类
 * @description
 * - str: 赋值时清除控制符
 * - strSrc: CP源码，可赋值
 * - ident、depth: 格式化参数
 * - format: 字符串类型
 * @function getIndent(alter:number) 返回格式化深度
 * @function dropBlank(str:string) 删除全部换行、删除多余空白
 * @function dropBlankLine(str:string) 删除空行
 */
class DialogueStr extends CPStr {
  /** CP兼容的字符串，赋值时清除多余空白 */
  public set str(v: string) { super.str = DialogueStr.dropBlank(v); }
  public get str() { return super.str; }

  /** 公共属性 */
  public readonly format = StrType.dialogue;

  /** CP源码，赋值时清理多余空白 */
  public set strSrc(str: string) { this.str = str; }
  public get strSrc() {
    return DialogueStr.dropBlankLine(
      super.strSrc
        // 普通中断符（#$e#、#$b#）换行
        .replace(/#\$(e|b)#/g, (str) => this.getIndent() + str)
        // 概率分支中断符（#$c .5#，其中数字可能为任意0~1小数）,概率分支终端符分支中断符单独一行
        .replace(
          /#\$c 0?\.[0-9]#/g,
          (str) => this.getIndent() + str + this.getIndent()
        )
        // 概率分支中断符到下一个普通中断符（包括两句话）换行。
        .replace(/#\$c 0?\.[0-9]#[^#]*?#/g, (str) => {
          const regex = new RegExp(this.getIndent(), "g");
          return str.replace(regex, this.getIndent(1));
        })
        // 疑问分支换行+缩进
        .replace(/#\$q.*?#/g, (str) => this.getIndent() + str)
        // 回答分支换行+缩进+1
        .replace(/#\$r.*?#/g, (str) => this.getIndent(1) + str)
        // 性别分支造成普通中断符换行
        .replace(/#[^#]*?\^[^#]*?/g, (str) => {
          return str
            .replace(/#/g, "$" + this.getIndent(1))
            .replace(/\^/g, this.getIndent(1) + "^");
        })
      // ＃号不换行
    );
  }
}



/**
 * Event字符串类
 * @description
 * - str: 赋值时清除控制符
 * - strSrc: CP源码，赋值时校验双引号不能为奇数
 * - ident、depth: 格式化参数
 * - format: 字符串类型
 * @function getIndent(alter:number) 返回格式化深度
 * @function dropBlank(str:string) 删除全部换行、删除多余空白
 * @function dropBlankLine(str:string) 删除空行
 */
class EventStr extends CPStr {
  /** 公共属性 */
  public readonly format = StrType.events;

  /** CP源码，赋值时检测奇数引号，忽略注释，编译语法糖 */
  set strSrc(str: string) {
    const quotsNum = EventStr.getQuotsNum(str);
    if (quotsNum % 2) {
      throw "【错误】字符串包含奇数引号：" + str;
    } else {
      this.str = EventStr.dropBlank(
        str
          // 取得形如{{}*n}格式的字符串，语法糖：重复N次
          .replace(
            /\{[\s]*?\{[\s\S]*?\}[\s]*?\*[\s]*?\d{1,3}[\s]*?\}/g,
            (str) => {
              // 取得大括号内的部分（待重复部分）和重复次数
              const n = Number(
                str.match(/\*[\s]*?\d{1,3}/g)![0].replace(/\*/g, "")
              );
              const strR = str.match(/{[^{}]*?\}/g)![0].replace(/{|}/g, "");
              return strR.repeat(n);
            }
          )
          // 引号内删除空格，注意，此时引号开头空白将被删除，所以返回时补充空白。
          .replace(/\n*?\s*?\"([\s\S]*?)\"/g, (str) => {
            return " " + EventStr.dropBlank(str);
          })
          .replace(/\n/g, "/") // 引号外换行还原为/
          .replace(/^\s*?\/|\/\s*?$/g, "") // 删除首尾的/
          .replace(/\s*\/|\/\s*/g, "/") // 删除"/"周围的空白
          .replace(/\/+/g, "/") // 处理连续的/);
      );
    }
  }
  get strSrc() {
    return EventStr.dropBlankLine(
      super.strSrc
        // 删除/周围的空白
        .replace(/\s*\/\s*/g, "/")
        // str增加引号，提取引号外内容
        .replace(/^[\s\S]*$/g, (str) => '"' + str + '"')
        // 引号外内容,/替换成换行。
        .replace(/\"[\s\S]*?\"/g, (str) => str.replace(/\//g, this.getIndent()))
        // str去掉引号
        .replace(/^\s*"|"\s*$/g, "")
        // 引号里内容,按Dialogue格式化。
        .replace(/\"[\s\S]*?\"/g, (str) => {
          const result = new DialogueStr(str);
          result.depth += 1;
          return result.strSrc;
        })
    );
  }
  private static getQuotsNum(str: string) {
    const n = str.match(/"/g);
    return n ? n.length : 0;
  }
}

function StrConstructor(format?: StrType, str?: string): CPStr | DialogueStr | EventStr {
  if (format == StrType.events) {
    return new EventStr(str);
  } else if (format == StrType.dialogue) {
    return new DialogueStr(str);
  } else {
    return new CPStr(str);
  }
}

export { StrType, StrConstructor };

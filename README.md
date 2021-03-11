# SMT-Core

星露谷模组工具包（Stardew-Valley Mod Toolkit)。由TypeScript编写，为创作者提供的工具类。主要功能：

1. 翻译进度移植（CP/JA）：从旧版模组移植翻译进度至新版模组。
2. ContentPatcher编译器：
   - 反编译：分离ContentPack中过长的Dialogue字符串、Event字符串，生成更加可读的源代码文件。
   - 编译：从源代码编译CP模组，源代码允许作者更加集中的处理游戏流程控制，提供代码生成语法，方便编排更细腻的过场动画。
3. 模组类：按SMAPI标准实现的基础模组管理功能（添加模组、删除模组、禁用/启用模组、递归搜索模组列表等）。

> 注意：此项目为SMWE分离出的核心代码。目前不支持打包，有时间会做，没时间就算了~

## 源代码样例

src.json为源代码的入口文件，允许作者集中配置模组信息：

- repl字段可以配置表情符别名，详见[repl.jsonc](doc/sample/repl.jsonc)。
- Meta支持Character和Folder，Character允许集中配置NPC相关修改，Folder功能较复杂，通俗点说是根据原型（prototype）字段生成相关代码块。
- XML支持Dialogue与Events，详见[Dialogue.xml](doc/sample/Dialogue.xml)与[EventsSamHouse94.xml](doc/sample/EventsSamHouse94.xml)
- Entries补丁：允许在Entries传入一组Json文件或者XML文件，编译器会根据顺序整合为一个字典。
- 兼容content.json：原版content.json完全可以作为源代码编译——所以可以在原有模组基础上拓展功能。

```JSON
{
  "Format": "1.18",
  "Replace": "repl.jsonc",
  "Changes": [],
  "Meta": [
    {
      // 自定义角色
      "Type": "Character",
      "ID": "Jodi",
      "Portrait": "Portraits/Jodi.png",
      "Sprite": "Characters/Jodi.png",
      "Dialogue": "Dialogue.xml",
      "EngagementDialogue": "EngagementDialogue.xml",
      "MarriageDialogue": "Characters/Dialogue/MarriageDialogueJodi.json",
      "Events": {
        "Farm": "EventsFarm93.xml",
        "SamHouse": "EventsSamHouse94.xml"
      },
      "Mail": {
        "Jodi": "亲爱的 @,^我给花园订购太多肥料了，然后正好可以邮给你！！不管你是用掉还是卖掉，记得亲自来谢我。  ^   -乔迪 %item object 368 5 369 5 370 5 %%",
        "JodiCooking": "@,^在我能亲自给你做顿好饭之前，这份食谱应该能让你吃点好的。 ^   -乔迪%item cookingRecipe %%"
      }
    },
    {
      // 乔迪可约会：
      // 在2♥周一与乔迪聊到去礼拜的原因, 在第二次对话时选择安慰她：3064001。
      // 在第一年经历4♥事件94(第一年的砂锅鱼任务)。
      // 经历事件“乔迪的秘密”
      "Type": "Folder",
      "Prototype": {
        "Action": "EditData",
        "When": {
          // "HasDialogueAnswer": "3064001",
          "HasSeenEvent": "94"
        }
      },
      // 条件达成后，乔迪变为可约会对象，并拥有自定义对话
      "Changes": [
        {
          // 乔迪可约会
          "Target": "Data/NPCDispositions",
          "Entries": {
            "Jodi": "adult/polite/neutral/neutral/female/datable/Kent/Town/fall 11/Sam 'eldest_son' Vincent 'youngest_son' Kent 'husband'/SamHouse 4 5/乔迪"
          }
        },
        {
          // 乔迪约会对话
          "Target": "Characters/Dialogue/Jodi",
          "Entries": ["Dialogue.xml", "Dialoguelove.xml"]
        }
      ]
    }
  ]
}

```

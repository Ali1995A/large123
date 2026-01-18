export type ReferenceObject = {
  id: string;
  name: string;
  heightCm: number;
  kind:
    | "dice"
    | "lego"
    | "apple"
    | "cup"
    | "cat"
    | "child"
    | "door"
    | "car"
    | "bus"
    | "house"
    | "building"
    | "tower"
    | "tree"
    | "mountain"
    | "earth"
    | "moonDistance";
};

const REFERENCES: ReferenceObject[] = [
  { id: "dice", name: "骰子", heightCm: 2, kind: "dice" },
  { id: "lego", name: "积木", heightCm: 3, kind: "lego" },
  { id: "apple", name: "苹果", heightCm: 8, kind: "apple" },
  { id: "cup", name: "杯子", heightCm: 10, kind: "cup" },
  { id: "cat", name: "小猫", heightCm: 25, kind: "cat" },
  { id: "child", name: "小朋友", heightCm: 110, kind: "child" },
  { id: "door", name: "门", heightCm: 200, kind: "door" },
  { id: "car", name: "小汽车", heightCm: 150, kind: "car" },
  { id: "bus", name: "公交车", heightCm: 320, kind: "bus" },
  { id: "house", name: "小房子", heightCm: 600, kind: "house" },
  { id: "tree", name: "大树", heightCm: 1200, kind: "tree" },
  { id: "building", name: "大楼（60米）", heightCm: 6000, kind: "building" },
  { id: "tower", name: "摩天楼（150米）", heightCm: 15000, kind: "tower" },
  { id: "megaTower", name: "超高楼（600米）", heightCm: 60000, kind: "tower" },
  { id: "mountain1k", name: "千米高山（1000米）", heightCm: 100000, kind: "mountain" },
  { id: "mountain10k", name: "万米高山（10000米）", heightCm: 1000000, kind: "mountain" },
  { id: "earth", name: "地球直径", heightCm: 1274200000, kind: "earth" },
  { id: "moonDistance", name: "地月距离", heightCm: 38440000000, kind: "moonDistance" },
];

export function chooseReference(heightCm: number): ReferenceObject {
  for (const ref of REFERENCES) {
    if (heightCm <= ref.heightCm * 1.4) return ref;
  }
  return REFERENCES[REFERENCES.length - 1]!;
}

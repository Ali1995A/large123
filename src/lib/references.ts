export type ReferenceObject = {
  id: string;
  name: string;
  heightCm: number;
};

const REFERENCES: ReferenceObject[] = [
  { id: "dice", name: "骰子", heightCm: 2 },
  { id: "ipad", name: "iPad", heightCm: 24 },
  { id: "child", name: "小朋友", heightCm: 110 },
  { id: "adult", name: "大人", heightCm: 170 },
  { id: "tree", name: "树", heightCm: 1000 },
  { id: "building", name: "大楼", heightCm: 5000 },
  { id: "mountain", name: "高山", heightCm: 884800 },
  { id: "earth", name: "地球直径", heightCm: 1274200000 },
  { id: "moonDistance", name: "地月距离", heightCm: 38440000000 },
  { id: "sunDiameter", name: "太阳直径", heightCm: 139200000000 },
  { id: "au", name: "日地距离", heightCm: 14960000000000 },
];

export function chooseReference(heightCm: number): ReferenceObject {
  for (const ref of REFERENCES) {
    if (heightCm <= ref.heightCm * 1.4) return ref;
  }
  return REFERENCES[REFERENCES.length - 1]!;
}


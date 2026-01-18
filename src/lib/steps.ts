export type NumberStep = {
  value: bigint;
  spoken: string;
  digits: string;
};

export const NUMBER_STEPS: NumberStep[] = [
  { value: 1n, spoken: "一", digits: "1" },
  { value: 100n, spoken: "一百", digits: "100" },
  { value: 1000n, spoken: "一千", digits: "1000" },
  { value: 10000n, spoken: "一万", digits: "10000" },
  { value: 100000n, spoken: "十万", digits: "100000" },
  { value: 1000000n, spoken: "一百万", digits: "1000000" },
  { value: 10000000n, spoken: "一千万", digits: "10000000" },
  { value: 100000000n, spoken: "一亿", digits: "100000000" },
  { value: 1000000000n, spoken: "十亿", digits: "1000000000" },
  { value: 10000000000n, spoken: "一百亿", digits: "10000000000" },
  { value: 100000000000n, spoken: "一千亿", digits: "100000000000" },
  { value: 1000000000000n, spoken: "一万亿", digits: "1000000000000" },
  { value: 10000000000000n, spoken: "十万亿", digits: "10000000000000" },
  { value: 100000000000000n, spoken: "一百万亿", digits: "100000000000000" },
  { value: 1000000000000000n, spoken: "一千万亿", digits: "1000000000000000" },
  { value: 10000000000000000n, spoken: "一亿亿", digits: "10000000000000000" },
  { value: 20000000000000000n, spoken: "二亿亿", digits: "20000000000000000" },
  { value: 30000000000000000n, spoken: "三亿亿", digits: "30000000000000000" },
  { value: 40000000000000000n, spoken: "四亿亿", digits: "40000000000000000" },
  { value: 50000000000000000n, spoken: "五亿亿", digits: "50000000000000000" },
  { value: 60000000000000000n, spoken: "六亿亿", digits: "60000000000000000" },
  { value: 70000000000000000n, spoken: "七亿亿", digits: "70000000000000000" },
  { value: 80000000000000000n, spoken: "八亿亿", digits: "80000000000000000" },
  { value: 90000000000000000n, spoken: "九亿亿", digits: "90000000000000000" },
  { value: 100000000000000000n, spoken: "十亿亿", digits: "100000000000000000" },
];


# 粉粉立方体：数字大小（1cm 小方块）

面向不识字的 5 岁小朋友的互动小网页：用「1 厘米立方体」堆出体块，并和参照物做对比；按“下一步”依次展示 `1 → 100 → 1000 → … → 10 亿亿`，同时用中文朗读数字。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 推送到 GitHub

```bash
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## 部署到 Vercel

- 在 Vercel 新建项目，选择从 GitHub 导入该仓库即可。
- 默认配置就能跑（Next.js）。

## 使用提醒（iPad / 微信内置浏览器）

- 语音需要用户首次点一下“开始/播放”后才会出声（iOS/微信的限制）。
- 体块会在保证性能的前提下显示：小数字用真实小方块；极大数字用“整体体块 + 边线”表达比例。

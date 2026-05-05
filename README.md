# Gin-DB

日本のクラフトジン蒸留所と銘柄を、ボタニカル・受賞歴・地域から横断検索できる無料データベース。

🌐 **公開URL**: https://gin-db.com（準備中）

## 概要

- 日本国内のクラフトジン蒸留所100箇所以上を網羅予定
- 銘柄387、ボタニカル52種類を横断検索
- World Gin Awards等の受賞歴をタイムラインで一覧
- ふるさと納税の返礼品としてのジンを一覧化
- 静的サイト（HTML/CSS/JS）、Cloudflare Pages無料運用

## 構成

```
gin-db/
├── index.html          トップページ
├── botanical.html      ボタニカル逆引き
├── awards.html         受賞タイムライン
├── furusato.html       ふるさと納税で買えるジン
├── about.html          運営者情報
├── privacy.html        プライバシーポリシー
├── disclaimer.html     免責事項・アフィリエイト表記
├── distillery/
│   ├── niseko-ohoro.html
│   ├── kyoto-kinobi.html
│   └── matsui-hakuto.html
├── assets/
│   ├── style.css
│   └── age-gate.js
├── _headers            Cloudflare Pages セキュリティヘッダ
├── robots.txt
└── sitemap.xml
```

## デプロイ

このリポジトリは Cloudflare Pages と連携しています。`main` ブランチへの push で自動デプロイされます。

### Cloudflare Pages 設定

- Build command: なし（静的HTML）
- Build output directory: `/`
- Root directory: `/`

## 規制対応

- 20歳未満アクセス制限（年齢確認ゲート、`assets/age-gate.js`）
- ステマ規制対応のアフィリエイト表記（全ページに明示）
- 酒類自主基準準拠（フッタに飲酒注意喚起）

## ライセンス

[MIT License](LICENSE)

## 注意事項

⚠️ 20歳未満の飲酒は法律で禁止されています。本サイトは20歳以上の方を対象としています。

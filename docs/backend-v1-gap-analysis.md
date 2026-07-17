# backend-v1 接続切替・機能ギャップ分析

確認日: 2026-07-17

対象ブランチ: `feat/backend-v1-native`
基準コミット: `8ea41d8`

backend-v1 の `schemas.ts`、`routes-read.ts`、`routes-write.ts`、Altcha、添付 presign 実装を読み取り、frontend-v1 の旧 API 呼び出しと突き合わせた結果を記録する。backend-v1 側の並行実装に依存するタグ/R18 は、仕様書の公開形状を正として型定義した。

## エンドポイント対応

| backend-v1 API | フロント実装 | 備考 |
| --- | --- | --- |
| `GET /api/top` | `useThreads` のデフォルト表示 | `{ announcements, threads }` を使用 |
| `GET /api/catalog?sort=...` | `useThreads` | `new/old/replies/bump` を使用 |
| `GET /api/search?q=...` | `ThreadView` のスレッド検索 | 検索結果を現在のスレッドへ限定 |
| `GET /api/archive` | `useArchiveThreads` | `threadId/opExcerpt/replyCount/archivedAt` を使用 |
| `GET /api/archive/storage` | `useArchiveStorage` | camelCase 容量形状を使用 |
| `GET /api/threads/{threadId}` | `useThread` | UUID の `threadId` と `posts[].seq` を分離 |
| `POST /api/tokens` | `client.ts` のトークン取得 | `x-aimg-token` をキャッシュして送信 |
| `GET /api/altcha` | `getAltchaSolution` | PoW 解決後に投稿 payload の `altcha` へ設定 |
| `POST /api/attachments/presign` | `uploadAttachment` | MD5 申告後に presigned URL へ PUT |
| `POST /api/threads` | `useSubmitPost` | JSON body、`r18` 対応 |
| `POST /api/threads/{id}/posts` | `useSubmitPost` | JSON body、`attachmentId` 対応 |
| `DELETE /api/posts/{id}` | `useDeleteMutation` | JSON `{ deleteKey }` |
| `PUT /api/posts/{id}/reactions/up` | `useSoudaneMutation` | そうだね |
| `PUT /api/posts/{id}/reactions/del` | `useDelMutation` | del reaction |

成功レスポンスは backend-v1 の direct JSON、エラーは `{ error: { code, message } }` として扱う。旧 `{ ok, data }` エンベロープと multipart 投稿経路は client/form から除去した。

## UI で実装したもの

- `ThreadSummary`、`ThreadView`、`PostView`、`AttachmentView` を camelCase の backend-v1 形状へ変更。
- カタログとスレッド OP に `{name, kind, source}` のタグバッジを表示。
- カタログのタグ絞り込みと、`R18` タグの優先表示。
- スレ立てフォームに R18 トグルを追加し、`createThreadBody.r18` を送信。
- R18 サムネイルを初期ぼかし、クリックで reveal。設定画面に「R18画像を表示」トグルを追加。
- スレ立て/レス投稿の添付を `attachment_uploads` 申告 → RustFS 等への presigned PUT → `attachmentId` 参照の順に変更。
- Turnstile を投稿経路から除去し、Altcha PoW を使用。
- 削除キーによる投稿削除、そうだね、del reaction を native API へ変更。

## 未対応・暫定処置

backend-v1 に対応する公開エンドポイントが無い機能は、推測で呼び出さず UI を削除または非表示にした。

| 旧機能 | backend-v1 の状況 | フロント側の処置 |
| --- | --- | --- |
| `/close` | 該当する公開 API なし | スレ閉鎖 UI と mutation を削除 |
| `/report` | 該当する公開 API なし | 報告 UI と mutation を削除 |
| `/v1/thread/{id}/new` | 該当する公開 API なし | 新着レスチェックとバナーを削除 |
| `/threads?ids=...` | 該当する一括取得 API なし | サイドメニューの履歴スレッド再取得 UI を未対応表示へ変更。ローカル履歴自体は保持 |
| `/v1/thread-limits` | 該当する API なし | 期限・書き込み制限の取得と関連 UI を削除 |
| `/api/online-users` | backend-v1 の板 API 定義にない | 投稿注意欄の同接表示を削除 |
| duration / permanent / expiry | `ThreadView` に該当フィールドなし | 期限設定・期限表示・永久設定を削除 |
| allow image replies | `CreateReplyBody` に該当フィールドなし | 返信可否の旧サーバー制御を送信しない。native の添付仕様を使用 |
| 旧 title/name/email/admin 属性 | native の `PostView` に該当フィールドなし | 本文、seq、displayId、添付など native の公開項目だけで表示 |
| 画像 NG hash (`ng_hash`) / 旧 is_oekaki 属性 | native の公開型に該当フィールドなし | 旧画像 NG/お絵描き判定は native 投稿に適用されない |

backend-v1 には `GET /api/shadowban` が存在するが、今回の受入条件に含まれる書き込み/表示切替とは別の閲覧者判定 API であるため未接続。`PostView.status` は保持しており、shadowban 判定の結合は backend-v1 の認証・閲覧仕様確定後の残課題とする。

また、タスク記載の reaction method は POST だが、確認した backend-v1 の route 定義は PUT である。実装は正本ソースに合わせて PUT を使用した。

## 前提・結合確認

`POST /api/tokens` は backend-v1 の定義上 `cf_clearance` cookie が前提である。ブラウザ側は same-origin credentials で cookie を送るが、Cloudflare pre-clearance 自体をフロントで代替していない。backend-v1 の並行タグ/R18 実装との実環境結合確認は行わず、型チェックとユニットテストで担保した。

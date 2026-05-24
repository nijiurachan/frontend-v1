import toast from "react-hot-toast";

/**
 * React Hot Toast ユーティリティをカスタマイズして使用
 *
 * @example
 * ```typescript
 * import { toast } from '@/shared/ui/toast';
 *
 * function MyComponent() {
 *   return (
 *     <button onClick={() => toast.success('完了しました!')}>
 *       成功
 *     </button>
 *   );
 * }
 * ```
 */
export { toast };

/**
 * toast 関数の主なメソッド：
 * - toast('メッセージ')          - 通常のトースト
 * - toast.success('成功')        - 成功トースト
 * - toast.error('エラー')        - エラートースト
 * - toast.loading('読み込み中')  - ローディングトースト
 * - toast.promise(promise)      - Promise に基づくトースト
 * - toast.remove(toastId)       - トーストを削除
 *
 * オプション例：
 * toast('メッセージ', {
 *   duration: 2000,
 *   position: 'top-center',
 *   icon: '🎉',
 * })
 */

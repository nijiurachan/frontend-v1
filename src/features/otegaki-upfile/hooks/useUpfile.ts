import type { UpfileV2Commands } from "@nijiurachan/js/components";
import type {
  UpfileStateFlags,
  UpfileUiHintFlags,
} from "@nijiurachan/js/pure/upfile";
import { useEventLatest } from "@nijiurachan/js/react/PreactWrapperV1/use-event-latest";
import { useHost } from "@nijiurachan/js/react/PreactWrapperV1/use-host";

/** `upfile-input-v2`のhost要素に生えた imperative API 込みの型 */
export type UpfileInputHost = HTMLElement & UpfileV2Commands;

/**
 * 指定`fullKey`の`<CustomElementRegion tag="upfile-input-v2">`がマウントしている
 * hostを、`clickFileattach/clickPaint/clickPaste/clickClear`付きで返す型付きsugar。
 */
export function useUpfileHost(fullKey: string): UpfileInputHost | null {
  return useHost(fullKey) as UpfileInputHost | null;
}

/**
 * 指定`fullKey`から直近の`aimg:upfile-ui-hint`を購読するsugar。
 * 外部ツールバーが「今どのボタンを出すべきか」の判断に使う。
 */
export function useUpfileUiHint(
  fullKey: string,
): UpfileUiHintFlags | undefined {
  return useEventLatest(fullKey, "aimg:upfile-ui-hint");
}

/** 指定`fullKey`から直近の`aimg:upfile-state`を購読するsugar。 */
export function useUpfileState(fullKey: string): UpfileStateFlags | undefined {
  return useEventLatest(fullKey, "aimg:upfile-state");
}

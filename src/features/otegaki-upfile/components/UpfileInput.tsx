import { CustomElementRegion } from "@nijiurachan/js/react/PreactWrapperV1";
import { UpfileActions } from "@/features/otegaki-upfile/components/UpfileActions";
import { UpfileClearButton } from "@/features/otegaki-upfile/components/UpfileClearButton";
import {
  useUpfileHost,
  useUpfileUiHint,
} from "@/features/otegaki-upfile/hooks";

export interface UpfileInputProps {
  fullKey: string;
  allowImage: boolean;
}

export const UpfileInput: React.FunctionComponent<UpfileInputProps> = ({
  fullKey,
  allowImage,
}: UpfileInputProps) => {
  const host = useUpfileHost(fullKey);
  const hint = useUpfileUiHint(fullKey);

  return (
    <>
      <div className="relative w-fit max-w-full pb-0 [&_figure]:m-0 [&_canvas]:max-w-full [&_canvas]:h-auto">
        <CustomElementRegion
          id="upfile"
          tag="upfile-input-v2"
          attributes={{
            "data-allow-type": allowImage ? "file,draw" : "draw",
          }}
        />
        {host && hint?.showClearButton && (
          <UpfileClearButton
            className="absolute -top-2 -right-4 z-10"
            onClick={(): void => host.clickClear()}
          />
        )}
      </div>
      {host && <UpfileActions host={host} hint={hint} />}
    </>
  );
};

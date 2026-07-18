import { MdDragHandle } from "react-icons/md";

interface Props {
  handleProps: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  };
}

/** フローティングフォーム下端の「三」型ドラッグハンドル。 */
export const DesktopPanelGrip: React.FunctionComponent<Props> = ({
  handleProps,
}: Props) => (
  <div
    className="desktop-floating-grip"
    {...handleProps}
    role="presentation"
    title="ドラッグで移動"
  >
    <MdDragHandle aria-hidden="true" size={18} />
  </div>
);

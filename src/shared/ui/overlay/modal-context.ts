import { type Context, createContext } from "react";

export interface ModalContextValue {
  registerModal: () => number;
  unregisterModal: () => void;
  registerCloseHandler: (handler: () => void) => void;
  unregisterCloseHandler: (handler: () => void) => void;
  closeAllModals: () => void;
}

export const ModalContext: Context<ModalContextValue> =
  createContext<ModalContextValue>({
    registerModal: (): number => 0,
    unregisterModal: (): void => {},
    registerCloseHandler: (): void => {},
    unregisterCloseHandler: (): void => {},
    closeAllModals: (): void => {},
  });

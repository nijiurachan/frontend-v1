import {
  type Context,
  createContext,
  type ReactNode,
  useCallback,
  useRef,
} from "react";

interface ModalContextValue {
  registerModal: () => number;
  unregisterModal: () => void;
  registerCloseHandler: (handler: () => void) => void;
  unregisterCloseHandler: (handler: () => void) => void;
  closeAllModals: () => void;
}

const defaultValue: ModalContextValue = {
  registerModal: (): number => 0,
  unregisterModal: (): void => {},
  registerCloseHandler: (): void => {},
  unregisterCloseHandler: (): void => {},
  closeAllModals: (): void => {},
};

export const ModalContext: Context<ModalContextValue> =
  createContext(defaultValue);

export const ModalProvider: React.FunctionComponent<{
  children: ReactNode;
}> = ({ children }: { children: ReactNode }) => {
  const modalCountRef = useRef(0);
  const closeHandlersRef = useRef<Set<() => void>>(new Set());

  const registerModal = useCallback(() => {
    const depth = modalCountRef.current;
    modalCountRef.current += 1;
    return depth;
  }, []);

  const unregisterModal = useCallback(() => {
    modalCountRef.current = Math.max(0, modalCountRef.current - 1);
  }, []);

  const registerCloseHandler = useCallback((handler: () => void) => {
    closeHandlersRef.current.add(handler);
  }, []);

  const unregisterCloseHandler = useCallback((handler: () => void) => {
    closeHandlersRef.current.delete(handler);
  }, []);

  const closeAllModals = useCallback(() => {
    for (const handler of closeHandlersRef.current) {
      handler();
    }
  }, []);

  return (
    <ModalContext.Provider
      value={{
        registerModal,
        unregisterModal,
        registerCloseHandler,
        unregisterCloseHandler,
        closeAllModals,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

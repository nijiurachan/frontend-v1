import { type ReactNode, useCallback, useRef } from "react";
import { ModalContext } from "./modal-context";

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

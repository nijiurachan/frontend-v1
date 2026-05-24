import "./toast.css";

import { Toaster } from "react-hot-toast";

/**
 * アプリケーション全体で使用できるToastプロバイダー
 * ルートレイアウトに配置し、toast関数でトーストを表示します
 */
export const ToastProvider: React.FunctionComponent = () => {
  return (
    <Toaster
      position="bottom-center"
      reverseOrder={false}
      gutter={8}
      containerClassName="toast-container"
      containerStyle={{}}
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--color-background)",
          color: "var(--color-foreground)",
          border: "1px solid var(--color-border)",
          borderRadius: "0.5rem",
          padding: "1rem 1.25rem",
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: "var(--color-primary)",
            secondary: "var(--color-primary-foreground)",
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: "var(--color-destructive)",
            secondary: "var(--color-destructive-foreground)",
          },
        },
        loading: {
          duration: Infinity,
          iconTheme: {
            primary: "var(--color-primary)",
            secondary: "var(--color-primary-foreground)",
          },
        },
      }}
    />
  );
};

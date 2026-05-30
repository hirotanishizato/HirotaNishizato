"use client";

interface Props {
  children: React.ReactNode;
  message: string;
  className?: string;
}

/** 送信前に確認ダイアログを出すサブミットボタン（form内で使用） */
export function ConfirmButton({ children, message, className }: Props) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

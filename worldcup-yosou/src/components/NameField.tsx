"use client";

import { useId } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  names: string[];
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * 名前入力フィールド。
 *  - 初回（過去の名前が無い）は空白のテキスト入力。
 *  - 2回目以降は ▼ から過去の名前をプルダウン選択できる（datalist）。
 *  - 新しい名前を自由に入力することも可能。
 */
export function NameField({
  value,
  onChange,
  names,
  id,
  name,
  placeholder = "ニックネームを入力",
  required,
  disabled,
  className,
}: Props) {
  const listId = useId();
  return (
    <>
      <input
        id={id}
        name={name}
        className={`input ${className ?? ""}`}
        list={names.length > 0 ? listId : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={30}
        required={required}
        disabled={disabled}
      />
      {names.length > 0 && (
        <datalist id={listId}>
          {names.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      )}
    </>
  );
}

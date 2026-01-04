import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value?: number;
  onValueChange?: (val: number) => void;
  className?: string;
} & Omit<React.ComponentProps<"input">, "value" | "onChange" | "type">;

export function CurrencyInput({
  value,
  onValueChange,
  className,
  ...props
}: Props) {
  const [text, setText] = React.useState<string>("");
  const formatter = React.useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  React.useEffect(() => {
    const v = typeof value === "number" ? value : 0;
    setText(formatter.format(v));
  }, [value, formatter]);

  function toNumber(raw: string): number {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return 0;
    const n = Number(digits) / 100;
    return isNaN(n) ? 0 : n;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = toNumber(e.target.value);
    setText(formatter.format(n));
    onValueChange?.(n);
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={handleChange}
      className={cn(className)}
      {...props}
    />
  );
}

import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

const rules = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Número", test: (p: string) => /[0-9]/.test(p) },
  { label: "Caractere especial (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function getPasswordStrength(password: string) {
  return rules.filter((r) => r.test(password)).length;
}

const strengthLabels = ["", "Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];
const strengthColors = [
  "bg-muted",
  "bg-destructive",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-emerald-500",
  "bg-emerald-600",
];

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Meter bar */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < strength ? strengthColors[strength] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{strengthLabels[strength]}</p>

      {/* Rules checklist */}
      <ul className="space-y-1">
        {rules.map((rule) => {
          const pass = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-1.5 text-xs">
              {pass ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className={pass ? "text-foreground" : "text-muted-foreground"}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { useBlackWeek } from '@/context/BlackWeekContext';
export default function BlackWeekMath() {
  const { theme } = useBlackWeek();
  if (!theme) return null;
  return <section className="border-y border-border py-12 md:py-16"><div className="vitz-container grid md:grid-cols-2 gap-6 items-center"><h2 className="vitz-heading-lg">Faz a <em className="text-primary">conta.</em></h2><div className="space-y-3"><p className="text-sm text-muted-foreground">Conjunto Essential R$ 225 + Conjunto Daily R$ 187</p><p className="text-xl"><del className="text-muted-foreground mr-3">R$ 412</del> você paga <strong>R$ 225</strong></p><p className="text-primary">R$ 187 de presente</p><p className="text-xs text-muted-foreground">Somente conjuntos · Descontos não acumulativos · Até 3x sem juros</p></div></div></section>;
}

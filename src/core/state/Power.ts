// Einfaches globales Stromnetz (ohne Leitungen).
// Pro Tick melden Kraftwerke produce(), Verbraucher consume(). Am Ende des Ticks berechnet der Core
// satisfaction = Produktion / Bedarf (0..1). Verbraucher arbeiten im nächsten Tick mit diesem Faktor.
// Einheit: kW (frei gewählt, aber bitte überall gleich).

export class PowerGrid {
  private produced = 0;
  private demanded = 0;
  /** Produktion im letzten Tick */
  production = 0;
  /** Bedarf im letzten Tick */
  demand = 0;
  /** Versorgung 0..1 im letzten Tick (1 = alles versorgt; ohne Bedarf immer 1) */
  satisfaction = 1;

  /** Kraftwerk meldet seine Leistung für diesen Tick. */
  produce(kw: number): void {
    if (kw > 0) this.produced += kw;
  }

  /** Verbraucher meldet seinen Bedarf. Rückgabe: aktueller Versorgungsfaktor 0..1. */
  consume(kw: number): number {
    if (kw > 0) this.demanded += kw;
    return this.satisfaction;
  }

  /** @internal Vom Core am Ende jedes Ticks aufgerufen. */
  _endTick(): void {
    this.production = this.produced;
    this.demand = this.demanded;
    this.satisfaction = this.demanded <= 0 ? 1 : Math.min(1, this.produced / this.demanded);
    this.produced = 0;
    this.demanded = 0;
  }
}

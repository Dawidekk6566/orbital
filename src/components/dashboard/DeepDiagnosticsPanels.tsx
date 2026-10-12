"use client";

import { useState } from "react";
import type {
  PerformanceBudget,
  ThirdPartySummary,
  DomHealth,
  ConsoleIssue,
} from "@/lib/analysis/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ============================================================
   1. Karta: Performance Budget & Code Bloat
   ============================================================ */
export function BudgetPanel({ budget }: { budget?: PerformanceBudget }) {
  const [showAllBloat, setShowAllBloat] = useState(false);

  if (!budget || !budget.budgets.length) return null;

  const bloatList = showAllBloat ? budget.bloatItems : budget.bloatItems.slice(0, 5);

  return (
    <section className="rounded-[10px] border border-line bg-white p-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
              Performance Budget & Code Bloat
            </h3>
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Transfer Budgets
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Kontrola limitów wagowych zasobów oraz eliminacja nieużywanego kodu JS i CSS.
          </p>
        </div>
        {budget.totalWastedBytes > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-warn-line bg-warn-soft px-3 py-1 text-[12px] font-medium text-warn">
            <span>Oszczędność: {formatBytes(budget.totalWastedBytes)}</span>
            <span className="text-muted">·</span>
            <span>~{budget.potentialTimeSavingsMs}ms szybciej</span>
          </div>
        )}
      </div>

      {/* Paski budżetów */}
      <div className="mt-5 space-y-4">
        {budget.budgets.map((b) => {
          const isOver = b.status === "bad";
          const isWarn = b.status === "warn";
          const barColor = isOver
            ? "bg-bad"
            : isWarn
            ? "bg-warn"
            : "bg-good";

          const capWidth = Math.min(100, b.percentUsed);

          return (
            <div key={b.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-ink">{b.name}</span>
                <div className="flex items-center gap-2 font-mono text-[12px]">
                  <span className="text-ink">{formatBytes(b.actualBytes)}</span>
                  <span className="text-muted">/ limit {formatBytes(b.budgetBytes)}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10.5px] font-medium ${
                      isOver
                        ? "bg-bad-soft text-bad"
                        : isWarn
                        ? "bg-warn-soft text-warn"
                        : "bg-good-soft text-good"
                    }`}
                  >
                    {b.percentUsed}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${capWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista nieużywanego kodu */}
      {budget.bloatItems.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-semibold text-ink">
              Wykryty nieużywany kod (Unused JavaScript & CSS)
            </h4>
            <span className="font-mono text-[11px] text-muted">
              {budget.bloatItems.length} plików
            </span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                  <th className="pb-2 font-medium">Plik / Skrypt</th>
                  <th className="pb-2 font-medium">Typ</th>
                  <th className="pb-2 text-right font-medium">Waga całk.</th>
                  <th className="pb-2 text-right font-medium">Zbędne bajty</th>
                  <th className="pb-2 text-right font-medium">% zbędny</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2 font-mono">
                {bloatList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-bg-soft/50">
                    <td className="py-2.5 pr-4 font-sans font-medium text-ink">
                      <span className="block truncate max-w-[280px] sm:max-w-[420px]" title={item.url}>
                        {item.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-semibold ${
                          item.type === "script"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        {item.type === "script" ? "JS" : "CSS"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-muted">
                      {formatBytes(item.totalBytes)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold text-warn">
                      {formatBytes(item.wastedBytes)}
                    </td>
                    <td className="py-2.5 text-right text-ink">
                      {item.wastedPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {budget.bloatItems.length > 5 && (
            <button
              onClick={() => setShowAllBloat(!showAllBloat)}
              className="mt-3 text-[12px] font-medium text-muted hover:text-ink transition-colors"
            >
              {showAllBloat ? "Pokaż mniej ↑" : `Pokaż wszystkie (${budget.bloatItems.length}) ↓`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   2. Karta: Third-Party Scripts & Main Thread
   ============================================================ */
export function ThirdPartyPanel({ summary }: { summary?: ThirdPartySummary }) {
  if (!summary || (!summary.entities.length && summary.thirdPartyBytes === 0)) return null;

  const totalBytes = summary.firstPartyBytes + summary.thirdPartyBytes;
  const firstPartyPercent = totalBytes > 0 ? 100 - summary.thirdPartyPercent : 100;

  return (
    <section className="rounded-[10px] border border-line bg-white p-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
              Wpływ Skryptów Zewnętrznych (Third-Party)
            </h3>
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Tagi & Biblioteki
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Udział usług obcych w transferze oraz ich obciążenie głównego wątku przeglądarki (CPU).
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[12px]">
          <span className="flex items-center gap-1.5 text-ink">
            <span className="h-2.5 w-2.5 rounded-full bg-ink" />
            1st party: {firstPartyPercent}%
          </span>
          <span className="flex items-center gap-1.5 text-warn">
            <span className="h-2.5 w-2.5 rounded-full bg-warn" />
            3rd party: {summary.thirdPartyPercent}%
          </span>
        </div>
      </div>

      {/* Podział proporcjonalny wagi */}
      <div className="mt-5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-line-2">
          <div
            className="h-full bg-ink transition-all duration-500"
            style={{ width: `${firstPartyPercent}%` }}
            title={`Własne pliki: ${firstPartyPercent}% (${formatBytes(summary.firstPartyBytes)})`}
          />
          <div
            className="h-full bg-warn transition-all duration-500"
            style={{ width: `${summary.thirdPartyPercent}%` }}
            title={`Zewnętrzne usługi: ${summary.thirdPartyPercent}% (${formatBytes(summary.thirdPartyBytes)})`}
          />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[11.5px] text-muted">
          <span>Własny kod: {formatBytes(summary.firstPartyBytes)} ({summary.firstPartyMainThreadMs}ms CPU)</span>
          <span>Skrypty obce: {formatBytes(summary.thirdPartyBytes)} ({summary.thirdPartyMainThreadMs}ms CPU)</span>
        </div>
      </div>

      {/* Tabela wykrytych usług */}
      {summary.entities.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                <th className="pb-2 font-medium">Usługa / Dostawca</th>
                <th className="pb-2 font-medium">Kategoria</th>
                <th className="pb-2 text-right font-medium">Zasoby</th>
                <th className="pb-2 text-right font-medium">Transfer</th>
                <th className="pb-2 text-right font-medium">Obciążenie CPU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2 font-mono">
              {summary.entities.map((e, idx) => (
                <tr key={idx} className="hover:bg-bg-soft/50">
                  <td className="py-2.5 pr-4 font-sans font-medium text-ink">
                    {e.entity}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="rounded bg-line px-1.5 py-0.5 text-[10.5px] text-gray-1 font-sans">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right text-muted">
                    {e.urlCount}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-medium text-ink">
                    {formatBytes(e.transferSize)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-warn">
                    {e.mainThreadTimeMs > 0 ? `${e.mainThreadTimeMs} ms` : "< 10 ms"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   3. Karta: DOM Tree Health & Complexity
   ============================================================ */
export function DomHealthPanel({ domHealth }: { domHealth?: DomHealth }) {
  if (!domHealth) return null;

  const isGood = domHealth.status === "good";
  const isWarn = domHealth.status === "warn";

  return (
    <section className="rounded-[10px] border border-line bg-white p-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
              Złożoność i Struktura Drzewa DOM
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${
                isGood
                  ? "bg-good-soft text-good"
                  : isWarn
                  ? "bg-warn-soft text-warn"
                  : "bg-bad-soft text-bad"
              }`}
            >
              {isGood ? "Optymalny DOM" : isWarn ? "Umiarkowany DOM" : "Przeładowany DOM"}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Wpływ liczby węzłów i głębokości zagnieżdżenia na płynność animacji i renderowanie.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 font-mono">
        <div className="rounded-[8px] border border-line bg-bg-soft/40 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted">Liczba węzłów DOM</p>
          <p className="mt-1 text-[22px] font-semibold text-ink">
            {domHealth.totalElements.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-muted">Optymalnie: &lt; 800</p>
        </div>
        <div className="rounded-[8px] border border-line bg-bg-soft/40 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted">Maks. głębokość</p>
          <p className="mt-1 text-[22px] font-semibold text-ink">
            {domHealth.maxDepth} poziomów
          </p>
          <p className="mt-1 text-[11px] text-muted">Optymalnie: &lt; 24</p>
        </div>
        <div className="rounded-[8px] border border-line bg-bg-soft/40 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted">Maks. dzieci w węźle</p>
          <p className="mt-1 text-[22px] font-semibold text-ink">
            {domHealth.maxChildren}
          </p>
          <p className="mt-1 text-[11px] text-muted">Optymalnie: &lt; 40</p>
        </div>
      </div>

      {domHealth.warnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {domHealth.warnings.map((w, idx) => (
            <p key={idx} className="text-[13px] text-muted leading-relaxed">
              • {w}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   4. Karta: Runtime Console & Network Log
   ============================================================ */
export function ConsoleIssuesPanel({ issues }: { issues?: ConsoleIssue[] }) {
  if (!issues || issues.length === 0) return null;

  return (
    <section className="rounded-[10px] border border-line bg-white p-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
              Dziennik Błędów Konsoli i Błędnych Zapytań
            </h3>
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Runtime Log
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Problemy JavaScript rzucone w trakcie ładowania oraz zasoby z kodami odpowiedzi 4xx/5xx.
          </p>
        </div>
        <span className="font-mono text-[12px] text-bad font-medium">
          {issues.length} {issues.length === 1 ? "zdarzenie" : "zdarzeń"}
        </span>
      </div>

      <div className="mt-5 space-y-2.5 font-mono text-[12px]">
        {issues.map((issue, idx) => {
          const isError = issue.type === "error" || issue.type === "network";
          const isWarn = issue.type === "warning";
          const badgeClass = isError
            ? "bg-bad-soft text-bad border-bad-line"
            : isWarn
            ? "bg-warn-soft text-warn border-warn-line"
            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900";

          return (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-start gap-2 rounded-[6px] border border-line bg-bg-soft/50 p-3"
            >
              <div className="flex items-center gap-2 flex-none">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase font-bold ${badgeClass}`}>
                  {issue.type}
                </span>
                {issue.source && (
                  <span className="text-muted text-[11px]">[{issue.source}]</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words font-sans text-[13px] text-ink">{issue.message}</p>
                {issue.url && (
                  <p className="mt-1 truncate text-[11px] text-muted" title={issue.url}>
                    {issue.url}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

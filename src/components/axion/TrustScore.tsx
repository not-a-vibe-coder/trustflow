import { ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/trustflow/Reveal";
import {
  TRUST_BLURB,
  TRUST_EVENTS,
  TRUST_FORMULA,
  TRUST_FORMULA_ALPHA,
} from "@/lib/trustflow";

const FORMULA_KEYS = [
  { sym: "K", desc: "Base reputation score, starts at 100" },
  { sym: "B", desc: "Behaviour score from completed trades" },
  { sym: "α", desc: "Reputation weight — decreases as trades compound" },
];

export default function TrustScore() {
  const score = 96;
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - score / 100);

  return (
    <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
            4
          </div>
          <span className="text-[12px] sm:text-[13px] font-medium border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
            Trust score
          </span>
        </Reveal>

        <Reveal
          as="h2"
          className="px-5 sm:px-8 lg:px-12 font-medium text-gray-900 mb-6 sm:mb-8"
          style={{ fontSize: "clamp(1.75rem,5vw,3.8rem)", lineHeight: 1.12, letterSpacing: "-0.03em" }}
        >
          A score that reflects{" "}
          <span className="italic font-light text-gray-500">real behaviour.</span>
        </Reveal>

        <Reveal
          as="p"
          delay={80}
          className="px-5 sm:px-8 lg:px-12 max-w-[64ch] text-[15px] sm:text-[17px] leading-[1.6] text-gray-700 mb-10 sm:mb-14"
        >
          {TRUST_BLURB}
        </Reveal>

        <div className="px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-5 sm:gap-6 lg:gap-7">
          {/* Formula + sample score */}
          <Reveal variant="scale" className="glass-dark text-white p-7 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <svg width="120" height="120" viewBox="0 0 128 128" className="-rotate-90">
                  <circle cx="64" cy="64" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[30px] font-medium tabular-nums leading-none">{score}</span>
                  <span className="text-[11px] text-gray-400">/ 100</span>
                </div>
              </div>
              <div>
                <div className="text-[12px] text-gray-400 uppercase tracking-wider">Sample seller</div>
                <div className="text-[18px] font-medium">Chioma A.</div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[#34D399] bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                  <ShieldCheck size={12} /> 8 completed trades
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">Formula</div>
              <div className="font-mono text-[15px] text-[#34D399]">{TRUST_FORMULA}</div>
              <div className="font-mono text-[12px] text-gray-400 mt-1">{TRUST_FORMULA_ALPHA}</div>
            </div>

            <ul className="flex flex-col gap-2.5">
              {FORMULA_KEYS.map((k) => (
                <li key={k.sym} className="flex items-center gap-3 text-[13px] text-gray-300">
                  <span className="w-7 h-7 rounded-lg bg-[#34D399]/15 text-[#34D399] font-mono font-semibold flex items-center justify-center shrink-0">
                    {k.sym}
                  </span>
                  {k.desc}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Score events */}
          <Reveal variant="scale" delay={100} className="glass-card p-7 sm:p-8">
            <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-5">
              Score events
            </div>
            <ul className="flex flex-col">
              {TRUST_EVENTS.map((e, i) => {
                const positive = e.delta.startsWith("+");
                const zero = e.delta.startsWith("→");
                return (
                  <li
                    key={e.label}
                    className={`flex items-center gap-4 py-3.5 ${
                      i < TRUST_EVENTS.length - 1 ? "border-b border-gray-200/60" : ""
                    }`}
                  >
                    <span
                      className={`text-[14px] font-bold tabular-nums rounded-lg px-2.5 py-1 shrink-0 min-w-[44px] text-center ${
                        positive
                          ? "bg-[#34D399]/15 text-[#047857]"
                          : zero
                            ? "bg-gray-900 text-white"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {e.delta}
                    </span>
                    <span className="text-[13.5px] sm:text-[14px] text-gray-700 leading-[1.5]">
                      {e.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

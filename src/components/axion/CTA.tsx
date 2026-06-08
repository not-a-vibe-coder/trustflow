import { ArrowRight } from "lucide-react";

const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

export default function CTA() {
  return (
    <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div
          className="relative overflow-hidden rounded-3xl bg-gray-900 text-white px-6 sm:px-10 lg:px-16 py-14 sm:py-20 lg:py-28"
        >
          {/* Glow accent */}
          <div
            className="pointer-events-none absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, #34D399 0%, transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #34D399 0%, transparent 70%)" }}
          />

          <div className="relative flex items-center gap-3 mb-8 sm:mb-10">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-gray-400">
              The mission
            </span>
          </div>

          <h2
            className="relative font-medium max-w-[20ch]"
            style={{
              fontSize: "clamp(1.75rem,5.5vw,4rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
            }}
          >
            We're not building another app. We're building the{" "}
            <span className="italic font-light text-[#34D399]">trust layer</span> African commerce has always been missing.
          </h2>

          <p className="relative mt-6 sm:mt-8 max-w-[54ch] text-[15px] sm:text-[17px] leading-[1.55] text-gray-400">
            Try the six-step flow yourself — paste a chat and watch a transaction go from
            fraud-prone to fully protected, in under a minute.
          </p>

          <div className="relative mt-10 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-5">
            <a
              href="/login"
              className="group bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full pl-6 pr-2 py-2.5 inline-flex items-center gap-3 transition-colors self-start"
            >
              <span>Try the demo</span>
              <span
                className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
                style={{ transitionTimingFunction: EASE }}
              >
                <ArrowRight size={14} className="text-[#34D399]" />
              </span>
            </a>
            <a
              href="#problem"
              className="group border border-white/15 hover:border-white/40 text-white text-[14px] font-medium rounded-full px-6 py-2.5 inline-flex items-center gap-3 transition-colors self-start"
            >
              <span>See the problem</span>
              <ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

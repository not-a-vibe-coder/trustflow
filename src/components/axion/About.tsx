import { ArrowRight, TriangleAlert } from "lucide-react";

const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

const SCENARIOS = [
  {
    tag: "The seller",
    name: "Chioma",
    sub: "sells fashion on Instagram",
    body: "A buyer asks for a ₦35,000 dress and sends a screenshot showing payment. Under pressure — messaged every two minutes — Chioma ships before checking her account. The money never arrived. The screenshot was fake. No record, no recourse.",
    loss: "Loses ₦35,000 · twice a month",
  },
  {
    tag: "The buyer",
    name: "Emeka",
    sub: "buys a phone on WhatsApp",
    body: "He transfers ₦28,000 directly to the seller's account for a phone. The seller goes quiet, then blocks him. No evidence, no contract, no platform to escalate to. His bank says the transfer was authorised. He lost everything.",
    loss: "Loses ₦28,000 · no recourse",
  },
];

export default function About() {
  return (
    <section className="bg-white pt-16 sm:pt-20 lg:pt-32 pb-16 sm:pb-20 lg:pb-32 overflow-hidden">
      <div className="mx-auto max-w-[1440px]">
        <div className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
            1
          </div>
          <span className="text-[12px] sm:text-[13px] font-medium border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
            The problem
          </span>
        </div>

        <h2
          className="px-5 sm:px-8 lg:px-12 font-medium text-gray-900 mb-6 sm:mb-8"
          style={{
            fontSize: "clamp(1.75rem,5vw,3.8rem)",
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
          }}
        >
          Every day, real people{" "}
          <br className="hidden sm:block" />
          lose <span className="italic font-light text-gray-500">real money.</span>
        </h2>

        <p className="px-5 sm:px-8 lg:px-12 max-w-[60ch] text-[15px] sm:text-[17px] leading-[1.6] text-gray-600 mb-12 sm:mb-16">
          Across Nigeria, trade happens on WhatsApp, Instagram and Telegram — with no
          infrastructure protecting either side. These are not edge cases. They are the
          everyday reality of digital commerce, and the result is billions lost annually.
        </p>

        <div className="px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-7">
          {SCENARIOS.map((s) => (
            <div key={s.name} className="rounded-2xl bg-[#F5F5F5] p-6 sm:p-8 flex flex-col gap-5 border-l-[3px] border-red-400">
              <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{s.tag}</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-[22px] sm:text-[26px] font-medium text-gray-900" style={{ letterSpacing: "-0.015em" }}>
                  {s.name}
                </h3>
                <span className="text-[13px] sm:text-[14px] text-gray-500">{s.sub}</span>
              </div>
              <p className="text-[14px] sm:text-[15px] leading-[1.6] text-gray-700">{s.body}</p>
              <div className="mt-auto flex items-center gap-2 text-[13px] font-medium text-red-600">
                <TriangleAlert size={15} />
                {s.loss}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 sm:px-8 lg:px-12 mt-12 sm:mt-14">
          <a
            href="#layers"
            className="group bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[13px] sm:text-[14px] font-medium rounded-full pl-5 sm:pl-6 pr-2 py-2 inline-flex items-center gap-3 transition-colors"
          >
            <span>See how we fix it</span>
            <span
              className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
              style={{ transitionTimingFunction: EASE }}
            >
              <ArrowRight size={14} className="text-[#34D399]" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

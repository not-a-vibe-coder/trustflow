import { Bot, ShieldCheck, Banknote, LayoutDashboard, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/trustflow/Reveal";

const DOMAINS = [
  {
    icon: Bot,
    name: "AI & Automation",
    primary: true,
    description: "Order extraction, fraud detection, invoice generation and risk analysis — all automated by Gemini.",
  },
  {
    icon: ShieldCheck,
    name: "Cybersecurity",
    description: "Fake-payment detection, fraud profiling, network-wide blacklisting and biometric fraud capture.",
  },
  {
    icon: Banknote,
    name: "Fintech & Payments",
    description: "Smart escrow, QR-based fund release, OPay vault integration and real-time payment verification.",
  },
  {
    icon: LayoutDashboard,
    name: "Digital SME Tools",
    description: "A unified seller dashboard with automated inventory, customer records and sales monitoring.",
  },
];

export default function CaseStudies() {
  return (
    <section className="bg-[#F5F5F5] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
            5
          </div>
          <span className="text-[12px] sm:text-[13px] font-medium border border-gray-300 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
            Competition domains
          </span>
        </div>

        <h2
          className="px-5 sm:px-8 lg:px-12 font-medium text-gray-900 mb-4 sm:mb-5"
          style={{
            fontSize: "clamp(1.75rem,7vw,4.2rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          <span className="sm:hidden">All four domains — naturally.</span>
          <span className="hidden sm:inline" style={{ fontSize: "clamp(2.25rem,4.5vw,3.6rem)" }}>
            Built for all four domains
            <br />
            <span className="italic font-light text-gray-500">— naturally.</span>
          </span>
        </h2>

        <p className="px-5 sm:px-8 lg:px-12 max-w-[60ch] text-[14px] sm:text-[16px] leading-[1.6] text-gray-600 mb-10 sm:mb-14 lg:mb-16">
          Most teams pick one domain. TrustFlow addresses all four organically — not by
          design, but because the problem demands it.
        </p>

        <div className="px-5 sm:px-8 lg:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-7">
          {DOMAINS.map(({ icon: Icon, name, description, primary }, i) => (
            <Reveal
              key={name}
              variant="up"
              delay={i * 80}
              className="group flex flex-col gap-5 glass-card glass-card-hover p-6 sm:p-7 border-b-[3px] border-[#34D399]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-white/70 border border-white flex items-center justify-center transition-colors duration-500 group-hover:bg-gray-900">
                  <Icon size={18} className="text-gray-900 transition-colors duration-500 group-hover:text-[#34D399]" />
                </div>
                {primary ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-gray-900 text-[#34D399] px-2 py-1 rounded-full">
                    Primary
                  </span>
                ) : (
                  <ChevronRight
                    size={16}
                    className="text-gray-400 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:text-gray-900"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[17px] sm:text-[19px] font-medium text-gray-900" style={{ letterSpacing: "-0.01em" }}>
                  {name}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-700 leading-relaxed">
                  {description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

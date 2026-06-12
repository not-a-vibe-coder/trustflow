import { Lock, Sparkles, Fingerprint, Check } from "lucide-react";
import { GeminiLogo } from "@/components/trustflow/GeminiLogo";
import { Reveal } from "@/components/trustflow/Reveal";

const LAYERS = [
  {
    icon: Lock,
    name: "TrustPay",
    protects: "Protects the money",
    points: [
      "Buyer locks funds in a secure OPay-backed vault before goods move",
      "Seller sees money is real — no fake screenshots possible",
      "Buyer shows QR on delivery, seller scans, funds release instantly",
      "Transfers above ₦50,000 require facial recognition",
    ],
  },
  {
    icon: Sparkles,
    name: "TrustFlow AI",
    protects: "Protects the transaction",
    powered: true,
    points: [
      "Gemini reads WhatsApp / Instagram / Telegram chats and extracts the order",
      "Analyzes payment screenshots for tampering in real time",
      "Detects identity fraud and suspicious behaviour patterns",
      "Auto-generates invoice, updates inventory, records the customer",
    ],
  },
  {
    icon: Fingerprint,
    name: "Fraud Intelligence",
    protects: "Protects the platform",
    points: [
      "Captures facial data + device fingerprint on a fraud attempt",
      "Records precise location at the point of fraud",
      "Builds a permanent profile and blacklists the fraudster network-wide",
      "Packages evidence ready for law-enforcement reporting",
    ],
  },
];

export default function ValueProps() {
  return (
    <section className="bg-white pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center">
            2
          </div>
          <span className="text-[12px] sm:text-[13px] font-medium border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5">
            The solution
          </span>
        </div>

        <h2
          className="px-5 sm:px-8 lg:px-12 font-medium text-gray-900 mb-10 sm:mb-14 lg:mb-16"
          style={{
            fontSize: "clamp(1.75rem,7vw,4.2rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          <span className="sm:hidden">
            Three layers. One promise. <span className="italic font-light text-gray-500">Zero fraud.</span>
          </span>
          <span className="hidden sm:inline" style={{ fontSize: "clamp(2.5rem,5vw,4.2rem)" }}>
            Three layers. One promise. <span className="italic font-light text-gray-500">Zero fraud.</span>
          </span>
        </h2>

        <div className="px-5 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
          {LAYERS.map(({ icon: Icon, name, protects, points, powered }, i) => (
            <Reveal
              key={name}
              variant="up"
              delay={i * 90}
              className="group relative overflow-hidden glass-dark text-white p-7 sm:p-8 flex flex-col gap-6 transition-transform duration-500 hover:-translate-y-1"
              style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
            >
              <div
                className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                style={{ background: "radial-gradient(circle, #34D399 0%, transparent 70%)" }}
              />
              <div className="relative flex items-center justify-between">
                <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  {powered ? <GeminiLogo size={20} /> : <Icon size={18} className="text-[#34D399]" />}
                </div>
                <span className="text-[11px] font-mono text-gray-500 tracking-wider">
                  LAYER 0{i + 1}
                </span>
              </div>
              <div className="relative flex flex-col gap-1">
                <h3 className="text-[19px] sm:text-[22px] font-medium" style={{ letterSpacing: "-0.015em" }}>
                  {name}
                </h3>
                <span className="text-[12px] sm:text-[13px] text-[#34D399]">{protects}</span>
                {powered && (
                  <span className="mt-2 inline-flex items-center gap-1.5 self-start text-[10px] text-gray-300 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                    <GeminiLogo size={12} /> Powered by Google Gemini
                  </span>
                )}
              </div>
              <ul className="relative flex flex-col gap-3 mt-1">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[13px] sm:text-[13.5px] text-gray-300 leading-[1.5]">
                    <Check size={15} className="text-[#34D399] shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

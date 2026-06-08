const ITEMS = [
  "OPay-backed escrow vault",
  "Powered by Google Gemini",
  "No fake screenshots",
  "QR-confirmed delivery",
  "Network-wide fraud blacklist",
  "Zero manual invoicing",
];

export default function Marquee() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <section className="bg-gray-900 text-white py-5 sm:py-6 overflow-hidden border-y border-white/5">
      <div
        className="flex gap-12 sm:gap-16 whitespace-nowrap"
        style={{ animation: "marquee 38s linear infinite", width: "max-content" }}
      >
        {loop.map((t, i) => (
          <span key={i} className="flex items-center gap-12 sm:gap-16 text-[14px] sm:text-[16px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] shrink-0" />
            <span className="tracking-[-0.01em]">{t}</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </section>
  );
}

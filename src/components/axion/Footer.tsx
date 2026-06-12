import { ArrowRight, Check } from "lucide-react";

const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

type FooterLink = { label: string; href: string };

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "The problem", href: "#problem" },
      { label: "The solution", href: "#layers" },
      { label: "How it works", href: "#flow" },
      { label: "Live demo", href: "/login" },
    ],
  },
  {
    heading: "Protection layers",
    links: [
      { label: "TrustPay", href: "#layers" },
      { label: "Chëkd AI", href: "#layers" },
      { label: "Fraud Intelligence", href: "#layers" },
    ],
  },
  {
    heading: "Domains",
    links: [
      { label: "AI & Automation", href: "#domains" },
      { label: "Cybersecurity", href: "#domains" },
      { label: "Fintech & Payments", href: "#domains" },
      { label: "Digital SME Tools", href: "#domains" },
    ],
  },
];

function FooterLink({ link }: { link: FooterLink }) {
  return (
    <a href={link.href} className="text-[14px] text-gray-900 hover:opacity-70 transition-opacity">
      {link.label}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#EFEFEF] pt-16 sm:pt-20 lg:pt-28 pb-8 sm:pb-10">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="h-0.5 w-16 bg-[#34D399] mb-10 sm:mb-14 lg:mb-16" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 lg:gap-8 pb-12 sm:pb-16 lg:pb-20">
          <div className="flex flex-col gap-6 max-w-md">
            <div className="flex items-center">
              <span className="relative inline-flex items-center text-[22px] font-bold tracking-[-0.03em] text-[#0F766E] leading-none">
                Chëkd
                <Check size={14} strokeWidth={4} className="absolute -top-1.5 -right-3 text-[#34D399]" />
              </span>
            </div>
            <p className="text-[14px] text-gray-600 leading-relaxed">
              The trust layer African digital commerce has always been missing — making every
              transaction between buyers and sellers safe.
            </p>
            <a
              href="/login"
              className="group bg-gray-900 text-white text-[13px] font-medium rounded-full pl-5 pr-2 py-2 inline-flex items-center gap-3 self-start"
            >
              <span>Try the demo</span>
              <span
                className="w-6 h-6 bg-[#34D399] rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
                style={{ transitionTimingFunction: EASE }}
              >
                <ArrowRight size={12} className="text-gray-900" />
              </span>
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <span className="text-[12px] uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                {col.heading}
              </span>
              {col.links.map((l) => (
                <FooterLink key={l.label} link={l} />
              ))}
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-[12px] sm:text-[13px] text-gray-600 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
            Chëkd · OPay & Google National Innovation Challenge 2026
          </span>
          <span className="text-[12px] sm:text-[13px] text-gray-500">
            © {new Date().getFullYear()} Chëkd
          </span>
        </div>
      </div>
    </footer>
  );
}

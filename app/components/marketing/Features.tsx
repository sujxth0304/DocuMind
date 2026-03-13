const features = [
  {
    title: "Smart Decision Capture",
    desc: "Automatically detects and structures decisions from Slack conversations and documents using AI.",
    num: "01",
  },
  {
    title: "Instant Answers",
    desc: "Ask your decision database natural questions and get cited, grounded answers in seconds.",
    num: "02",
  },
  {
    title: "Perfect Onboarding",
    desc: "New team members understand your history and context without tribal knowledge.",
    num: "03",
  },
  {
    title: "Real-time Collaboration",
    desc: "Sync decisions across your entire organization with live updates and notifications.",
    num: "04",
  },
  {
    title: "Enterprise Security",
    desc: "SOC2 compliant with end-to-end encryption and granular permission controls.",
    num: "05",
  },
  {
    title: "Analytics & Insights",
    desc: "Understand your decision patterns and identify areas for improvement.",
    num: "06",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-32 px-6 bg-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-20 space-y-4 border-b border-black/10 pb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
            Built for intelligent decision management
          </h2>
          <p className="text-black/50 max-w-xl leading-relaxed">
            Everything you need to capture, organize, and leverage your company&apos;s decisions at scale.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-black/10">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-8 border-r border-b border-black/10 hover:bg-black hover:text-white transition-all duration-200"
            >
              <span className="text-xs font-mono text-black/30 group-hover:text-white/40 mb-6 block">
                {f.num}
              </span>
              <h3 className="text-lg font-bold mb-3 text-black group-hover:text-white">{f.title}</h3>
              <p className="text-black/50 group-hover:text-white/60 leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
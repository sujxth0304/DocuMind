export default function CTA() {
  return (
    <section className="bg-black py-32 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
          Stop losing decisions to Slack scrollback.
        </h2>

        <p className="mt-6 text-base text-white/50 max-w-xl mx-auto leading-relaxed">
          Give your team a shared memory layer — one that grows automatically as decisions are made.
        </p>

        <div className="mt-10">
          <a
            href="/app/dashboard"
            className="inline-flex items-center justify-center bg-white text-black px-10 py-4 text-sm font-semibold tracking-wide hover:bg-white/90 transition-colors duration-200"
          >
            Get started free
          </a>
        </div>

        <p className="mt-6 text-xs text-white/30 tracking-wide">
          No credit card required. Set up in minutes.
        </p>
      </div>
    </section>
  );
}
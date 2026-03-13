export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-white text-black relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="max-w-4xl text-center space-y-8 px-6 relative z-10">
        {/* Badge */}
        <div className="inline-block animate-fade-in">
          <span className="px-4 py-1.5 rounded-full border border-black/20 text-black/60 text-xs font-medium tracking-widest uppercase">
            Decision Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.05] animate-fade-in text-black">
          Your company&apos;s memory,{" "}
          <span className="italic font-light">finally structured.</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-black/50 max-w-2xl mx-auto leading-relaxed animate-fade-in">
          Capture decisions, rationales, and intent across Slack and docs automatically. Get AI-powered answers grounded in your actual decisions.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in">
          <a
            href="/app/dashboard"
            className="px-8 py-4 rounded-none bg-black text-white text-sm font-semibold tracking-wide hover:bg-black/80 transition-colors duration-200"
          >
            Launch App
          </a>
          <a
            href="#features"
            className="px-8 py-4 rounded-none border border-black text-black text-sm font-semibold tracking-wide hover:bg-black hover:text-white transition-colors duration-200"
          >
            Learn More
          </a>
        </div>

        {/* Social proof */}
        <div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-black/40 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-sm tracking-wide">Enterprise Security</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-black/20"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm tracking-wide">Lightning Fast</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-black/20"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm tracking-wide">AI-Powered</span>
          </div>
        </div>
      </div>
    </section>
  );
}
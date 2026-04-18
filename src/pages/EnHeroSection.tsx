import Icon from "@/components/ui/icon";

export function EnHeroSection({ onBrowse }: { onBrowse: () => void }) {
  return (
    <>
      <section className="bg-gradient-to-br from-primary/5 via-background to-background py-12 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-body font-semibold px-3 py-1.5 rounded-full mb-4">
            <Icon name="Globe" size={13} /> English version
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-3 leading-tight">
            Short Phone Numbers<br />of Russia
          </h1>
          <p className="text-lg text-muted-foreground font-body mb-6 max-w-xl">
            Complete directory of short and service phone numbers: emergency services, operator support, banks, government services. All numbers verified manually.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onBrowse}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
            >
              <Icon name="Search" size={16} /> Browse directory
            </button>
            <a
              href="tel:112"
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-body font-semibold hover:bg-red-100 transition-colors"
            >
              <Icon name="AlertTriangle" size={16} /> Emergency: 112
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-3">Emergency numbers — free from any phone</p>
        <div className="flex flex-wrap gap-2">
          {[
            { number: "112", name: "Emergency" },
            { number: "101", name: "Fire / EMERCOM" },
            { number: "102", name: "Police" },
            { number: "103", name: "Ambulance" },
            { number: "104", name: "Gas" },
          ].map((e) => (
            <a
              key={e.number}
              href={`tel:${e.number}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl hover:border-primary/40 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="font-display font-bold text-white text-xs">{e.number}</span>
              </div>
              <span className="text-sm font-body text-foreground group-hover:text-primary transition-colors">{e.name}</span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

import Icon from "@/components/ui/icon";

export function EnHeroSection() {
  return (
    <>
      <section className="bg-gradient-to-br from-primary/5 via-background to-background py-12 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-lg text-muted-foreground font-body mb-6 max-w-xl">The directory of short and service phone numbers: emergency services, operator support, banks, government services. All numbers verified manually.</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="tel:112"
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-body font-semibold hover:bg-red-100 transition-colors"
            >
              <Icon name="AlertTriangle" size={16} /> Emergency: 112
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
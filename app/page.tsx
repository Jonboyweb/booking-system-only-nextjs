export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-speakeasy-charcoal to-burgundy-dark">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bebas text-gold mb-4">
            THE BACKROOM
          </h1>
          <p className="text-xl md:text-2xl text-gold-light font-playfair">
            Leeds&apos; Premier Prohibition Experience
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg mb-8 font-crimson">
            Step into our hidden speakeasy at 50A Call Lane. 
            Reserve your table for an unforgettable night of craft cocktails, 
            premium bottle service, and live entertainment.
          </p>
          
          <a
            href="/booking"
            className="inline-block bg-gold hover:bg-gold-light text-speakeasy-charcoal font-bebas text-2xl px-12 py-4 rounded transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            BOOK YOUR TABLE
          </a>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-speakeasy-charcoal/50 p-6 rounded border border-gold/30">
              <h3 className="text-gold font-bebas text-xl mb-2">UPSTAIRS</h3>
              <p className="font-crimson">10 Premium Tables</p>
              <p className="text-sm text-speakeasy-cream/70">Dance Floor Views</p>
            </div>
            
            <div className="bg-speakeasy-charcoal/50 p-6 rounded border border-gold/30">
              <h3 className="text-gold font-bebas text-xl mb-2">DOWNSTAIRS</h3>
              <p className="font-crimson">6 Intimate Tables</p>
              <p className="text-sm text-speakeasy-cream/70">Speakeasy Atmosphere</p>
            </div>
            
            <div className="bg-speakeasy-charcoal/50 p-6 rounded border border-gold/30">
              <h3 className="text-gold font-bebas text-xl mb-2">VIP SERVICE</h3>
              <p className="font-crimson">Bottle Service</p>
              <p className="text-sm text-speakeasy-cream/70">Light Show & Confetti</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
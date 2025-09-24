'use client';

import { useState } from 'react';
import { DrinkPackage, Spirit, Champagne } from '@/types/booking';

interface DrinkPackageSelectorProps {
  packages: DrinkPackage[];
  spirits: Spirit[];
  champagnes: Champagne[];
  selectedPackage?: string;
  selectedSpirits: string[];
  selectedChampagnes: string[];
  onPackageSelect: (packageId: string) => void;
  onSpiritToggle: (spiritId: string) => void;
  onChampagneToggle: (champagneId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function DrinkPackageSelector({
  packages,
  spirits,
  champagnes,
  selectedPackage,
  selectedSpirits,
  selectedChampagnes,
  onPackageSelect,
  onSpiritToggle,
  onChampagneToggle,
  onNext,
  onBack
}: DrinkPackageSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  
  const spiritsByCategory = spirits.reduce((acc, spirit) => {
    if (!acc[spirit.category]) acc[spirit.category] = [];
    acc[spirit.category].push(spirit);
    return acc;
  }, {} as Record<string, Spirit[]>);
  
  const hasSelection = selectedPackage || selectedSpirits.length > 0 || selectedChampagnes.length > 0;
  
  return (
    <div className="bg-charcoal-light p-8 rounded-lg border-2 border-gold">
      <h2 className="text-3xl font-bebas text-gold mb-6">Select Drinks Package</h2>

      {/* Validation message */}
      {!hasSelection && (
        <div className="mb-4 p-3 bg-burgundy bg-opacity-20 border border-burgundy rounded">
          <p className="text-cream text-sm font-poiret">
            Please select a drinks package or custom bottles to continue with your booking.
          </p>
        </div>
      )}

      {/* Toggle between packages and custom */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowCustom(false)}
          className={`flex-1 py-2 px-4 rounded font-poiret ${
            !showCustom ? 'bg-gold text-charcoal' : 'bg-charcoal border border-gold text-cream'
          }`}
        >
          Drinks Packages
        </button>
        <button
          onClick={() => setShowCustom(true)}
          className={`flex-1 py-2 px-4 rounded font-poiret ${
            showCustom ? 'bg-gold text-charcoal' : 'bg-charcoal border border-gold text-cream'
          }`}
        >
          Custom Bottles
        </button>
      </div>
      
      {!showCustom ? (
        /* Drink Packages */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {packages.filter(p => p.isActive).map(pkg => (
            <div
              key={pkg.id}
              onClick={() => onPackageSelect(pkg.id)}
              className={`p-4 rounded border-2 cursor-pointer transition-all ${
                selectedPackage === pkg.id
                  ? 'border-gold bg-gold bg-opacity-10'
                  : 'border-gold-dark hover:border-gold'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bebas text-xl text-gold">{pkg.name}</h3>
                <span className="font-bebas text-2xl text-cream">£{pkg.price}</span>
              </div>
              <p className="text-cream-dark text-sm mb-2">{pkg.description}</p>
              {pkg.includes && (
                <div className="text-xs text-cream space-y-1">
                  {Object.entries(pkg.includes).map(([key, value]) => (
                    <div key={key}>• {key}: {String(value)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Custom Bottle Selection */
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Spirits */}
          <div>
            <h3 className="font-bebas text-xl text-gold mb-3">Spirits</h3>
            {Object.entries(spiritsByCategory).map(([category, categorySpirits]) => (
              <div key={category} className="mb-4">
                <h4 className="font-poiret text-cream mb-2">{category}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {categorySpirits.filter(s => s.isAvailable).map(spirit => (
                    <label
                      key={spirit.id}
                      className="flex items-center gap-2 p-2 rounded border border-gold-dark hover:bg-gold hover:bg-opacity-10 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpirits.includes(spirit.id)}
                        onChange={() => onSpiritToggle(spirit.id)}
                        className="accent-gold"
                      />
                      <span className="text-cream text-sm flex-1">{spirit.brand} {spirit.name}</span>
                      <span className="text-gold text-sm">£{typeof spirit.price === 'object' && 'toNumber' in spirit.price ? spirit.price.toNumber() : spirit.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Champagnes */}
          <div>
            <h3 className="font-bebas text-xl text-gold mb-3">Champagnes</h3>
            <div className="grid grid-cols-1 gap-2">
              {champagnes.filter(c => c.isAvailable).map(champagne => (
                <label
                  key={champagne.id}
                  className="flex items-center gap-2 p-2 rounded border border-gold-dark hover:bg-gold hover:bg-opacity-10 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedChampagnes.includes(champagne.id)}
                    onChange={() => onChampagneToggle(champagne.id)}
                    className="accent-gold"
                  />
                  <span className="text-cream text-sm flex-1">{champagne.brand} {champagne.name}</span>
                  <span className="text-gold text-sm">£{typeof champagne.price === 'object' && 'toNumber' in champagne.price ? champagne.price.toNumber() : champagne.price}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gold text-cream font-bebas text-lg rounded hover:bg-gold hover:text-charcoal transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!hasSelection}
          className="flex-1 py-3 bg-gold text-charcoal font-bebas text-lg rounded hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continue {!hasSelection && '(Select a package or bottles)'}
        </button>
      </div>
    </div>
  );
}
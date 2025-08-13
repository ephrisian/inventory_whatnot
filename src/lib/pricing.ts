// Intelligent pricing system with configurable markup rules

export interface CategoryConfig {
  baseMarkupPercent: number;
  packMarkupPercent: number;
  packGroupSize: number;
  useMarketPricing: boolean;
}

export interface ItemPricing {
  cost: number;
  itemType: string;
  packsPerBox?: number;
  marketPrice?: number;
  categoryConfig: CategoryConfig;
  platformFees: Record<string, number>;
}

interface PricingResult {
  retailPrice: number;
  packPrice?: number;
  packGroupPrice?: number;
  platformPrices: {
    whatnot: number;
    ebay: number;
    discord: number;
  };
  calculations: {
    baseMarkup: number;
    platformFee: number;
    packMarkup?: number;
    finalMarkup: number;
  };
}

export function calculateIntelligentPricing(item: ItemPricing): PricingResult {
  const { cost, itemType, packsPerBox, marketPrice, categoryConfig, platformFees } = item;
  
  let retailPrice: number;
  let packPrice: number | undefined;
  let packGroupPrice: number | undefined;
  
  // For individual cards/singles - use market pricing
  if (categoryConfig.useMarketPricing && marketPrice) {
    retailPrice = marketPrice;
  } else {
    // For boxes and other items - use markup calculation
    const baseMarkup = categoryConfig.baseMarkupPercent / 100;
    const whatnotFee = platformFees.WHATNOT / 100;
    
    // Calculate base price with markup
    const basePrice = cost * (1 + baseMarkup);
    
    // Add platform fee to cover costs
    const priceWithFee = basePrice / (1 - whatnotFee);
    
    // Round up to nearest dollar for WhatNot
    retailPrice = Math.ceil(priceWithFee);
  }
  
  // Calculate pack pricing if this is a box
  if (itemType === 'box' && packsPerBox && packsPerBox > 0) {
    // Base pack price = retail price / number of packs
    const basePack = retailPrice / packsPerBox;
    
    // Add pack markup for individual pack sales
    const packMarkup = categoryConfig.packMarkupPercent / 100;
    packPrice = Math.ceil(basePack * (1 + packMarkup));
    
    // Calculate pack group pricing
    const groupSize = categoryConfig.packGroupSize;
    packGroupPrice = packPrice * groupSize;
  }
  
  // Calculate platform-specific prices
  const platformPrices = {
    whatnot: retailPrice,
    ebay: Math.ceil(retailPrice * 1.02), // Slightly higher for eBay due to higher fees
    discord: Math.ceil(retailPrice * 0.95), // Lower for direct sales (no platform fees)
  };
  
  const calculations = {
    baseMarkup: categoryConfig.baseMarkupPercent,
    platformFee: platformFees.WHATNOT,
    packMarkup: categoryConfig.packMarkupPercent,
    finalMarkup: ((retailPrice - cost) / cost) * 100,
  };
  
  return {
    retailPrice,
    packPrice,
    packGroupPrice,
    platformPrices,
    calculations,
  };
}

export function formatPricingDisplay(pricing: PricingResult): string {
  let display = `Retail: $${pricing.retailPrice}`;
  
  if (pricing.packPrice) {
    display += ` | Pack: $${pricing.packPrice}`;
  }
  
  if (pricing.packGroupPrice) {
    display += ` | 3-Pack: $${pricing.packGroupPrice}`;
  }
  
  return display;
}

// Default platform fees
export const DEFAULT_PLATFORM_FEES = {
  WHATNOT: 12, // 12% as mentioned by user
  EBAY: 13,    // 13% 
  DISCORD: 0,  // Direct sales
  OTHER: 5,    // Generic platform
} as const;

// Default category configurations
export const DEFAULT_CATEGORY_CONFIGS = {
  'Trading Cards': {
    baseMarkupPercent: 0,    // No markup - use market pricing
    packMarkupPercent: 25,   // 25% markup for packs
    packGroupSize: 3,        // Group packs in 3s
    useMarketPricing: true,  // Use TCGPlayer/market data
  },
  'Boxes': {
    baseMarkupPercent: 30,   // 30% markup for boxes
    packMarkupPercent: 25,   // 25% markup for packs
    packGroupSize: 3,        // Group packs in 3s
    useMarketPricing: false, // Use markup calculation
  },
  'Action Figures': {
    baseMarkupPercent: 40,   // 40% markup for figures
    packMarkupPercent: 0,    // No pack pricing
    packGroupSize: 1,        // No grouping
    useMarketPricing: false, // Use markup calculation
  },
  'Collectible Pins': {
    baseMarkupPercent: 50,   // 50% markup for pins
    packMarkupPercent: 0,    // No pack pricing
    packGroupSize: 1,        // No grouping
    useMarketPricing: false, // Use markup calculation
  },
} as const;

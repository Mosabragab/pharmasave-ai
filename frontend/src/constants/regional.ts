/**
 * PharmaSave AI Regional Constants
 * Egyptian-specific configurations and examples
 */

// Egypt-specific phone number formats and patterns
export const EGYPT_PHONE = {
  // Country code
  countryCode: '+20',
  
  // Placeholder examples for forms (realistic Egyptian numbers)
  placeholders: {
    mobile: '+20 10 123 4567',      // Egyptian mobile (Vodafone/Orange/Etisalat)
    landline: '+20 2 123 4567',     // Cairo landline
    business: '+20 11 123 4567',    // Business line
  },
  
  // Validation patterns
  patterns: {
    // Egyptian mobile numbers: +20 10/11/12/15 XXXX XXXX
    mobile: /^\+20\s?(1[0-5])\s?\d{3}\s?\d{4}$/,
    // Egyptian landline: +20 2/3/40/45/46/47/48/50/55/57/62/64/65/66/68/69/82/84/86/88/92/93/95/96/97 XXXX XXX
    landline: /^\+20\s?(2|3|4[0578]|5[057]|6[2456689]|8[2468]|9[2356789])\s?\d{3,4}\s?\d{3,4}$/,
    // Any Egyptian number
    any: /^\+20\s?\d{1,2}\s?\d{3,4}\s?\d{3,4}$/
  },
  
  // Common provider prefixes for mobile
  mobileProviders: {
    vodafone: ['10', '11', '12'],
    orange: ['10', '11', '12'],
    etisalat: ['14'],
    we: ['15']
  }
} as const;

// Egypt-specific address formats and regions
export const EGYPT_ADDRESS = {
  // Common governorates
  governorates: [
    'Cairo', 'Alexandria', 'Giza', 'Qalyubia', 'Port Said', 'Suez',
    'Luxor', 'Aswan', 'Red Sea', 'Beheira', 'Fayoum', 'Gharbeya',
    'Ismailia', 'Menoufeya', 'Minya', 'Qena', 'Sharqeya', 'Sohag',
    'Beni Suef', 'Damietta', 'Dakahleya', 'Kafr el-Sheikh', 'Matrouh',
    'New Valley', 'North Sinai', 'South Sinai', 'Assiut'
  ],
  
  // Address format placeholder
  placeholder: 'Street, Area, City, Governorate',
  
  // Common pharmacy areas in major cities
  commonPharmacyAreas: {
    cairo: ['Zamalek', 'Maadi', 'Heliopolis', 'New Cairo', 'Nasr City'],
    alexandria: ['Stanley', 'Sidi Gaber', 'Smoha', 'Miami', 'Agami'],
    giza: ['Mohandessin', 'Dokki', '6th of October', 'Sheikh Zayed']
  }
} as const;

// Egyptian business hours and cultural considerations
export const EGYPT_BUSINESS = {
  // Typical pharmacy hours
  typicalHours: {
    weekdays: 'Sun-Thu 9AM-10PM',
    friday: 'Fri 2PM-10PM (after Friday prayers)',
    saturday: 'Sat 9AM-10PM',
    ramadan: 'Modified hours during Ramadan'
  },
  
  // Common business license formats
  licenseFormats: {
    pharmacy: 'PH-XXXX-YYYY',
    pharmacist: 'RPH-XXXX-YYYY',
    commercial: 'CR-XXXX-YYYY'
  },
  
  // Currency and pricing
  currency: {
    code: 'EGP',
    symbol: 'ج.م',
    name: 'Egyptian Pound',
    typical_savings: '5,000-10,000 EGP monthly'
  },
  
  // Cultural considerations
  culture: {
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    weekend: ['Friday', 'Saturday'],
    prayerBreaks: true,
    ramadanConsiderations: true
  }
} as const;

// Validation helpers for Egyptian data
export const EGYPT_VALIDATION = {
  // Validate Egyptian phone number
  isValidPhone: (phone: string): boolean => {
    return EGYPT_PHONE.patterns.any.test(phone.replace(/\s/g, ''));
  },
  
  // Format phone number for display
  formatPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('20')) {
      const number = cleaned.substring(2);
      if (number.length >= 10) {
        return `+20 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 9)}`;
      }
    }
    return phone;
  },
  
  // Validate governorate
  isValidGovernorate: (governorate: string): boolean => {
    return EGYPT_ADDRESS.governorates.includes(governorate);
  }
} as const;

// Export all regional constants
export const REGIONAL_CONSTANTS = {
  phone: EGYPT_PHONE,
  address: EGYPT_ADDRESS,
  business: EGYPT_BUSINESS,
  validation: EGYPT_VALIDATION
} as const;

// Default exports for common use
export default REGIONAL_CONSTANTS;

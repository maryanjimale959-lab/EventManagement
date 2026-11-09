export const EVENT_CATEGORIES = [
  "All",
  "Artificial Intelligence",
  "Technology",
  "Hackathons",
  "Workshops",
  "Islamic Studies",
  "Business",
  "Education",
  "Professional Development",
];

export const CATEGORY_METADATA = {
  "Artificial Intelligence": {
    label: "Artificial Intelligence",
    shortLabel: "AI & ML",
    color: "purple",
    badgeClass: "bg-white/95 text-slate-800 border-white dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-800",
    dotClass: "bg-brand-500",
    description: "Machine learning summits, LLM engineering, computer vision & generative AI conferences.",
  },
  "Technology": {
    label: "Technology",
    shortLabel: "Tech",
    color: "sky",
    badgeClass: "bg-white/95 text-slate-800 border-white dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-800",
    dotClass: "bg-brand-500",
    description: "Cloud computing, cybersecurity, software engineering, and open-source conventions.",
  },
  "Hackathons": {
    label: "Hackathons",
    shortLabel: "Hackathons",
    color: "emerald",
    badgeClass: "bg-white/95 text-slate-800 border-white dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-800",
    dotClass: "bg-brand-500",
    description: "Competitive coding, product building marathons, fintech challenges, and prize demos.",
  },
  "Workshops": {
    label: "Workshops",
    shortLabel: "Workshops",
    color: "indigo",
    badgeClass: "bg-white/95 text-slate-800 border-white dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-800",
    dotClass: "bg-brand-500",
    description: "Hands-on technical labs, practical engineering masterclasses, and certified bootcamps.",
  },
  "Islamic Studies": {
    label: "Islamic Studies",
    shortLabel: "Islamic Studies",
    color: "teal",
    badgeClass: "bg-white/95 text-slate-800 border-white dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-800",
    dotClass: "bg-brand-500",
    description: "Islamic jurisprudence, ethical leadership, youth tafseer conferences, and intellectual heritage.",
  },
  "Business": {
    label: "Business",
    shortLabel: "Business & VC",
    color: "amber",
    badgeClass: "bg-white/95 text-slate-800 border-white dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-800",
    dotClass: "bg-brand-500",
    description: "Venture capital, startup acceleration, entrepreneurial pitch days, and diaspora investment forums.",
  },
  "Education": {
    label: "Education",
    shortLabel: "Education",
    color: "blue",
    badgeClass: "bg-white/95 text-slate-800 border-white dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-800",
    dotClass: "bg-brand-500",
    description: "Academic symposiums, university fellowships, pedagogical lectures, and researcher assemblies.",
  },
  "Professional Development": {
    label: "Professional Development",
    shortLabel: "Careers",
    color: "rose",
    badgeClass: "bg-white/95 text-slate-800 border-white dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-800",
    dotClass: "bg-brand-500",
    description: "Career clinics, executive leadership coaching, resume reviews, and industry networking.",
  },
  "General": {
    label: "General",
    shortLabel: "General",
    color: "slate",
    badgeClass: "bg-white/95 text-slate-800 border-white dark:bg-slate-900/95 dark:text-slate-100 dark:border-slate-800",
    dotClass: "bg-brand-500",
    description: "Multidisciplinary gatherings, community panel discussions, and milestone keynote sessions.",
  },
};

export function getCategoryMeta(category) {
  if (!category) return CATEGORY_METADATA["General"];
  // Direct match
  if (CATEGORY_METADATA[category]) return CATEGORY_METADATA[category];
  // Case-insensitive match
  const found = Object.keys(CATEGORY_METADATA).find(
    (k) => k.toLowerCase() === category.toLowerCase()
  );
  if (found) return CATEGORY_METADATA[found];
  // Heuristic fallbacks
  if (/ai|artificial|intelligence|machine learning|deep learning/i.test(category)) return CATEGORY_METADATA["Artificial Intelligence"];
  if (/hackathon|competition|challenge/i.test(category)) return CATEGORY_METADATA["Hackathons"];
  if (/workshop|lab|hands-on|training|bootcamp/i.test(category)) return CATEGORY_METADATA["Workshops"];
  if (/islam|islamic|quran|tafseer|sunnah/i.test(category)) return CATEGORY_METADATA["Islamic Studies"];
  if (/business|startup|founder|venture|finance/i.test(category)) return CATEGORY_METADATA["Business"];
  if (/academic|education|university|research|school/i.test(category)) return CATEGORY_METADATA["Education"];
  if (/career|leadership|professional|networking/i.test(category)) return CATEGORY_METADATA["Professional Development"];
  if (/tech|software|cloud|code|devops/i.test(category)) return CATEGORY_METADATA["Technology"];
  return CATEGORY_METADATA["General"];
}



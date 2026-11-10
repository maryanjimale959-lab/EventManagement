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
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/90 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
    dotClass: "bg-purple-500",
    description: "Machine learning summits, LLM engineering, computer vision & generative AI conferences.",
  },
  "Technology": {
    label: "Technology",
    shortLabel: "Tech",
    color: "sky",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
    dotClass: "bg-sky-500",
    description: "Cloud computing, cybersecurity, software engineering, and open-source conventions.",
  },
  "Hackathons": {
    label: "Hackathons",
    shortLabel: "Hackathons",
    color: "emerald",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    dotClass: "bg-emerald-500",
    description: "Competitive coding, product building marathons, fintech challenges, and prize demos.",
  },
  "Workshops": {
    label: "Workshops",
    shortLabel: "Workshops",
    color: "indigo",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
    dotClass: "bg-indigo-500",
    description: "Hands-on technical labs, practical engineering masterclasses, and certified bootcamps.",
  },
  "Islamic Studies": {
    label: "Islamic Studies",
    shortLabel: "Islamic Studies",
    color: "teal",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200/90 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60",
    dotClass: "bg-teal-500",
    description: "Islamic jurisprudence, ethical leadership, youth tafseer conferences, and intellectual heritage.",
  },
  "Business": {
    label: "Business",
    shortLabel: "Business & VC",
    color: "amber",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    dotClass: "bg-amber-500",
    description: "Venture capital, startup acceleration, entrepreneurial pitch days, and diaspora investment forums.",
  },
  "Education": {
    label: "Education",
    shortLabel: "Education",
    color: "blue",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
    dotClass: "bg-blue-500",
    description: "Academic symposiums, university fellowships, pedagogical lectures, and researcher assemblies.",
  },
  "Professional Development": {
    label: "Professional Development",
    shortLabel: "Careers",
    color: "rose",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    dotClass: "bg-rose-500",
    description: "Career clinics, executive leadership coaching, resume reviews, and industry networking.",
  },
  "General": {
    label: "General",
    shortLabel: "General",
    color: "slate",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-500",
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

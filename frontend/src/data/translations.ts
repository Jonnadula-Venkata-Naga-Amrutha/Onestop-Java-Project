export type Language = 'en' | 'te';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    brandTitle: 'OneStop',
    brandTagline: 'Smart Local Services Platform',
    heroHeadline: 'The right local expert. Right when you need one.',
    heroSubheadline: 'Connecting Andhra & Telangana homeowners and enterprises with verified electricians, plumbers, tutors, carpenters, and technicians.',
    findProfessional: 'Find a Professional',
    becomeProvider: 'Become a Provider',
    emergencyService: 'Emergency SOS',
    emergencyDesc: 'Urgent assistance dispatched in under 45 minutes',
    
    // Navigation
    navExplore: 'Explore Services',
    navHowItWorks: 'How It Works',
    navQuotations: 'Quotations',
    navArchitecture: 'Java + JDBC Code',
    navDashboard: 'Dashboard',
    navLogin: 'Sign In',
    navLogout: 'Sign Out',
    
    // Search
    searchPlaceholder: 'Search "affordable electrician in Vijayawada tomorrow"...',
    selectCategory: 'All Categories',
    selectCity: 'Select City',
    searchButton: 'Smart Search',
    aiSearchNotice: 'Rule-Based NLP Search Active',
    
    // Categories
    catElectrician: 'Electrician',
    catPlumber: 'Plumber',
    catTutor: 'Academic Tutor',
    catCarpenter: 'Carpenter',
    catApplianceRepair: 'Appliance Repair',
    catPainter: 'Painter',
    catCleaner: 'Deep Cleaner',
    catMechanic: 'Auto Mechanic',

    // Statuses
    status_PENDING: 'Booking Pending',
    status_QUOTE_SENT: 'Quotation Received',
    status_CONFIRMED: 'Booking Confirmed',
    status_PROVIDER_ON_THE_WAY: 'Professional On The Way',
    status_IN_PROGRESS: 'Work In Progress',
    status_COMPLETED: 'Job Completed',
    status_CANCELLED: 'Cancelled',
    status_REJECTED: 'Declined',

    // Roles
    roleCustomer: 'Customer',
    roleProvider: 'Service Provider',
    roleAdmin: 'Administrator',

    // Actions & Buttons
    bookNow: 'Book Appointment',
    requestQuote: 'Request Quotation',
    compareQuotes: 'Compare Quotes',
    viewProfile: 'View Profile',
    filterResults: 'Filter Results',
    saveFavorite: 'Save Favorite',
    removeFavorite: 'Remove Favorite',
    submitReview: 'Submit Review',
    fileComplaint: 'Report Issue',
    viewInvoice: 'Download Invoice',
    confirmCompletion: 'Confirm Job Done',
    cancelBooking: 'Cancel Booking',
    close: 'Close',
    submit: 'Submit',
    save: 'Save',
    verifyBadge: 'Verified Expert',

    // Stats
    statCompletedJobs: 'Completed Jobs',
    statVerifiedPros: 'Verified Pros',
    statAvgRating: 'Average Rating',
    statSatisfaction: 'Satisfaction Rate',

    // Architecture
    coreJavaArchitecture: 'Core Java + JDBC Architecture',
    architectureDescription: 'Zero Spring Boot / JPA overhead. Pure Servlets, Connection Pool, PreparedStatements, and normalized MySQL schemas.',

    // Assistant
    assistantTitle: 'OneStop Smart Assistant',
    assistantPrompt: 'Ask about service diagnosis, fair pricing, or local pros...',
  },
  te: {
    // Brand & Header
    brandTitle: 'వన్ స్టాప్',
    brandTagline: 'స్మార్ట్ లోకల్ సర్వీసెస్ ప్లాట్‌ఫారమ్',
    heroHeadline: 'మీకు అవసరమైన సరైన నిపుణుడు. సరైన సమయానికి.',
    heroSubheadline: 'ఆంధ్రప్రదేశ్ & తెలంగాణలోని విశ్వసనీయ ఎలక్ట్రీషియన్లు, ప్లంబర్లు, ట్యూటర్లు మరియు సాంకేతిక నిపుణులతో నేరుగా అనుసంధానం.',
    findProfessional: 'నిపుణుడిని కనుగొనండి',
    becomeProvider: 'సేవా భాగస్వామిగా చేరండి',
    emergencyService: 'ఎమర్జెన్సీ సేవలు',
    emergencyDesc: '45 నిమిషాల్లోపు అత్యవసర సహాయం లభిస్తుంది',

    // Navigation
    navExplore: 'సేవలు అన్వేషించండి',
    navHowItWorks: 'ఎలా పనిచేస్తుంది',
    navQuotations: 'కొటేషన్లు',
    navArchitecture: 'జావా + జెడిబిసి కోడ్',
    navDashboard: 'డాష్‌బోర్డ్',
    navLogin: 'ప్రవేశించండి',
    navLogout: 'నిష్క్రమించండి',

    // Search
    searchPlaceholder: 'ఉదా: "రేపు సాయంత్రం విజయవాడలో ఎలక్ట్రీషియన్ కావాలి"...',
    selectCategory: 'అన్ని విభాగాలు',
    selectCity: 'నగరాన్ని ఎంచుకోండి',
    searchButton: 'స్మార్ట్ సెర్చ్',
    aiSearchNotice: 'రూల్-బేస్డ్ ఎన్‌ఎల్‌పి శోధన సక్రియం',

    // Categories
    catElectrician: 'ఎలక్ట్రీషియన్',
    catPlumber: 'ప్లంబర్',
    catTutor: 'విద్యా ట్యూటర్',
    catCarpenter: 'వడ్రంగి (కార్పెంటర్)',
    catApplianceRepair: 'గృహోపకరణాల మరమ్మత్తు',
    catPainter: 'పెయింటర్',
    catCleaner: 'డీప్ క్లీనింగ్',
    catMechanic: 'ఆటో మెకానిక్',

    // Statuses
    status_PENDING: 'బుకింగ్ పెండింగ్‌లో ఉంది',
    status_QUOTE_SENT: 'కొటేషన్ అందింది',
    status_CONFIRMED: 'బుకింగ్ ధృవీకరించబడింది',
    status_PROVIDER_ON_THE_WAY: 'నిపుణుడు మార్గంలో ఉన్నారు',
    status_IN_PROGRESS: 'పని కొనసాగుతోంది',
    status_COMPLETED: 'పని పూర్తయింది',
    status_CANCELLED: 'రద్దు చేయబడింది',
    status_REJECTED: 'తిరస్కరించబడింది',

    // Roles
    roleCustomer: 'వినియోగదారుడు (కస్టమర్)',
    roleProvider: 'సేవా ప్రదాత (ప్రొవైడర్)',
    roleAdmin: 'నిర్వాహకుడు (అడ్మిన్)',

    // Actions & Buttons
    bookNow: 'ఇప్పుడే బుక్ చేయండి',
    requestQuote: 'కొటేషన్ కోరండి',
    compareQuotes: 'కొటేషన్లను సరిపోల్చండి',
    viewProfile: 'ప్రొఫైల్ చూడండి',
    filterResults: 'ఫిల్టర్లు',
    saveFavorite: 'ఇష్టమైనదిగా గుర్తించండి',
    removeFavorite: 'ఇష్టమైన వాటి నుండి తొలగించండి',
    submitReview: 'సమీక్షను సమర్పించండి',
    fileComplaint: 'ఫిర్యాదు నమోదు చేయండి',
    viewInvoice: 'రశీదు చూడండి',
    confirmCompletion: 'పని పూర్తయిందని నిర్ధారించండి',
    cancelBooking: 'బుకింగ్ రద్దు చేయండి',
    close: 'మూసివేయి',
    submit: 'సమర్పించండి',
    save: 'భద్రపరచండి',
    verifyBadge: 'ధృవీకరించబడిన నిపుణుడు',

    // Stats
    statCompletedJobs: 'పూర్తయిన పనులు',
    statVerifiedPros: 'ధృవీకరించిన నిపుణులు',
    statAvgRating: 'సగటు రేటింగ్',
    statSatisfaction: 'సంతృప్తి శాతం',

    // Architecture
    coreJavaArchitecture: 'కోర్ జావా + జెడిబిసి ఆర్కిటెక్చర్',
    architectureDescription: 'స్ప్రింగ్ బూట్ లేకుండా సులభమైన సర్వ్‌లెట్లు, కనెక్షన్ పూల్, ప్రిపేర్డ్ స్టేట్‌మెంట్లు మరియు మైఎస్‌క్యూఎల్ డేటాబేస్.',

    // Assistant
    assistantTitle: 'వన్ స్టాప్ స్మార్ట్ అసిస్టెంట్',
    assistantPrompt: 'ధరల అంచనాలు లేదా సరైన నిపుణుడి కోసం అడగండి...',
  }
};

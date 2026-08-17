export interface ServiceItem {
  name: string;
  price: string;
  duration: number;
  description: string;
}

export interface IndustryTemplate {
  id: string;
  name: string;
  icon: string;
  badge: string;
  defaultBusinessName: string;
  defaultAgentName: string;
  defaultAgentRole: string;
  defaultTone: 'friendly' | 'professional' | 'casual' | 'formal';
  defaultDescription: string;
  defaultServices: ServiceItem[];
  defaultHours: Record<string, { open: string; close: string; closed: boolean }>;
  defaultServiceAreas: string[];
  defaultFaqs: Array<{ question: string; answer: string }>;
  sampleTestMessage: string;
  sampleTestReply: string;
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  dental: {
    id: 'dental',
    name: 'Dental Clinic',
    icon: '🦷',
    badge: 'Popular',
    defaultBusinessName: 'BrightSmile Dental Care',
    defaultAgentName: 'BrightSmile Assistant',
    defaultAgentRole: 'Patient Coordinator & Booking Assistant',
    defaultTone: 'friendly',
    defaultDescription: 'Family and cosmetic dentistry practice offering cleanings, exams, emergency toothache care, and whitening.',
    defaultServices: [
      { name: 'Routine Exam & Cleaning', price: '$95 (or Insurance Copay)', duration: 45, description: 'Comprehensive dental exam, digital x-rays, and gentle cleaning.' },
      { name: 'Emergency Toothache Triage', price: '$75 Consultation', duration: 30, description: 'Same-day evaluation for dental pain, broken teeth, or acute sensitivity.' },
      { name: 'Professional Teeth Whitening', price: '$299 Special', duration: 60, description: 'In-office 1-hour laser whitening treatment.' },
    ],
    defaultHours: {
      monday: { open: '08:30', close: '17:30', closed: false },
      tuesday: { open: '08:30', close: '17:30', closed: false },
      wednesday: { open: '08:30', close: '17:30', closed: false },
      thursday: { open: '08:30', close: '17:30', closed: false },
      friday: { open: '08:30', close: '16:00', closed: false },
      saturday: { open: '09:00', close: '13:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    defaultServiceAreas: ['Downtown', 'Northside', 'West End', 'Metro Area'],
    defaultFaqs: [
      { question: 'Do you accept dental insurance?', answer: 'Yes! We accept Delta Dental, Cigna, MetLife, Aetna, Guardian, and most PPO plans.' },
      { question: 'Do you take same-day emergencies?', answer: 'Yes, we reserve daily slots specifically for urgent tooth pain.' },
    ],
    sampleTestMessage: 'Hi, I have a sharp pain in my back molar. Can I get an appointment tomorrow?',
    sampleTestReply: 'Hello! I am sorry to hear you are in pain. We have an emergency opening tomorrow morning at 10:00 AM. May I have your full name and phone number to reserve that slot for you?',
  },

  salon: {
    id: 'salon',
    name: 'Hair & Beauty Salon',
    icon: '💇',
    badge: 'Popular',
    defaultBusinessName: 'Luxe Hair & Esthetics Studio',
    defaultAgentName: 'Luxe Salon Concierge',
    defaultAgentRole: 'Salon Booking & Stylist Assistant',
    defaultTone: 'friendly',
    defaultDescription: 'Boutique hair salon specializing in haircuts, balayage coloring, keratin smoothing, and facial styling.',
    defaultServices: [
      { name: 'Signature Haircut & Blowout', price: '$65 - $85', duration: 45, description: 'Custom hair design, wash, deep condition, and blowout style.' },
      { name: 'Balayage & Full Color', price: '$180+', duration: 120, description: 'Custom hand-painted highlights, toner, and restorative glaze.' },
      { name: 'Keratin Smoothing Treatment', price: '$220', duration: 90, description: 'Frizz-free smoothing treatment lasting up to 4 months.' },
    ],
    defaultHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '19:00', closed: false },
      wednesday: { open: '09:00', close: '19:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: false },
    },
    defaultServiceAreas: ['Central District', 'Uptown', 'South Bay'],
    defaultFaqs: [
      { question: 'How long does a balayage appointment take?', answer: 'Balayage appointments typically take between 2 to 2.5 hours.' },
      { question: 'Can I bring reference photos?', answer: 'Absolutely! Our stylists love seeing your inspiration photos.' },
    ],
    sampleTestMessage: 'Hi! How much is a haircut and blowout, and do you have anything open this Saturday?',
    sampleTestReply: 'Hi there! Our signature haircut and blowout is $65–$85. We have openings this Saturday at 11:30 AM and 2:00 PM. Which time suits you best?',
  },

  hvac: {
    id: 'hvac',
    name: 'HVAC, Plumbing & Electrical',
    icon: '🔧',
    badge: 'Popular',
    defaultBusinessName: 'Apex Air & Plumbing Specialists',
    defaultAgentName: 'Apex Dispatch Assistant',
    defaultAgentRole: 'AI Dispatch & Appointment Booker',
    defaultTone: 'professional',
    defaultDescription: '24/7 residential and commercial heating, cooling, plumbing, and electrical service technicians.',
    defaultServices: [
      { name: 'AC & Heating Diagnostic', price: '$120 Diagnostic Fee', duration: 60, description: 'Complete system inspection; fee is waived if repair work is approved.' },
      { name: 'Seasonal HVAC Tune-Up', price: '$180 Flat Rate', duration: 60, description: '24-point electrical check, filter change, and coil cleaning.' },
      { name: 'Emergency Pipe Leak Triage', price: '$250+', duration: 90, description: 'Immediate leak stoppage and master plumbing repair.' },
    ],
    defaultHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '16:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    defaultServiceAreas: ['Austin', 'Round Rock', 'Cedar Park', 'Westlake Hills', 'Pflugerville'],
    defaultFaqs: [
      { question: 'Do you offer emergency after-hours dispatch?', answer: 'Yes! We have on-call master technicians available 24/7 for emergency repairs.' },
      { question: 'Are parts and labor under warranty?', answer: 'Yes, all replacement parts and labor include a 1-year guarantee.' },
    ],
    sampleTestMessage: 'My AC unit stopped blowing cold air today. How much is the diagnostic fee and when can someone come out?',
    sampleTestReply: 'Hello! Our diagnostic fee is $120, which is fully waived if you approve any recommended repair. We have a technician available tomorrow at 9:00 AM. What is your address and contact phone number so I can lock in your slot?',
  },

  gym: {
    id: 'gym',
    name: 'Gym & Fitness Studio',
    icon: '🏋️',
    badge: 'Trending',
    defaultBusinessName: 'IronFit Athletic Club',
    defaultAgentName: 'IronFit Member Guide',
    defaultAgentRole: 'Membership & Personal Training Coordinator',
    defaultTone: 'friendly',
    defaultDescription: 'State-of-the-art fitness center offering personal training, group classes, sauna, and strength conditioning.',
    defaultServices: [
      { name: 'Free VIP Trial Pass & Tour', price: 'Free', duration: 45, description: '1-day all-access pass with personalized facility walkthrough.' },
      { name: '1-on-1 Fitness Assessment', price: '$49 (Free with plan)', duration: 60, description: 'Body composition scan, mobility evaluation, and custom goal map.' },
      { name: 'Monthly Unlimited Membership', price: '$89 / month', duration: 0, description: '24/7 keycard access, unlimited group HIIT & yoga classes.' },
    ],
    defaultHours: {
      monday: { open: '05:00', close: '23:00', closed: false },
      tuesday: { open: '05:00', close: '23:00', closed: false },
      wednesday: { open: '05:00', close: '23:00', closed: false },
      thursday: { open: '05:00', close: '23:00', closed: false },
      friday: { open: '05:00', close: '22:00', closed: false },
      saturday: { open: '07:00', close: '20:00', closed: false },
      sunday: { open: '07:00', close: '20:00', closed: false },
    },
    defaultServiceAreas: ['Downtown Metro', 'Eastside', 'West End'],
    defaultFaqs: [
      { question: 'Are there any sign-up fees or contracts?', answer: 'No long-term contracts required! We offer flexible month-to-month memberships.' },
      { question: 'Do you have locker rooms and showers?', answer: 'Yes, full private locker rooms, saunas, and complimentary towel service.' },
    ],
    sampleTestMessage: 'Hi, I want to check out the gym. Can I get a free trial pass for this week?',
    sampleTestReply: 'Hey there! We would love to welcome you. I can get you a Free VIP 1-Day Pass and schedule a quick tour with a coach tomorrow at 10:00 AM or 5:30 PM. Which time works for you?',
  },

  realestate: {
    id: 'realestate',
    name: 'Real Estate & Property',
    icon: '🏡',
    badge: 'Popular',
    defaultBusinessName: 'Apex Realty Group',
    defaultAgentName: 'Apex Property Assistant',
    defaultAgentRole: 'Buyer & Seller Client Concierge',
    defaultTone: 'professional',
    defaultDescription: 'Premier residential real estate brokerage helping families buy, sell, and invest in top neighborhoods.',
    defaultServices: [
      { name: 'Home Valuation & Market Report', price: 'Complimentary', duration: 45, description: 'Accurate comparative market analysis of your property.' },
      { name: 'Private Property Showing Tour', price: 'Complimentary', duration: 60, description: 'Guided walkthrough of selected MLS listings matching your criteria.' },
      { name: 'First-Time Buyer Consultation', price: 'Complimentary', duration: 45, description: 'Mortgage pre-approval guidance, down payment options, and search strategy.' },
    ],
    defaultHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '17:00', closed: false },
    },
    defaultServiceAreas: ['Greater Austin Area', 'Travis County', 'Williamson County'],
    defaultFaqs: [
      { question: 'How much does it cost to use a buyer agent?', answer: 'Buyer representation is completely free for home buyers (commission is paid by the seller).' },
      { question: 'Can you help me get pre-approved for a mortgage?', answer: 'Yes, we work with top local lenders who can pre-qualify you in under 24 hours.' },
    ],
    sampleTestMessage: 'Hi, I saw a listing on Oak Avenue. Is it still available for a private viewing this weekend?',
    sampleTestReply: 'Hello! Yes, that home on Oak Avenue is currently active. I can schedule a private showing with an agent this Saturday at 11:00 AM or 2:00 PM. What is your name and preferred phone number to confirm?',
  },

  restaurant: {
    id: 'restaurant',
    name: 'Restaurant & Catering',
    icon: '🍽️',
    badge: 'Popular',
    defaultBusinessName: 'The Olive Branch Bistro',
    defaultAgentName: 'Olive Branch Host AI',
    defaultAgentRole: 'Reservations & Event Coordinator',
    defaultTone: 'friendly',
    defaultDescription: 'Farm-to-table Mediterranean bistro offering casual dining, private party reservations, and corporate catering.',
    defaultServices: [
      { name: 'Table Reservation (2-6 Guests)', price: 'Complimentary', duration: 90, description: 'Guaranteed indoor or patio seating for lunch or dinner.' },
      { name: 'Large Party / Private Dining (7+)', price: '$50 Deposit per table', duration: 120, description: 'Dedicated dining room and customized family-style menu.' },
      { name: 'Catering & Event Package Inquiry', price: 'Custom Quote', duration: 30, description: 'Full-service catering consultation for weddings, parties, and office events.' },
    ],
    defaultHours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '22:30', closed: false },
      friday: { open: '11:00', close: '23:30', closed: false },
      saturday: { open: '10:00', close: '23:30', closed: false },
      sunday: { open: '10:00', close: '21:30', closed: false },
    },
    defaultServiceAreas: ['Downtown', 'Riverside', 'Delivery within 10 miles'],
    defaultFaqs: [
      { question: 'Do you have gluten-free and vegan options?', answer: 'Yes! We have extensive gluten-free pastas, dairy-free cheeses, and vegan specialties.' },
      { question: 'Can we bring our own wine (BYOB)?', answer: 'Yes, we have a $20 corkage fee per 750ml bottle.' },
    ],
    sampleTestMessage: 'Hi! Can I reserve a table for 4 this Friday at 7:30 PM on the patio?',
    sampleTestReply: 'Hi! We would love to host you this Friday! We have a lovely patio table available at 7:30 PM for 4 guests. May I please have your name and phone number to confirm your reservation?',
  },

  legal: {
    id: 'legal',
    name: 'Legal & Professional Services',
    icon: '⚖️',
    badge: 'Professional',
    defaultBusinessName: 'Sterling Law & Advisory',
    defaultAgentName: 'Sterling Intake Assistant',
    defaultAgentRole: 'Client Intake Specialist',
    defaultTone: 'formal',
    defaultDescription: 'Boutique law firm providing trusted counsel in business contracts, estate planning, real estate, and civil litigation.',
    defaultServices: [
      { name: 'Initial Case Consultation', price: '$150 Initial Consultation', duration: 45, description: 'Confidential review of your legal matter and actionable options.' },
      { name: 'Estate Planning & Will Review', price: '$450 Package', duration: 60, description: 'Will drafting, power of attorney, and healthcare directive preparation.' },
      { name: 'Business Contract Review', price: '$350 Flat Fee', duration: 60, description: 'Comprehensive risk assessment and redlining for commercial agreements.' },
    ],
    defaultHours: {
      monday: { open: '09:00', close: '17:30', closed: false },
      tuesday: { open: '09:00', close: '17:30', closed: false },
      wednesday: { open: '09:00', close: '17:30', closed: false },
      thursday: { open: '09:00', close: '17:30', closed: false },
      friday: { open: '09:00', close: '16:30', closed: false },
      saturday: { open: '00:00', close: '00:00', closed: true },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    defaultServiceAreas: ['Statewide Services', 'Metro Area'],
    defaultFaqs: [
      { question: 'Is this initial inquiry confidential?', answer: 'Yes, all communications with our firm are strictly confidential.' },
      { question: 'Do you offer virtual video consultations?', answer: 'Yes, we conduct consultations via Zoom, phone, or in our downtown office.' },
    ],
    sampleTestMessage: 'Hello, I need help reviewing a commercial lease agreement for a new office. How soon can an attorney look at it?',
    sampleTestReply: 'Good day. We can certainly assist you with your commercial lease review. We have consultation appointments available with an attorney tomorrow at 2:00 PM or Thursday at 10:00 AM. Which time works best for you?',
  },

  other: {
    id: 'other',
    name: 'Other Business / Custom',
    icon: '🏢',
    badge: 'Custom',
    defaultBusinessName: 'My Local Business',
    defaultAgentName: 'Business Assistant',
    defaultAgentRole: 'Customer Support & Sales Guide',
    defaultTone: 'friendly',
    defaultDescription: 'Providing quality service and fast customer responses for our clients.',
    defaultServices: [
      { name: 'Standard Consultation', price: '$99', duration: 60, description: 'Comprehensive consultation and customized plan.' },
      { name: 'Standard Service Package', price: '$199', duration: 90, description: 'Complete service delivery with warranty.' },
    ],
    defaultHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '15:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    defaultServiceAreas: ['Local Area', 'Citywide'],
    defaultFaqs: [
      { question: 'How can I reach your team?', answer: 'You can message us anytime here on WhatsApp or our website.' },
    ],
    sampleTestMessage: 'Hi! What services do you offer and how do I get started?',
    sampleTestReply: 'Hello! Thanks for reaching out. We offer customized consultations and service packages. May I know your name and what specific help you are looking for today?',
  },
};

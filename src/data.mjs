// Replace sample content here before accepting real appointments.
export const business = {
  name: 'Gladys Cosmetology Studio', stylist: 'Gladys Brito',
  instagram: 'https://www.instagram.com/gladyshairstyler/', handle: '@gladyshairstyler',
  phone: '+12125550148', phoneDisplay: '(212) 555-0148', email: 'hello@example.com',
  address: 'Studio address coming soon', locality: '', region: '', postalCode: '',
  locationConfirmed: false, contactConfirmed: false,
  hours: [['Tuesday – Friday', '9:00 am – 6:00 pm'], ['Saturday', '9:00 am – 5:00 pm'], ['Sunday – Monday', 'Closed']],
  deposit: 25, cancellationHours: 24,
  origin: 'https://abluepartyhat.github.io/Salon-Appointments',
  availabilityApiUrl: 'https://salon-booking-api.pino-raul2.workers.dev/api/availability',
  bookingApiUrl: 'https://salon-booking-api.pino-raul2.workers.dev/api/bookings',
};

// Temporary Phase 3.1 launch gate. Change only this source value after the
// controlled live test and review; browser storage and URL parameters cannot enable it.
export const bookingLaunch = Object.freeze({ submissionsEnabled: false });
export const services = [
  { id: 'bleaching-lightening', name: 'Bleaching / Lightening', shortName: 'Lightening', category: 'Color', price: 80, prices: { short: 80, medium: 90, long: 100 }, durations: { short: [90, 120], medium: [120, 150], long: [150, 210] }, description: 'Customized lightening planned around your hair history, condition, and desired result.', includes: 'Consultation, customized lightening plan, and finishing care.', addons: 'Final scope is confirmed during consultation.', featured: true },
  { id: 'anti-frizz-treatment', name: 'Anti-Frizz Treatment', shortName: 'Anti-Frizz', category: 'Treatments', price: 90, prices: { short: 90, medium: 90, long: 90 }, durations: { short: [60, 90], medium: [90, 120], long: [120, 150] }, description: 'A smoothing service designed to soften frizz and make everyday styling easier.', includes: 'Consultation, treatment application, and finished style.', addons: 'Aftercare is tailored to your hair.' },
  { id: 'partial-highlights', name: 'Partial Highlights', shortName: 'Partial Highlights', category: 'Highlights & Balayage', price: 80, prices: { short: 80, medium: 90, long: 100 }, durations: { short: [60, 90], medium: [90, 120], long: [120, 150] }, description: 'Thoughtfully placed highlights for brightness around the face and crown.', includes: 'Consultation, partial highlight placement, and finishing care.', addons: 'Tone and finish are personalized.', featured: true },
  { id: 'full-highlights', name: 'Full Highlights', shortName: 'Full Highlights', category: 'Highlights & Balayage', price: 150, prices: { short: 150, medium: 200, long: 250 }, durations: { short: [120, 150], medium: [150, 180], long: [180, 240] }, description: 'Dimensional highlights placed throughout the hair for an all-over result.', includes: 'Consultation, full highlight placement, and finishing care.', addons: 'Tone and finish are personalized.' },
  { id: 'haircut', name: 'Haircut', shortName: 'Haircut', category: 'Haircuts', price: 35, prices: { short: 35, medium: 35, long: 35 }, durations: { short: [30, 45], medium: [45, 60], long: [45, 60] }, description: 'A personalized cut designed for your texture, routine, and preferred shape.', includes: 'Consultation, haircut, and finished style.', addons: 'Styling recommendations are included.', featured: true },
  { id: 'blowout', name: 'Blowout', shortName: 'Blowout', category: 'Styling', price: 25, prices: { short: 25, medium: 32.5, long: 40 }, durations: { short: [30, 45], medium: [45, 60], long: [60, 90] }, description: 'A polished blow-dry finish shaped to suit your look and occasion.', includes: 'Shampoo, blow-dry, and finishing products.', addons: 'Hot-tool finishing may be discussed.' },
  { id: 'formal-hairstyling-updo', name: 'Formal Hairstyling / Updo', shortName: 'Formal Styling', category: 'Updos', price: 60, prices: { short: 60, medium: 80, long: 100 }, durations: { short: [45, 60], medium: [60, 90], long: [90, 120] }, description: 'Event-ready styling shaped around your outfit, hair, and inspiration.', includes: 'Consultation and formal finished style.', addons: 'Bring inspiration and any accessories.' },
  { id: 'balayage', name: 'Balayage', shortName: 'Balayage', category: 'Highlights & Balayage', price: 250, prices: { short: 250, medium: 300, long: 350 }, durations: { short: [150, 180], medium: [180, 240], long: [240, 300] }, description: 'Hand-painted dimension customized for a soft, lived-in result.', includes: 'Consultation, customized balayage placement, and finishing care.', addons: 'Tone and finish are personalized.', featured: true },
  { id: 'root-color-touch-up', name: 'Root Color Touch-Up', shortName: 'Root Touch-Up', category: 'Color', price: 40, prices: { short: 40, medium: 40, long: 40 }, durations: { short: [60, 90], medium: [60, 90], long: [60, 90] }, description: 'A focused color refresh for new growth at the roots.', includes: 'Consultation, root color application, and finishing care.', addons: 'Color matching is confirmed before service.' },
  { id: 'full-hair-color', name: 'Full Hair Color', shortName: 'Full Color', category: 'Color', price: 80, prices: { short: 80, medium: 80, long: 80 }, durations: { short: [60, 90], medium: [90, 120], long: [120, 150] }, description: 'Single-process color applied through the full length of the hair.', includes: 'Consultation, full color application, and finishing care.', addons: 'Corrective color may require a separate plan.' },
  { id: 'ampoule-treatment', name: 'Ampoule Treatment', shortName: 'Ampoule Treatment', category: 'Treatments', price: 10, prices: { short: 10, medium: 10, long: 10 }, durations: { short: [15, 30], medium: [15, 30], long: [15, 30] }, description: 'A concentrated treatment available only with a regular service.', includes: 'Treatment application alongside your main service.', addons: 'Add-on only.', addOn: true },
  { id: 'hair-mask-treatment', name: 'Hair Mask Treatment', shortName: 'Hair Mask', category: 'Treatments', price: 10, prices: { short: 10, medium: 10, long: 10 }, durations: { short: [15, 30], medium: [15, 30], long: [15, 30] }, description: 'A conditioning mask available only with a regular service.', includes: 'Treatment application alongside your main service.', addons: 'Add-on only.', addOn: true },
  { id: 'hair-gloss', name: 'Hair Gloss', shortName: 'Hair Gloss', category: 'Color', price: 40, prices: { short: 40, medium: 40, long: 40 }, durations: { short: [30, 45], medium: [30, 45], long: [30, 45] }, description: 'A shine-enhancing gloss that refreshes tone and finish.', includes: 'Consultation, gloss application, and finishing care.', addons: 'Can be paired with another regular service.' },
];
for (const service of services) {
  const [minimum, maximum] = service.durations.short;
  service.duration = `${minimum}–${maximum} minutes estimated`;
}
export const categories = ['All', 'Haircuts', 'Color', 'Highlights & Balayage', 'Styling', 'Updos'];
const photo = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop`;
export const portfolio = [
  { id: 'layered-brunette-curls', title: 'Long Brunette Layers & Soft Curls', category: 'Haircuts', categories: ['Haircuts', 'Styling'], image: './assets/portfolio/01-long-layered-cut-soft-curls-dark-brunette.jpg', alt: 'Long layered dark brunette haircut styled with soft curls', position: 'center', tall: false },
  { id: 'blonde-highlighted-bob', title: 'Blunt Bob & Blonde Highlights', category: 'Haircuts', categories: ['Haircuts', 'Highlights & Balayage'], image: './assets/portfolio/02-blunt-bob-blonde-highlights.jpg', alt: 'Blunt bob haircut with dimensional blonde highlights', position: 'center', tall: true },
  { id: 'straight-blonde-balayage', title: 'Long Blonde Balayage', category: 'Highlights & Balayage', categories: ['Highlights & Balayage', 'Styling'], image: './assets/portfolio/03-long-straight-blonde-balayage.jpg', alt: 'Long straight hair with softly blended blonde balayage', position: 'center', tall: false },
  { id: 'highlighted-layers-blowout', title: 'Blonde Layers & Blowout', category: 'Highlights & Balayage', categories: ['Haircuts', 'Highlights & Balayage', 'Styling'], image: './assets/portfolio/04-long-layers-blonde-highlights-blowout.jpg', alt: 'Long layered haircut with blonde highlights and a smooth blowout', position: 'center', tall: false },
  { id: 'straight-blonde-highlights', title: 'Long Blonde Highlights', category: 'Highlights & Balayage', categories: ['Highlights & Balayage', 'Styling'], image: './assets/portfolio/05-long-straight-blonde-highlights.jpg', alt: 'Long straight hair with bright blonde highlights', position: 'center', tall: false },
  { id: 'medium-layers-blowout', title: 'Layered Blonde Blowout', category: 'Haircuts', categories: ['Haircuts', 'Styling'], image: './assets/portfolio/06-medium-layered-cut-blonde-blowout.jpg', alt: 'Medium-length layered blonde haircut styled in a polished blowout', position: 'center', tall: false },
  { id: 'ash-blonde-bob', title: 'Ash Blonde Highlighted Bob', category: 'Highlights & Balayage', categories: ['Haircuts', 'Color', 'Highlights & Balayage'], image: './assets/portfolio/07-blunt-bob-ash-blonde-highlights.jpg', alt: 'Blunt bob haircut with cool ash blonde highlights', position: 'center', tall: true },
  { id: 'curly-brunette-layers', title: 'Curly Brunette Layers', category: 'Haircuts', categories: ['Haircuts', 'Styling'], image: './assets/portfolio/08-medium-curly-layered-cut-brunette.jpg', alt: 'Medium brunette layered haircut styled with defined curls', position: 'center', tall: false },
  { id: 'half-up-highlighted-curls', title: 'Half-Up Highlighted Curls', category: 'Updos', categories: ['Highlights & Balayage', 'Styling', 'Updos'], image: './assets/portfolio/09-half-up-curly-style-brunette-highlights.jpg', alt: 'Half-up curly brunette hairstyle with dimensional highlights', position: 'center', tall: true },
  { id: 'formal-low-bun', title: 'Formal Low Bun', category: 'Updos', categories: ['Styling', 'Updos'], image: './assets/portfolio/10-low-bun-formal-updo.jpg', alt: 'Polished formal low bun updo', position: 'center', tall: true },
  { id: 'sleek-auburn-color', title: 'Sleek Auburn Color', category: 'Color', categories: ['Color', 'Styling'], image: './assets/portfolio/11-long-sleek-straight-auburn-color.jpg', alt: 'Long sleek straight hair with rich auburn color', position: 'center', tall: false },
  { id: 'black-layers-loose-curls', title: 'Long Black Layers & Loose Curls', category: 'Haircuts', categories: ['Haircuts', 'Styling'], image: './assets/portfolio/12-long-layered-black-hair-loose-curls.jpg', alt: 'Long layered black haircut styled with loose curls', position: 'center', tall: true },
  { id: 'platinum-lob-waves', title: 'Platinum Lob & Beach Waves', category: 'Color', categories: ['Haircuts', 'Color', 'Styling'], image: './assets/portfolio/13-platinum-blonde-lob-beach-waves.jpg', alt: 'Platinum blonde lob haircut styled with soft beach waves', position: 'center', tall: true },
];
export const heroImage = photo('13543276');
export const portraitImage = 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop';
export const testimonials = [
  { quote: 'For the first time, my hair feels completely like me. The color is so natural, and Gladys made the whole experience feel special.', name: 'Sofia M.' },
  { quote: 'She really listens. I came in with an idea and left with something even more beautiful—and hair that feels so healthy.', name: 'Isabella R.' },
  { quote: 'The kind of stylist you stay with for years. Thoughtful, talented, and always so welcoming. I look forward to every visit.', name: 'Maria L.' },
];
export const faqs = [
  ['How do cancellations and rescheduling work?', 'Please cancel or reschedule at least 24 hours before your appointment. Under this sample policy, your deposit can transfer to a new date with sufficient notice. Contact the studio directly for changes.'],
  ['Is a deposit required?', 'The proposed minimum deposit is $25, applied toward your service total. Your final service and deposit will be confirmed before payment. This preview does not collect any payment.'],
  ['What happens if I miss my appointment?', 'Under the proposed policy, no-shows and cancellations within 24 hours forfeit the deposit. A new deposit may be needed to reserve another appointment.'],
  ['What if I’m running late?', 'Please let the studio know as soon as possible. Arrivals more than 15 minutes late may need a shorter service or a new appointment to respect the next client’s time.'],
  ['May I bring a guest or my children?', 'To keep the studio calm and comfortable, please come on your own unless a guest is needed for accessibility or support. Children should attend only when booked for their own service; please arrange this in advance.'],
  ['Can I book hair extensions online?', 'Start with a consultation. We’ll discuss your hair health, desired length, method, maintenance, and a personalized estimate before scheduling installation.'],
  ['What should I book for a color correction?', 'Please book a consultation first, especially after box dye, bleach, henna, or a previous color correction. A strand test and multiple sessions may be needed.'],
  ['What is the service adjustment or refund policy?', 'Please contact the studio within seven days if something does not feel right. Gladys will discuss the result with you and arrange an assessment. Adjustment and refund terms will be confirmed before your service.'],
  ['Which payment methods are accepted?', 'Planned options include major credit and debit cards and cash. Accepted methods will be confirmed when the studio’s booking and payment provider is connected.'],
  ['How far ahead can I plan?', 'Choose a date in the booking form to check the studio’s live availability. The booking system controls how far ahead dates are offered. Selecting a time does not reserve it; requests remain Pending until approved.'],
];
export const pageMeta = {
  home: ['Gladys Brito · Beautiful Hair, Thoughtfully Created', 'Discover Gladys Cosmetology Studio. Personalized balayage, highlights, haircuts, color, styling, and treatments with hairstylist Gladys Brito.'],
  services: ['Hair Services & Pricing · Gladys Cosmetology Studio', 'Explore balayage, highlights, haircuts, color, styling, and treatments with prices by hair length.'],
  portfolio: ['Hair Portfolio · Balayage, Color & Cuts · Gladys Studio', 'Explore inspiration for balayage, highlights, haircuts, extensions, and styling in Gladys Cosmetology Studio’s visual portfolio.'],
  about: ['Meet Gladys Brito · Your Independent Hairstylist', 'Meet Gladys Brito, a Cuban-born hairstylist with over 20 years of experience creating healthy hair, personal color, and effortless style.'],
  'new-clients': ['New Clients & Salon Policies · Gladys Studio', 'Your first visit, made simple. Learn about consultations, preparation, deposits, salon policies, and booking your first appointment with Gladys.'],
  contact: ['Contact & Studio Information · Gladys Cosmetology Studio', 'Plan your visit to Gladys Cosmetology Studio. Find studio contact details, appointment hours, parking, and accessibility information.'],
  book: ['Request a Hair Appointment · Gladys Cosmetology Studio', 'Request a personalized hair appointment with Gladys Brito. Choose services, hair length, a date, and a live available start time.'],
};

// Replace sample content here before accepting real appointments.
export const business = {
  name: 'Gladys Cosmetology Studio', stylist: 'Gladys Brito',
  instagram: 'https://www.instagram.com/gladyshairstyler/', handle: '@gladyshairstyler',
  phone: '+12125550148', phoneDisplay: '(212) 555-0148', email: 'hello@example.com',
  address: 'Studio address coming soon', locality: '', region: '', postalCode: '',
  locationConfirmed: false, contactConfirmed: false,
  hours: [['Tuesday – Friday', '9:00 am – 6:00 pm'], ['Saturday', '9:00 am – 5:00 pm'], ['Sunday – Monday', 'Closed']],
  deposit: 25, cancellationHours: 24,
  origin: 'https://gladys-cosmetology-studio.rapino.chatgpt.site',
  bookingProviderUrl: '',
  bookingApiBaseUrl: '/api',
};
export const services = [
  { id: 'balayage', name: 'Signature Balayage', shortName: 'Balayage', price: 180, duration: '2.5–3.5 hours', minutes: 210, category: 'Color', description: 'Soft ribbons of light, painted just for you. Effortless dimension that grows out beautifully.', includes: 'Personal consultation, custom hand-painted color, toner, wash, and signature blow-dry.', addons: 'Bond-building treatment +$30 · Haircut +$45', featured: true },
  { id: 'highlights', name: 'Dimensional Highlights', shortName: 'Highlights', price: 150, duration: '2–3 hours', minutes: 180, category: 'Color', description: 'A little brightness. A whole new feeling. Thoughtfully placed highlights for natural-looking radiance.', includes: 'Consultation, partial foils, customized toner, wash, and blow-dry.', addons: 'Full head of highlights +$50 · Deep conditioning +$25', featured: true },
  { id: 'haircut', name: 'The Signature Cut', shortName: 'Haircuts', price: 65, duration: '45–60 minutes', minutes: 60, category: 'Cut & style', description: 'Beautiful shape, soft movement, and a cut that works with your hair—and your everyday life.', includes: 'Consultation, relaxing shampoo, precision haircut, and a finished style.', addons: 'Scalp treatment +$25 · Deep conditioning +$25', featured: true },
  { id: 'extensions', name: 'Seamless Extensions', shortName: 'Extensions', price: 250, duration: '2–4 hours', minutes: 240, category: 'Extensions', description: 'The fullness you love. The length you dream of. Beautifully blended for a finish that feels like you.', includes: 'Consultation-led installation, custom blending, and aftercare guidance. Hair is priced separately.', addons: 'Hair and maintenance quoted at consultation', featured: true, consultation: true },
  { id: 'color', name: 'Color & Gloss', shortName: 'Color & Gloss', price: 95, duration: '1.5–2 hours', minutes: 120, category: 'Color', description: 'Rich color, luminous shine, and a refresh that brings your hair back to life.', includes: 'Consultation, single-process root color or gloss, shampoo, and blow-dry.', addons: 'All-over color +$35 · Bond-building treatment +$30' },
  { id: 'styling', name: 'The Finishing Touch', shortName: 'Styling', price: 55, duration: '45–60 minutes', minutes: 60, category: 'Cut & style', description: 'From softly sculpted waves to an occasion-worthy finish. A little extra beautiful.', includes: 'Shampoo, blow-dry, and hot-tool styling.', addons: 'Special occasion updo from +$40' },
  { id: 'consultation', name: 'Let’s Talk Hair', shortName: 'Consultation', price: 25, duration: '30 minutes', minutes: 30, category: 'Consultation', description: 'A thoughtful conversation about your hair history, inspiration, and what is possible. Required for extensions and color corrections.', includes: 'Hair and scalp assessment, strand test if needed, personalized service plan, and estimate.', addons: 'Consultation fee credited toward a booked service' },
];
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
  ['How far ahead can I book?', 'This booking preview shows sample appointments up to 60 days ahead. Live availability and the booking window will be set by the studio when online booking opens.'],
];
export const pageMeta = {
  home: ['Gladys Brito · Beautiful Hair, Thoughtfully Created', 'Discover Gladys Cosmetology Studio. Personalized balayage, highlights, haircuts, and extensions with hairstylist Gladys Brito and 20+ years of experience.'],
  services: ['Hair Services & Pricing · Gladys Cosmetology Studio', 'Explore custom balayage, dimensional highlights, haircuts, color, styling, and hair extensions. View starting prices and plan your appointment with Gladys.'],
  portfolio: ['Hair Portfolio · Balayage, Color & Cuts · Gladys Studio', 'Explore inspiration for balayage, highlights, haircuts, extensions, and styling in Gladys Cosmetology Studio’s visual portfolio.'],
  about: ['Meet Gladys Brito · Your Independent Hairstylist', 'Meet Gladys Brito, a Cuban-born hairstylist with over 20 years of experience creating healthy hair, personal color, and effortless style.'],
  'new-clients': ['New Clients & Salon Policies · Gladys Studio', 'Your first visit, made simple. Learn about consultations, preparation, deposits, salon policies, and booking your first appointment with Gladys.'],
  contact: ['Contact & Studio Information · Gladys Cosmetology Studio', 'Plan your visit to Gladys Cosmetology Studio. Find studio contact details, appointment hours, parking, and accessibility information.'],
  book: ['Book a Hair Appointment · Gladys Cosmetology Studio', 'Plan a personalized hair appointment with Gladys Brito. Choose a service, date, and time in our online booking preview.'],
};

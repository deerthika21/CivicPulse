import type { Category, Language, Sentiment } from '../constants/taxonomy.js';

export const AREAS = {
  'T Nagar': [13.0418, 80.2341],
  Adyar: [13.0067, 80.257],
  Velachery: [12.9815, 80.218],
  'Anna Nagar': [13.085, 80.2101],
  Mylapore: [13.0339, 80.2619],
  Tambaram: [12.9249, 80.1],
  Porur: [13.0382, 80.1565],
  Guindy: [13.0067, 80.2206],
  Kodambakkam: [13.0521, 80.2255],
  Perambur: [13.121, 80.2329],
  Royapettah: [13.0544, 80.264],
  Saidapet: [13.0213, 80.2231],
  Nungambakkam: [13.0569, 80.2425],
  Egmore: [13.0732, 80.2609],
  Sholinganallur: [12.901, 80.2279],
  'Besant Nagar': [12.9986, 80.2665],
  Chromepet: [12.9516, 80.1462],
  Tondiarpet: [13.126, 80.288],
  'Ashok Nagar': [13.0359, 80.2122],
  Villivakkam: [13.1076, 80.2063],
} as const satisfies Record<string, readonly [number, number]>;
export type Area = keyof typeof AREAS;

export interface SeedComplaint {
  area: Area;
  /** metres north / east of the area centre */
  offset?: [number, number];
  hint: string;
  text: string;
  lang: Language;
  tr: string;
  cat: Category;
  p: 1 | 2 | 3 | 4 | 5;
  why: string;
  sum: string;
  sent: Sentiment;
  /** hours before "now" the complaint was filed */
  ago: number;
  spam?: string;
  name?: string;
  /** explicit end state for the resulting issue (otherwise derived from age) */
  outcome?: 'open' | 'in_progress' | 'resolved' | 'rejected';
}

const D = 24;

export const SEED_COMPLAINTS: SeedComplaint[] = [
  // ---------- Cluster: Velachery flooding (3 reports, P5) ----------
  {
    area: 'Velachery', hint: 'Vijayanagar Bus Stop, Velachery Main Road, Velachery', lang: 'English', cat: 'Drainage & Sewage', p: 5, sent: 'angry', ago: 20,
    text: "Velachery main road near Vijayanagar bus stop is flooded knee deep after last night's rain. Two wheelers are stalling and an open drain is hidden under the water. Very dangerous!",
    tr: 'Velachery main road near Vijayanagar bus stop is flooded knee deep after rain. Two wheelers are stalling and the open drain is hidden under the water.',
    sum: 'Knee-deep flooding on Velachery Main Road near Vijayanagar bus stop hides an open drain; vehicles stalling.',
    why: 'Flooded road concealing an open drain is a direct danger to life.', outcome: 'in_progress',
  },
  {
    area: 'Velachery', offset: [60, 20], hint: 'Vijayanagar Bus Stop, Velachery', lang: 'Tamil', cat: 'Drainage & Sewage', p: 5, sent: 'frustrated', ago: 18,
    text: 'விஜயநகர் பஸ் ஸ்டாப் அருகே வேளச்சேரி மெயின் ரோட்டில் முழங்கால் அளவு தண்ணீர் தேங்கி உள்ளது. டூ வீலர்கள் நின்று போகின்றன. சாக்கடை திறந்து கிடக்கிறது.',
    tr: 'Velachery main road near Vijayanagar bus stop is flooded knee deep. Two wheelers are stalling in the water and the drain is open.',
    sum: 'Knee-deep flooding on Velachery Main Road near Vijayanagar bus stop; open drain, vehicles stalling.',
    why: 'Waterlogging with an open drain on a main road is a danger to life.',
  },
  {
    area: 'Velachery', offset: [-90, 70], hint: 'Vijayanagar Bus Stop, Velachery', lang: 'Tanglish', cat: 'Drainage & Sewage', p: 5, sent: 'angry', ago: 15,
    text: 'Velachery main road Vijayanagar bus stop kitta knee level thanni nikkudhu, bike ellam off aagudhu, drain open ah iruku theriyave illa. Yaarum varala!',
    tr: 'Velachery main road near Vijayanagar bus stop is flooded knee deep, two wheelers are stalling and the open drain is hidden under the water. Nobody has come.',
    sum: 'Knee-deep flooding on Velachery Main Road near Vijayanagar bus stop; hidden open drain, vehicles stalling.',
    why: 'Hidden open drain under floodwater is a danger to life.',
  },

  // ---------- Cluster: T Nagar garbage (5 reports → community escalation P3→P4) ----------
  {
    area: 'T Nagar', hint: 'Ranganathan Street entrance, T Nagar', lang: 'English', cat: 'Garbage & Sanitation', p: 3, sent: 'frustrated', ago: 4 * D,
    text: 'Garbage bin overflowing near Ranganathan Street entrance, T Nagar. Not cleared for 4 days, stinking and stray dogs are spreading the waste across the road.',
    tr: 'Garbage bin overflowing near Ranganathan Street entrance, T Nagar. Not cleared for 4 days, stinking and stray dogs are spreading the waste across the road.',
    sum: 'Overflowing garbage bin at Ranganathan Street entrance, T Nagar, uncleared for 4 days; dogs spreading waste.',
    why: 'Uncleared garbage in a crowded market street is a significant inconvenience and hygiene concern.',
  },
  {
    area: 'T Nagar', offset: [40, -30], hint: 'Ranganathan Street, T Nagar', lang: 'Tanglish', cat: 'Garbage & Sanitation', p: 3, sent: 'angry', ago: 3.5 * D,
    text: 'Ranganathan street entrance la kuppai thotti full ah overflow aagudhu, 4 naal ah clear pannala, naai ellam kizhichu road full ah podudhu. Smell thaanga mudiyala',
    tr: 'Garbage bin overflowing near Ranganathan Street entrance, not cleared for 4 days, stray dogs are spreading the waste across the road and it is stinking.',
    sum: 'Overflowing garbage bin at Ranganathan Street entrance, T Nagar, uncleared for 4 days; dogs spreading waste.',
    why: 'Uncleared garbage in a busy street is a significant inconvenience.',
  },
  {
    area: 'T Nagar', offset: [-50, 20], hint: 'Ranganathan Street, T Nagar', lang: 'Tamil', cat: 'Garbage & Sanitation', p: 3, sent: 'frustrated', ago: 3 * D,
    text: 'ரங்கநாதன் தெரு நுழைவாயிலில் குப்பைத் தொட்டி நிரம்பி வழிகிறது. 4 நாட்களாக அகற்றவில்லை. நாய்கள் குப்பையை சாலை முழுவதும் பரப்புகின்றன.',
    tr: 'Garbage bin overflowing at Ranganathan Street entrance, T Nagar. Not cleared for 4 days. Stray dogs are spreading the waste across the road.',
    sum: 'Overflowing garbage bin at Ranganathan Street entrance, T Nagar, uncleared for 4 days; dogs spreading waste.',
    why: 'Uncleared garbage in a crowded street is a significant inconvenience.',
  },
  {
    area: 'T Nagar', offset: [25, 45], hint: 'Ranganathan Street, T Nagar', lang: 'Hindi', cat: 'Garbage & Sanitation', p: 3, sent: 'concerned', ago: 2 * D,
    text: 'रंगनाथन स्ट्रीट के प्रवेश द्वार पर कूड़ेदान 4 दिन से भरा पड़ा है, बदबू आ रही है और कुत्ते कूड़ा सड़क पर फैला रहे हैं।',
    tr: 'Garbage bin at Ranganathan Street entrance overflowing, not cleared for 4 days, stinking and stray dogs are spreading the waste on the road.',
    sum: 'Overflowing garbage bin at Ranganathan Street entrance, T Nagar, uncleared for 4 days; dogs spreading waste.',
    why: 'Uncleared garbage on a busy street is a significant inconvenience.',
  },
  {
    area: 'T Nagar', offset: [-20, -40], hint: 'Ranganathan Street, T Nagar', lang: 'English', cat: 'Garbage & Sanitation', p: 3, sent: 'angry', ago: 30,
    text: 'Still overflowing! Garbage bin at Ranganathan Street entrance T Nagar not cleared, stray dogs spreading waste across the road, stinking.',
    tr: 'Garbage bin overflowing at Ranganathan Street entrance, T Nagar, still not cleared, stray dogs are spreading the waste across the road and it is stinking.',
    sum: 'Overflowing garbage bin at Ranganathan Street entrance, T Nagar, still uncleared; dogs spreading waste.',
    why: 'Repeated uncleared garbage on a busy street is a significant inconvenience.',
  },

  // ---------- Cluster: Adyar live wire (2 reports, P5) ----------
  {
    area: 'Adyar', hint: '2nd Main Road, Gandhi Nagar, Adyar', lang: 'English', cat: 'Streetlights & Electricity', p: 5, sent: 'concerned', ago: 6,
    text: 'Live electric wire hanging low from the pole on 2nd Main Road, Gandhi Nagar, Adyar. Sparks when the wind blows. School children walk here every morning!',
    tr: 'Live electric wire hanging low from the pole on 2nd Main Road, Gandhi Nagar, Adyar. Sparks when the wind blows. School children walk here every morning.',
    sum: 'Low-hanging sparking live wire on 2nd Main Road, Gandhi Nagar, Adyar, on a school children route.',
    why: 'Exposed live wire on a school route is an immediate danger to life.',
  },
  {
    area: 'Adyar', offset: [35, -25], hint: 'Gandhi Nagar, Adyar', lang: 'Tamil', cat: 'Streetlights & Electricity', p: 5, sent: 'concerned', ago: 4,
    text: 'அடையார் காந்தி நகர் 2வது மெயின் ரோட்டில் மின் கம்பத்தில் இருந்து கரண்ட் வயர் தாழ்வாக தொங்குகிறது. காற்று அடித்தால் தீப்பொறி வருகிறது. பள்ளி குழந்தைகள் நடக்கும் வழி.',
    tr: 'Live electric wire hanging low from the pole on 2nd Main Road, Gandhi Nagar, Adyar. Sparks when the wind blows. School children walk on this road.',
    sum: 'Low-hanging sparking live wire on 2nd Main Road, Gandhi Nagar, Adyar, on a school children route.',
    why: 'Exposed sparking wire on a school route is a danger to life.',
  },

  // ---------- Cluster: Tondiarpet open manhole (2 reports, P5) ----------
  {
    area: 'Tondiarpet', hint: 'Tondiarpet High Road, near fish market, Tondiarpet', lang: 'English', cat: 'Drainage & Sewage', p: 5, sent: 'angry', ago: 2 * D,
    text: 'Open manhole without lid on Tondiarpet High Road near the fish market. No barricade. Someone will fall in at night!',
    tr: 'Open manhole without lid on Tondiarpet High Road near the fish market. No barricade. Someone will fall in at night.',
    sum: 'Uncovered, unbarricaded manhole on Tondiarpet High Road near the fish market.',
    why: 'An open manhole on a busy road is a danger to life.', outcome: 'in_progress',
  },
  {
    area: 'Tondiarpet', offset: [30, 30], hint: 'Fish market, Tondiarpet', lang: 'Tanglish', cat: 'Drainage & Sewage', p: 5, sent: 'concerned', ago: 1.5 * D,
    text: 'Tondiarpet High Road fish market kitta manhole moodi illama open ah iruku, barricade kooda illa, night la yaaravadhu vizhunthuduvanga',
    tr: 'Open manhole without lid on Tondiarpet High Road near the fish market, no barricade, someone will fall in at night.',
    sum: 'Uncovered, unbarricaded manhole on Tondiarpet High Road near the fish market.',
    why: 'Open manhole is a danger to life.',
  },

  // ---------- Cluster: OMR service road (2 reports) ----------
  {
    area: 'Sholinganallur', hint: 'OMR service road, Sholinganallur signal, Sholinganallur', lang: 'English', cat: 'Roads & Potholes', p: 4, sent: 'frustrated', ago: 5 * D,
    text: 'OMR service road near Sholinganallur signal is completely broken after metro work, huge craters. Two bikers fell this week.',
    tr: 'OMR service road near Sholinganallur signal is completely broken after metro work, huge craters. Two bikers fell this week.',
    sum: 'OMR service road at Sholinganallur signal broken with huge craters after metro work; two bikers fell.',
    why: 'Craters causing falls on a busy road are a safety risk to many commuters.',
  },
  {
    area: 'Sholinganallur', offset: [-60, 40], hint: 'Sholinganallur signal, Sholinganallur', lang: 'Tanglish', cat: 'Roads & Potholes', p: 4, sent: 'angry', ago: 4 * D,
    text: 'Sholinganallur signal OMR service road full ah broken, metro work aprom huge craters, intha week two bikers fell. Office poga mudiyala',
    tr: 'OMR service road near Sholinganallur signal is completely broken after metro work with huge craters; two bikers fell this week.',
    sum: 'OMR service road at Sholinganallur signal broken with huge craters after metro work; two bikers fell.',
    why: 'Road craters causing accidents are a safety risk to many.',
  },

  // ---------- Singles: recent & active ----------
  {
    area: 'Royapettah', hint: 'Westcott Road, Royapettah', lang: 'English', cat: 'Parks & Trees', p: 5, sent: 'concerned', ago: 10,
    text: 'Big tree fell on Westcott Road, Royapettah after the storm, blocking half the road and resting on power cables.',
    tr: 'Big tree fell on Westcott Road, Royapettah after the storm, blocking half the road and resting on power cables.',
    sum: 'Fallen tree blocking half of Westcott Road, Royapettah, resting on power cables.',
    why: 'Fallen tree on live power cables is a danger to life.',
  },
  {
    area: 'Mylapore', hint: 'Luz Corner, Mylapore', lang: 'Tamil', cat: 'Water Supply', p: 4, sent: 'concerned', ago: 28,
    text: 'மயிலாப்பூர் லஸ் கார்னர் பகுதியில் குழாய் தண்ணீர் சாக்கடை வாசனையுடன் கலங்கலாக வருகிறது. குழந்தைகளுக்கு வயிற்றுப்போக்கு ஏற்பட்டுள்ளது.',
    tr: 'Tap water in the Luz Corner area of Mylapore is muddy and smells of sewage. Children have developed diarrhoea.',
    sum: 'Sewage-contaminated muddy tap water at Luz Corner, Mylapore; children falling sick.',
    why: 'Contaminated drinking water causing illness is a health risk to many.',
  },
  {
    area: 'Tambaram', hint: 'Railway Station Road, Tambaram West', lang: 'Tanglish', cat: 'Streetlights & Electricity', p: 4, sent: 'concerned', ago: 2.5 * D, name: 'Priya',
    text: 'Tambaram West railway station road la 6 street lights 2 weeks ah eriyala, night la ponnunga nadakka bayapadranga. Please fix soon',
    tr: 'Six streetlights on Tambaram West railway station road have not worked for two weeks; women are afraid to walk at night.',
    sum: 'Six streetlights out for two weeks on Tambaram West railway station road; women feel unsafe.',
    why: 'Dark stretch near a station is a safety risk to many pedestrians.',
  },
  {
    area: 'Porur', hint: 'Porur Junction Bus Stand, Porur', lang: 'English', cat: 'Public Health', p: 4, sent: 'concerned', ago: 3 * D,
    text: 'Pack of stray dogs near Porur junction bus stand bit two people this week. Need the animal birth control team urgently.',
    tr: 'Pack of stray dogs near Porur junction bus stand bit two people this week. Need the animal birth control team urgently.',
    sum: 'Stray dog pack at Porur junction bus stand bit two people this week.',
    why: 'Dog bites at a busy bus stand are a health risk to many.',
  },
  {
    area: 'Perambur', hint: 'Paper Mills Road, Perambur', lang: 'Tamil', cat: 'Drainage & Sewage', p: 4, sent: 'frustrated', ago: 36,
    text: 'பெரம்பூர் பேப்பர் மில்ஸ் சாலையில் பாதாள சாக்கடை நிரம்பி தெருவில் ஓடுகிறது. மூன்று நாட்களாக இப்படியே இருக்கிறது.',
    tr: 'Underground sewage is overflowing onto the street on Paper Mills Road, Perambur. It has been like this for three days.',
    sum: 'Underground sewage overflowing onto Paper Mills Road, Perambur, for three days.',
    why: 'Raw sewage on a residential street is a health risk to many.',
  },
  {
    area: 'Ashok Nagar', hint: '11th Avenue, Ashok Nagar', lang: 'Tanglish', cat: 'Roads & Potholes', p: 4, sent: 'angry', ago: 2 * D,
    text: 'Ashok Nagar 11th Avenue la periya pallam, nethu oru auto kavunthuduchu. Innum yaarum paakala',
    tr: 'Big pothole on 11th Avenue, Ashok Nagar; an auto rickshaw overturned in it yesterday. Nobody has inspected it yet.',
    sum: 'Large pothole on 11th Avenue, Ashok Nagar caused an auto rickshaw to overturn.',
    why: 'Pothole already caused an accident; safety risk to many road users.',
  },
  {
    area: 'Chromepet', hint: 'GST Road bus depot, Chromepet', lang: 'English', cat: 'Public Health', p: 4, sent: 'concerned', ago: 5 * D,
    text: 'Stagnant water in the empty plot next to Chromepet GST road bus depot is breeding mosquitoes. Three dengue cases in our street already.',
    tr: 'Stagnant water in the empty plot next to Chromepet GST road bus depot is breeding mosquitoes. Three dengue cases in our street already.',
    sum: 'Mosquito-breeding stagnant water near Chromepet GST Road bus depot; three dengue cases nearby.',
    why: 'Dengue cluster from mosquito breeding is a health risk to many.',
  },
  {
    area: 'Saidapet', hint: 'Jones Road, Saidapet West', lang: 'Tanglish', cat: 'Water Supply', p: 3, sent: 'frustrated', ago: 26,
    text: 'Saidapet West Jones Road la 5 days ah metro water varala, lorry kooda varala. Kudikka thanni illa',
    tr: 'No Metro water supply on Jones Road, Saidapet West for 5 days; the water lorry has also not come. No drinking water.',
    sum: 'No Metro water supply or lorry for 5 days on Jones Road, Saidapet West.',
    why: 'Prolonged loss of water supply is a significant inconvenience.',
  },
  {
    area: 'Anna Nagar', hint: 'Tower Park gate, 2nd Avenue, Anna Nagar', lang: 'English', cat: 'Roads & Potholes', p: 3, sent: 'neutral', ago: 3 * D,
    text: 'Huge pothole in front of Anna Nagar Tower Park gate on 2nd Avenue. Bikes are swerving into traffic to avoid it.',
    tr: 'Huge pothole in front of Anna Nagar Tower Park gate on 2nd Avenue. Bikes are swerving into traffic to avoid it.',
    sum: 'Large pothole at Tower Park gate, 2nd Avenue, Anna Nagar forcing bikes into traffic.',
    why: 'Pothole on a main avenue is a significant inconvenience with some risk.',
  },
  {
    area: 'Guindy', hint: 'Kathipara bus stop, Guindy', lang: 'English', cat: 'Encroachment', p: 3, sent: 'frustrated', ago: 6 * D,
    text: 'Shops near Guindy Kathipara bus stop have extended onto the footpath. Pedestrians are forced to walk on the road with fast traffic.',
    tr: 'Shops near Guindy Kathipara bus stop have extended onto the footpath. Pedestrians are forced to walk on the road with fast traffic.',
    sum: 'Shops encroaching footpath at Kathipara bus stop, Guindy, pushing pedestrians onto the road.',
    why: 'Blocked footpath is a significant inconvenience with pedestrian risk.',
  },
  {
    area: 'Kodambakkam', hint: 'Kodambakkam High Road, Kodambakkam', lang: 'Hindi', cat: 'Noise & Pollution', p: 2, sent: 'frustrated', ago: 30,
    text: 'कोडंबक्कम हाई रोड पर शादी हॉल रात 12 बजे के बाद भी तेज़ लाउडस्पीकर बजाता है। बुज़ुर्ग सो नहीं पाते।',
    tr: 'A wedding hall on Kodambakkam High Road plays loud speakers after midnight. Elderly people cannot sleep.',
    sum: 'Wedding hall on Kodambakkam High Road using loudspeakers past midnight.',
    why: 'Night-time noise is a minor but recurring nuisance.',
  },
  {
    area: 'Egmore', hint: 'Gandhi Irwin Road, Egmore', lang: 'English', cat: 'Noise & Pollution', p: 3, sent: 'concerned', ago: 4 * D,
    text: 'People burning plastic waste every evening behind Egmore railway station on Gandhi Irwin Road. Thick smoke everywhere.',
    tr: 'People burning plastic waste every evening behind Egmore railway station on Gandhi Irwin Road. Thick smoke everywhere.',
    sum: 'Daily open burning of plastic waste behind Egmore station on Gandhi Irwin Road.',
    why: 'Toxic smoke is a significant inconvenience and health concern.',
  },
  {
    area: 'Villivakkam', hint: 'Sidco Nagar, Villivakkam', lang: 'Tamil', cat: 'Garbage & Sanitation', p: 3, sent: 'frustrated', ago: 2 * D,
    text: 'வில்லிவாக்கம் சிட்கோ நகரில் ஒரு வாரமாக குப்பை வண்டி வரவில்லை. வீடுகளில் குப்பை குவிந்துள்ளது.',
    tr: 'The garbage collection vehicle has not come to Sidco Nagar, Villivakkam for a week. Garbage is piling up at homes.',
    sum: 'No door-to-door garbage collection in Sidco Nagar, Villivakkam for a week.',
    why: 'Missed collection for a week is a significant inconvenience.',
  },
  {
    area: 'Nungambakkam', hint: 'Valluvar Kottam park, Nungambakkam', lang: 'English', cat: 'Parks & Trees', p: 1, sent: 'neutral', ago: 3 * D,
    text: 'Swings in the Valluvar Kottam park are rusty and the paint is peeling. Please repaint them before the holidays.',
    tr: 'Swings in the Valluvar Kottam park are rusty and the paint is peeling. Please repaint them before the holidays.',
    sum: 'Rusty swings with peeling paint at Valluvar Kottam park, Nungambakkam.',
    why: 'Cosmetic maintenance request.',
  },
  {
    area: 'Besant Nagar', hint: "Elliot's Beach promenade, Besant Nagar", lang: 'English', cat: 'Garbage & Sanitation', p: 1, sent: 'positive', ago: 2 * D,
    text: "Lovely clean-up at Elliot's Beach last week! Suggestion: please add more dustbins along the promenade.",
    tr: "Lovely clean-up at Elliot's Beach last week! Suggestion: please add more dustbins along the promenade.",
    sum: "Suggestion to add more dustbins along Elliot's Beach promenade, Besant Nagar.",
    why: 'Suggestion, no immediate problem.',
  },
  {
    area: 'Mylapore', offset: [300, -400], hint: 'North Mada Street, Mylapore', lang: 'Tamil', cat: 'Encroachment', p: 2, sent: 'neutral', ago: 5 * D,
    text: 'கபாலீஸ்வரர் கோவில் வடக்கு மாட வீதியில் தள்ளுவண்டி கடைகள் சாலையை அடைத்துள்ளன.',
    tr: 'Pushcart vendors are blocking the road on North Mada Street near Kapaleeshwarar temple.',
    sum: 'Pushcart vendors blocking North Mada Street near Kapaleeshwarar temple, Mylapore.',
    why: 'Partial obstruction, minor inconvenience.',
  },
  {
    area: 'Anna Nagar', offset: [-500, -300], hint: '3rd Main Road, Anna Nagar West', lang: 'English', cat: 'Water Supply', p: 3, sent: 'concerned', ago: 7 * D,
    text: 'Drinking water pipeline leaking on 3rd Main Road, Anna Nagar West. Clean water has been wasting for 3 days.',
    tr: 'Drinking water pipeline leaking on 3rd Main Road, Anna Nagar West. Clean water has been wasting for 3 days.',
    sum: 'Drinking water pipeline leaking for three days on 3rd Main Road, Anna Nagar West.',
    why: 'Water wastage and supply loss is a significant inconvenience.',
  },
  {
    area: 'T Nagar', offset: [-700, 500], hint: 'Pondy Bazaar, T Nagar', lang: 'Tanglish', cat: 'Streetlights & Electricity', p: 3, sent: 'neutral', ago: 6 * D,
    text: 'Pondy Bazaar pedestrian plaza la 3 lights eriyala, night shopping time la full dark',
    tr: 'Three lights in the Pondy Bazaar pedestrian plaza are not working; it is completely dark during night shopping hours.',
    sum: 'Three lights out in Pondy Bazaar pedestrian plaza, T Nagar.',
    why: 'Dark public plaza is a significant inconvenience.',
  },
  {
    area: 'Adyar', offset: [-600, 900], hint: 'Adyar Bus Depot, Adyar', lang: 'English', cat: 'Other', p: 1, sent: 'neutral', ago: 8 * D,
    text: 'The new bus shelter near Adyar depot has no name board. Visitors get confused.',
    tr: 'The new bus shelter near Adyar depot has no name board. Visitors get confused.',
    sum: 'Bus shelter near Adyar depot lacks a name board.',
    why: 'Cosmetic suggestion.',
  },

  // ---------- Spam (stored, never reaches a queue) ----------
  {
    area: 'Guindy', hint: '', lang: 'English', cat: 'Other', p: 1, sent: 'neutral', ago: 2 * D, spam: 'Advertisement, no civic issue.',
    text: 'Instant gold loan at lowest interest!!! Call 98400 00000 now, limited offer',
    tr: 'Instant gold loan at lowest interest! Call 98400 00000 now, limited offer.',
    sum: 'Gold loan advertisement.', why: 'Spam.',
  },
  {
    area: 'Egmore', hint: '', lang: 'Tanglish', cat: 'Other', p: 1, sent: 'neutral', ago: 26, spam: 'Test message with no complaint.',
    text: 'test test hello machi app work aagudha',
    tr: 'Test test, hello friend, is the app working?',
    sum: 'Test message.', why: 'Spam.',
  },

  // ---------- Older history (mostly resolved; feeds analytics) ----------
  ...(
    [
      ['Velachery', 'Garbage & Sanitation', 3, 'Garbage dumped on the Velachery lake bund road near Taramani link road.', 'Velachery lake bund road, Velachery', 9],
      ['Adyar', 'Drainage & Sewage', 4, 'Storm water drain on LB Road, Adyar is blocked with silt; water enters houses when it rains.', 'LB Road, Adyar', 10],
      ['Guindy', 'Noise & Pollution', 3, 'Black smoke from a factory chimney in Guindy Industrial Estate every night.', 'Guindy Industrial Estate, Guindy', 11],
      ['Kodambakkam', 'Roads & Potholes', 3, 'Speed breaker on Arcot Road, Kodambakkam has no paint markings; vehicles jump on it.', 'Arcot Road, Kodambakkam', 12],
      ['Perambur', 'Water Supply', 3, 'Low water pressure for a week on Perambur Barracks Road.', 'Perambur Barracks Road, Perambur', 13],
      ['Porur', 'Streetlights & Electricity', 3, 'Streetlights on Porur lake road off for ten days.', 'Porur lake road, Porur', 14],
      ['Mylapore', 'Garbage & Sanitation', 2, 'Public toilet near Mylapore tank is dirty and has no water.', 'Mylapore tank, Mylapore', 15],
      ['Egmore', 'Roads & Potholes', 4, 'Deep pothole on Pantheon Road, Egmore near the museum; a scooter rider was injured.', 'Pantheon Road, Egmore', 16],
      ['Saidapet', 'Drainage & Sewage', 3, 'Sewage smell from the canal behind Saidapet market is unbearable.', 'Saidapet market, Saidapet', 17],
      ['Tambaram', 'Public Health', 3, 'Meat shops near Tambaram market dump waste on the road, attracting flies.', 'Tambaram market, Tambaram', 18],
      ['Royapettah', 'Encroachment', 2, 'Two-wheeler showroom parks vehicles on the footpath on Royapettah High Road.', 'Royapettah High Road, Royapettah', 19],
      ['Anna Nagar', 'Parks & Trees', 2, 'Overgrown tree branches blocking the streetlight on 6th Avenue, Anna Nagar.', '6th Avenue, Anna Nagar', 20],
      ['Besant Nagar', 'Garbage & Sanitation', 3, 'Garbage piled near the Besant Nagar bus terminus for three days.', 'Bus terminus, Besant Nagar', 21],
      ['Chromepet', 'Water Supply', 4, 'Muddy and smelly water in taps across Chromepet Radha Nagar; several people ill.', 'Radha Nagar, Chromepet', 22],
      ['Sholinganallur', 'Streetlights & Electricity', 3, 'Streetlights not working on the Sholinganallur-Medavakkam link road.', 'Medavakkam link road, Sholinganallur', 23],
      ['Nungambakkam', 'Roads & Potholes', 2, 'Uneven road patch on Khader Nawaz Khan Road after cable work.', 'Khader Nawaz Khan Road, Nungambakkam', 24],
      ['Villivakkam', 'Drainage & Sewage', 4, 'Sewage mixing with rainwater near Villivakkam railway subway; subway flooded.', 'Railway subway, Villivakkam', 25],
      ['T Nagar', 'Noise & Pollution', 2, 'Constant horn noise and loudspeaker ads from shops on Usman Road.', 'Usman Road, T Nagar', 26],
      ['Ashok Nagar', 'Public Health', 3, 'Many mosquitoes near the Ashok Nagar canal; fogging not done for a month.', 'Ashok Nagar canal, Ashok Nagar', 27],
      ['Tondiarpet', 'Garbage & Sanitation', 3, 'Garbage not collected near Tondiarpet fishing harbour road.', 'Fishing harbour road, Tondiarpet', 28],
      ['Perambur', 'Roads & Potholes', 3, 'Potholes all along Perambur High Road after rain.', 'Perambur High Road, Perambur', 8],
      ['Guindy', 'Parks & Trees', 2, 'Dry leaves and broken benches in the Guindy children park.', 'Children park, Guindy', 9],
    ] as const
  ).map(
    ([area, cat, p, text, hint, days], i): SeedComplaint => ({
      area,
      offset: [((i * 137) % 400) - 200, ((i * 211) % 400) - 200],
      hint,
      lang: 'English',
      cat,
      p,
      sent: p >= 4 ? 'concerned' : 'frustrated',
      ago: days * D + (i % 5) * 3,
      text,
      tr: text,
      sum: text.split(' ').slice(0, 18).join(' ').replace(/[.;,]$/, ''),
      why: p >= 4 ? 'Health/safety risk to many residents.' : p === 3 ? 'Significant inconvenience to residents.' : 'Minor inconvenience.',
      outcome: i % 6 === 5 ? 'rejected' : i % 7 === 3 ? 'in_progress' : 'resolved',
    }),
  ),
];

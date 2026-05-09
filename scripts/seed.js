require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Business = require('../models/Business');
const Match = require('../models/Match');
const Message = require('../models/Message');

const businesses = [
  {
    name: 'FreshFarm Organics',
    owner_email: 'freshfarm@demo.com',
    address: 'Pune, Maharashtra, India',
    location: { type: 'Point', coordinates: [73.8567, 18.5204] },
    services: ['organic vegetables', 'bulk produce supply', 'farm-to-table delivery'],
    challenges: ['need eco-friendly packaging for vegetables', 'looking for cold storage logistics partner'],
    ai_tags: {
      category: 'Agriculture > Organic Farming',
      solution_keywords: ['organic produce', 'vegetables', 'farm supply', 'bulk food', 'fresh produce'],
      problem_keywords: ['eco packaging', 'cold storage', 'logistics', 'packaging materials']
    }
  },
  {
    name: 'GreenPack Co.',
    owner_email: 'greenpack@demo.com',
    address: 'Mumbai, Maharashtra, India',
    location: { type: 'Point', coordinates: [72.8777, 19.0760] },
    services: ['biodegradable packaging', 'eco-friendly boxes', 'custom packaging design', 'bulk packaging supply'],
    challenges: ['need steady supply of organic raw material for packaging', 'looking for distribution partners'],
    ai_tags: {
      category: 'Manufacturing > Packaging',
      solution_keywords: ['eco packaging', 'biodegradable', 'packaging materials', 'green packaging', 'sustainable boxes'],
      problem_keywords: ['raw material', 'organic fiber', 'distribution', 'supply chain']
    }
  },
  {
    name: 'ColdChain Express',
    owner_email: 'coldchain@demo.com',
    address: 'Nashik, Maharashtra, India',
    location: { type: 'Point', coordinates: [73.7898, 19.9975] },
    services: ['cold storage', 'refrigerated transport', 'temperature-controlled logistics', 'last-mile delivery'],
    challenges: ['need organic produce to fill cold chain capacity', 'want to expand client base in food sector'],
    ai_tags: {
      category: 'Logistics > Cold Chain',
      solution_keywords: ['cold storage', 'refrigerated transport', 'logistics', 'cold chain', 'temperature controlled'],
      problem_keywords: ['food clients', 'capacity utilization', 'organic food supply']
    }
  },
  {
    name: 'TechHarvest Solutions',
    owner_email: 'techharvest@demo.com',
    address: 'Bengaluru, Karnataka, India',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    services: ['IoT sensors for agriculture', 'crop monitoring software', 'smart irrigation systems', 'farm analytics'],
    challenges: ['need pilot farms to test our IoT sensors', 'looking for distribution partner in Maharashtra'],
    ai_tags: {
      category: 'Technology > AgriTech',
      solution_keywords: ['IoT farming', 'crop monitoring', 'smart irrigation', 'agriculture technology', 'farm analytics'],
      problem_keywords: ['pilot farms', 'agriculture clients', 'Maharashtra distribution']
    }
  },
  {
    name: 'NatureFiber Textiles',
    owner_email: 'naturefiber@demo.com',
    address: 'Surat, Gujarat, India',
    location: { type: 'Point', coordinates: [72.8311, 21.1702] },
    services: ['organic cotton fiber', 'natural jute supply', 'raw textile materials', 'sustainable fabric'],
    challenges: ['need new B2B clients for raw fiber', 'seeking packaging companies as customers'],
    ai_tags: {
      category: 'Manufacturing > Textiles',
      solution_keywords: ['organic fiber', 'raw material', 'jute supply', 'natural fiber', 'cotton supply'],
      problem_keywords: ['B2B clients', 'packaging buyers', 'fiber customers']
    }
  },
  {
    name: 'SwiftRoute Logistics',
    owner_email: 'swiftroute@demo.com',
    address: 'Hyderabad, Telangana, India',
    location: { type: 'Point', coordinates: [78.4867, 17.3850] },
    services: ['last-mile delivery', 'supply chain management', 'warehouse storage', 'freight forwarding'],
    challenges: ['need more clients in food & agriculture sector', 'high fuel cost, looking for EV fleet partner'],
    ai_tags: {
      category: 'Logistics > Supply Chain',
      solution_keywords: ['logistics', 'delivery', 'supply chain', 'freight', 'warehouse'],
      problem_keywords: ['agriculture clients', 'food sector clients', 'EV fleet', 'fuel efficiency']
    }
  },
  {
    name: 'SolarDrive Fleet',
    owner_email: 'solardrive@demo.com',
    address: 'Pune, Maharashtra, India',
    location: { type: 'Point', coordinates: [73.8567, 18.5204] },
    services: ['electric vehicle fleet rental', 'EV charging infrastructure', 'solar-powered logistics vehicles'],
    challenges: ['need logistics companies as clients', 'looking for warehouses with EV charging space'],
    ai_tags: {
      category: 'Technology > Clean Energy',
      solution_keywords: ['EV fleet', 'electric vehicles', 'solar logistics', 'green transport', 'EV charging'],
      problem_keywords: ['logistics clients', 'warehouse EV space', 'transport partners']
    }
  },
  {
    name: 'DataStack Analytics',
    owner_email: 'datastack@demo.com',
    address: 'Bengaluru, Karnataka, India',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    services: ['business analytics', 'supply chain data visualization', 'demand forecasting', 'inventory optimization'],
    challenges: ['need logistics and supply chain companies as pilot clients', 'looking for data partnership'],
    ai_tags: {
      category: 'Technology > Data Analytics',
      solution_keywords: ['analytics', 'data visualization', 'demand forecasting', 'inventory optimization', 'business intelligence'],
      problem_keywords: ['pilot clients', 'supply chain data', 'logistics partners']
    }
  },
  {
    name: 'MediQuick Pharma',
    owner_email: 'mediquick@demo.com',
    address: 'Mumbai, Maharashtra, India',
    location: { type: 'Point', coordinates: [72.8777, 19.0760] },
    services: ['pharmaceutical distribution', 'cold chain medicine delivery', 'hospital supply'],
    challenges: ['need better cold storage partner', 'high packaging cost for medicines'],
    ai_tags: {
      category: 'Healthcare > Pharma Distribution',
      solution_keywords: ['pharma distribution', 'medicine delivery', 'hospital supply', 'healthcare logistics'],
      problem_keywords: ['cold storage', 'packaging cost', 'medicine packaging']
    }
  },
  {
    name: 'UrbanBite Cloud Kitchen',
    owner_email: 'urbanbite@demo.com',
    address: 'Delhi, India',
    location: { type: 'Point', coordinates: [77.1025, 28.7041] },
    services: ['cloud kitchen services', 'bulk food preparation', 'meal subscription boxes'],
    challenges: ['need reliable organic vegetable supplier', 'looking for eco packaging for meal boxes', 'need last-mile delivery partner'],
    ai_tags: {
      category: 'Food > Cloud Kitchen',
      solution_keywords: ['food preparation', 'cloud kitchen', 'meal boxes', 'bulk cooking'],
      problem_keywords: ['organic vegetables', 'eco packaging', 'food delivery', 'last-mile logistics']
    }
  },
  {
    name: 'BuildRight Construction',
    owner_email: 'buildright@demo.com',
    address: 'Ahmedabad, Gujarat, India',
    location: { type: 'Point', coordinates: [72.5714, 23.0225] },
    services: ['commercial construction', 'green building design', 'eco-friendly construction materials'],
    challenges: ['need sustainable material suppliers', 'high logistics cost for materials'],
    ai_tags: {
      category: 'Manufacturing > Construction',
      solution_keywords: ['construction', 'green building', 'eco construction', 'sustainable materials'],
      problem_keywords: ['sustainable materials', 'logistics cost', 'material supply']
    }
  },
  {
    name: 'AquaPure Water Tech',
    owner_email: 'aquapure@demo.com',
    address: 'Chennai, Tamil Nadu, India',
    location: { type: 'Point', coordinates: [80.2707, 13.0827] },
    services: ['water purification systems', 'industrial water treatment', 'smart water monitoring IoT'],
    challenges: ['need industrial clients and factories as customers', 'looking for IoT integration partner'],
    ai_tags: {
      category: 'Technology > Water Tech',
      solution_keywords: ['water purification', 'water treatment', 'smart water monitoring', 'IoT water'],
      problem_keywords: ['industrial clients', 'factory clients', 'IoT partner']
    }
  },
  {
    name: 'RetailEdge POS',
    owner_email: 'retailedge@demo.com',
    address: 'Hyderabad, Telangana, India',
    location: { type: 'Point', coordinates: [78.4867, 17.3850] },
    services: ['POS software for retail', 'inventory management system', 'sales analytics dashboard'],
    challenges: ['need retail store chains as clients', 'looking for payment gateway integration partner'],
    ai_tags: {
      category: 'Technology > Retail Tech',
      solution_keywords: ['POS software', 'inventory management', 'retail analytics', 'sales dashboard'],
      problem_keywords: ['retail clients', 'payment gateway', 'store chain clients']
    }
  },
  {
    name: 'PayFlow Gateway',
    owner_email: 'payflow@demo.com',
    address: 'Mumbai, Maharashtra, India',
    location: { type: 'Point', coordinates: [72.8777, 19.0760] },
    services: ['payment gateway integration', 'UPI payment solutions', 'digital payment infrastructure'],
    challenges: ['need SaaS and POS software companies as integration clients'],
    ai_tags: {
      category: 'Finance > Payment Tech',
      solution_keywords: ['payment gateway', 'UPI payments', 'digital payments', 'payment integration'],
      problem_keywords: ['SaaS clients', 'POS clients', 'software integration partners']
    }
  },
  {
    name: 'AgroInput Supplies',
    owner_email: 'agroinput@demo.com',
    address: 'Nagpur, Maharashtra, India',
    location: { type: 'Point', coordinates: [79.0882, 21.1458] },
    services: ['agricultural raw materials', 'fertilizer supply', 'organic compost', 'farm equipment rental'],
    challenges: ['need IoT technology to modernize our supply chain', 'looking for analytics partner'],
    ai_tags: {
      category: 'Agriculture > Farm Supplies',
      solution_keywords: ['farm supplies', 'fertilizer', 'organic compost', 'agricultural materials', 'farm equipment'],
      problem_keywords: ['IoT technology', 'supply chain modernization', 'analytics', 'data partner']
    }
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Business.deleteMany({});
  await Match.deleteMany({});
  await Message.deleteMany({});
  console.log('Cleared existing data');

  const inserted = await Business.insertMany(businesses);
  console.log(`Inserted ${inserted.length} businesses`);

  // Create a few pre-baked matches for instant demo impact
  const byName = (name) => inserted.find(b => b.name === name);

  const demoMatches = [
    {
      business_a: byName('FreshFarm Organics')._id,
      business_b: byName('GreenPack Co.')._id,
      match_type: 'internal', score: 0.91,
      reason: 'GreenPack supplies eco-friendly packaging which directly solves FreshFarm\'s vegetable packaging challenge.',
      problem_side: byName('FreshFarm Organics')._id,
      solution_side: byName('GreenPack Co.')._id,
      status: 'accepted'
    },
    {
      business_a: byName('FreshFarm Organics')._id,
      business_b: byName('ColdChain Express')._id,
      match_type: 'internal', score: 0.87,
      reason: 'ColdChain provides refrigerated transport solving FreshFarm\'s cold storage logistics need.',
      problem_side: byName('FreshFarm Organics')._id,
      solution_side: byName('ColdChain Express')._id,
      status: 'pending'
    },
    {
      business_a: byName('GreenPack Co.')._id,
      business_b: byName('NatureFiber Textiles')._id,
      match_type: 'internal', score: 0.88,
      reason: 'NatureFiber supplies organic fiber that GreenPack needs as raw material for biodegradable packaging.',
      problem_side: byName('GreenPack Co.')._id,
      solution_side: byName('NatureFiber Textiles')._id,
      status: 'pending'
    },
    {
      business_a: byName('SwiftRoute Logistics')._id,
      business_b: byName('SolarDrive Fleet')._id,
      match_type: 'internal', score: 0.85,
      reason: 'SolarDrive\'s EV fleet directly solves SwiftRoute\'s high fuel cost problem.',
      problem_side: byName('SwiftRoute Logistics')._id,
      solution_side: byName('SolarDrive Fleet')._id,
      status: 'accepted'
    },
    {
      business_a: byName('MediQuick Pharma')._id,
      business_b: byName('ColdChain Express')._id,
      match_type: 'internal', score: 0.83,
      reason: 'ColdChain\'s temperature-controlled storage solves MediQuick\'s pharmaceutical cold chain challenge.',
      problem_side: byName('MediQuick Pharma')._id,
      solution_side: byName('ColdChain Express')._id,
      status: 'pending'
    },
    {
      business_a: byName('UrbanBite Cloud Kitchen')._id,
      business_b: byName('FreshFarm Organics')._id,
      match_type: 'internal', score: 0.90,
      reason: 'FreshFarm\'s organic vegetable supply directly solves UrbanBite\'s need for a reliable organic supplier.',
      problem_side: byName('UrbanBite Cloud Kitchen')._id,
      solution_side: byName('FreshFarm Organics')._id,
      status: 'pending'
    },
    {
      business_a: byName('UrbanBite Cloud Kitchen')._id,
      business_b: byName('GreenPack Co.')._id,
      match_type: 'internal', score: 0.86,
      reason: 'GreenPack\'s eco packaging directly addresses UrbanBite\'s need for sustainable meal box packaging.',
      problem_side: byName('UrbanBite Cloud Kitchen')._id,
      solution_side: byName('GreenPack Co.')._id,
      status: 'pending'
    },
    {
      business_a: byName('RetailEdge POS')._id,
      business_b: byName('PayFlow Gateway')._id,
      match_type: 'internal', score: 0.93,
      reason: 'PayFlow provides the payment gateway integration that RetailEdge POS needs to complete its platform.',
      problem_side: byName('RetailEdge POS')._id,
      solution_side: byName('PayFlow Gateway')._id,
      status: 'accepted'
    },
    {
      business_a: byName('DataStack Analytics')._id,
      business_b: byName('SwiftRoute Logistics')._id,
      match_type: 'internal', score: 0.79,
      reason: 'DataStack\'s supply chain analytics can optimize SwiftRoute\'s logistics operations.',
      problem_side: byName('SwiftRoute Logistics')._id,
      solution_side: byName('DataStack Analytics')._id,
      status: 'pending'
    },
    {
      business_a: byName('TechHarvest Solutions')._id,
      business_b: byName('FreshFarm Organics')._id,
      match_type: 'internal', score: 0.82,
      reason: 'FreshFarm\'s organic farm is an ideal pilot site for TechHarvest\'s IoT crop monitoring sensors.',
      problem_side: byName('TechHarvest Solutions')._id,
      solution_side: byName('FreshFarm Organics')._id,
      status: 'pending'
    },
    {
      business_a: byName('AgroInput Supplies')._id,
      business_b: byName('TechHarvest Solutions')._id,
      match_type: 'internal', score: 0.84,
      reason: 'TechHarvest\'s IoT and analytics tools solve AgroInput\'s need to modernize their supply chain.',
      problem_side: byName('AgroInput Supplies')._id,
      solution_side: byName('TechHarvest Solutions')._id,
      status: 'pending'
    },
    {
      business_a: byName('AgroInput Supplies')._id,
      business_b: byName('DataStack Analytics')._id,
      match_type: 'internal', score: 0.77,
      reason: 'DataStack\'s analytics platform can provide AgroInput the data insights they need for supply chain optimization.',
      problem_side: byName('AgroInput Supplies')._id,
      solution_side: byName('DataStack Analytics')._id,
      status: 'pending'
    }
  ];

  // Sort IDs to respect unique index
  const normalizedMatches = demoMatches.map(m => {
    const [aId, bId] = [m.business_a, m.business_b].sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );
    return { ...m, business_a: aId, business_b: bId };
  });

  await Match.insertMany(normalizedMatches);
  console.log(`Inserted ${normalizedMatches.length} demo matches`);

  // Update matched_businesses arrays
  for (const m of normalizedMatches) {
    await Business.updateOne({ _id: m.business_a }, { $addToSet: { matched_businesses: m.business_b } });
    await Business.updateOne({ _id: m.business_b }, { $addToSet: { matched_businesses: m.business_a } });
  }

  // Add a demo message thread
  const acceptedMatch = await Match.findOne({ status: 'accepted', match_type: 'internal' })
    .populate('business_a business_b');

  if (acceptedMatch) {
    await Message.insertMany([
      {
        match_id: acceptedMatch._id,
        sender: acceptedMatch.business_a._id,
        content: `Hi ${acceptedMatch.business_b.name}! We noticed you can help with one of our key challenges. Would love to explore a partnership.`,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        match_id: acceptedMatch._id,
        sender: acceptedMatch.business_b._id,
        content: `Hello! Absolutely, we've been looking for exactly this kind of collaboration. Let's schedule a call this week?`,
        createdAt: new Date(Date.now() - 1800000)
      },
      {
        match_id: acceptedMatch._id,
        sender: acceptedMatch.business_a._id,
        content: `Great! Thursday 3pm works for us. Shall we do a video call?`,
        createdAt: new Date(Date.now() - 900000)
      }
    ]);
    console.log('Inserted demo message thread');
  }

  console.log('\nSeed complete!');
  console.log(`  ${inserted.length} businesses`);
  console.log(`  ${normalizedMatches.length} matches`);
  console.log('  1 demo message thread');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

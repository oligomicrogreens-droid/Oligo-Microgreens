// This script is used to seed your Firestore database with initial data.
// It's the standard way to populate a database for development and testing.

// --- INSTRUCTIONS ---
// 1. SETUP FIREBASE:
//    - Go to your Firebase project settings > Service accounts.
//    - Click "Generate new private key" and download the JSON file.
//    - Rename the file to `serviceAccountKey.json` and place it in this `scripts` directory.
//    - IMPORTANT: Ensure your `serviceAccountKey.json` is added to your `.gitignore` file to keep it private!

// 2. INSTALL DEPENDENCIES:
//    - Run `npm install firebase-admin` in your terminal.

// 3. CONFIGURE DATABASE URL:
//    - In the `admin.initializeApp` block below, replace the `databaseURL` with the URL
//      found in your Firebase project settings. It looks like `https://<your-project-id>.firebaseio.com`.

// 4. RUN THE SCRIPT:
//    - Run `node scripts/seedDatabase.js` from your terminal.

const admin = require('firebase-admin');

// --- IMPORTANT: CONFIGURE YOUR PROJECT ---
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Replace with your project's database URL from Firebase settings
  databaseURL: 'https://<YOUR-PROJECT-ID>.firebaseio.com' 
});

const db = admin.firestore();

// --- SAMPLE DATA DEFINITIONS ---

const MICROGREEN_VARIETIES = [
  { name: 'Sunflower', growthCycleDays: 8 },
  { name: 'Radish', growthCycleDays: 7 },
  { name: 'Peas', growthCycleDays: 10 },
  { name: 'Broccoli', growthCycleDays: 9 },
  { name: 'Mustard', growthCycleDays: 6 },
  { name: 'Amaranth', growthCycleDays: 12 },
  { name: 'Kale', growthCycleDays: 11 },
];

const DELIVERY_MODES = {
    // We use a single document for modes for easy configuration
    id: 'main',
    modes: ['Porter', 'Swiggy Genie', 'Tiffin']
};

const SEED_INVENTORY = {
  'Sunflower': { stockOnHand: 5000, reorderLevel: 1000, gramsPerTray: 120 },
  'Radish': { stockOnHand: 2500, reorderLevel: 500, gramsPerTray: 80 },
  'Peas': { stockOnHand: 8000, reorderLevel: 2000, gramsPerTray: 200 },
  'Broccoli': { stockOnHand: 1500, reorderLevel: 300, gramsPerTray: 30 },
  'Mustard': { stockOnHand: 1200, reorderLevel: 300, gramsPerTray: 40 },
  'Amaranth': { stockOnHand: 800, reorderLevel: 200, gramsPerTray: 25 },
  'Kale': { stockOnHand: 900, reorderLevel: 250, gramsPerTray: 35 },
};

const getDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return admin.firestore.Timestamp.fromDate(d);
};

const ORDERS = [
  { 
    clientName: 'Green Leaf Cafe', 
    items: [{ variety: 'Sunflower', quantity: 10 }, { variety: 'Radish', quantity: 5 }],
    status: 'Completed', createdAt: getDate(15), deliveryDate: getDate(14), deliveryMode: 'Porter',
    actualHarvest: [{ variety: 'Sunflower', quantity: 10 }, { variety: 'Radish', quantity: 5 }],
    cashReceived: 750, remarks: 'Client was very happy.'
  },
  { 
    clientName: 'The Healthy Plate', 
    items: [{ variety: 'Broccoli', quantity: 8 }, { variety: 'Kale', quantity: 8 }],
    status: 'Completed', createdAt: getDate(10), deliveryDate: getDate(9), deliveryMode: 'Tiffin',
    actualHarvest: [{ variety: 'Broccoli', quantity: 8 }, { variety: 'Kale', quantity: 8 }],
    cashReceived: 960
  },
  { 
    clientName: 'Green Leaf Cafe', 
    items: [{ variety: 'Peas', quantity: 12 }],
    status: 'Completed', createdAt: getDate(8), deliveryDate: getDate(7), deliveryMode: 'Porter',
    actualHarvest: [{ variety: 'Peas', quantity: 12 }],
    cashReceived: 600
  },
  { 
    clientName: 'Fresh Bites Deli', 
    items: [{ variety: 'Mustard', quantity: 6 }, { variety: 'Radish', quantity: 6 }],
    status: 'Shortfall', createdAt: getDate(5), deliveryDate: getDate(4), deliveryMode: 'Swiggy Genie',
    actualHarvest: [{ variety: 'Mustard', quantity: 6 }, { variety: 'Radish', quantity: 4 }], // Shortfall on Radish
    cashReceived: 500, remarks: 'Apologized for the radish shortfall.'
  },
  {
    clientName: 'The Healthy Plate',
    items: [{ variety: 'Sunflower', quantity: 15 }, { variety: 'Amaranth', quantity: 5 }],
    status: 'Pending', createdAt: getDate(2), deliveryDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
  },
  {
    clientName: 'Green Leaf Cafe',
    items: [{ variety: 'Radish', quantity: 10 }, { variety: 'Peas', quantity: 10 }],
    status: 'Pending', createdAt: getDate(1), deliveryDate: new Date(new Date().setDate(new Date().getDate() + 3)), // In 3 days
  },
  {
    clientName: 'New Client Co.',
    items: [{ variety: 'Broccoli', quantity: 5 }],
    status: 'Pending', createdAt: getDate(0), // Today
  }
];

const SOWING_LOG = {
    [getDate(12).toDate().toISOString().split('T')[0]]: {
        trays: { 'Broccoli': 5, 'Kale': 5 }
    },
    [getDate(9).toDate().toISOString().split('T')[0]]: {
        trays: { 'Sunflower': 10, 'Radish': 5 }
    },
    [getDate(3).toDate().toISOString().split('T')[0]]: {
        trays: { 'Peas': 8, 'Mustard': 4 }
    },
    [getDate(2).toDate().toISOString().split('T')[0]]: {
        trays: { 'Sunflower': 15, 'Amaranth': 3 }
    }
};

const WASTE_LOG = [
    { date: getDate(11), variety: 'Broccoli', traysWasted: 1, reason: 'Poor Germination' },
    { date: getDate(4), variety: 'Radish', traysWasted: 2, reason: 'Mold' },
];

const DELIVERY_EXPENSES = [
    { date: getDate(14), deliveryPerson: 'Porter', amount: 150, remarks: 'Morning delivery batch 1' },
    { date: getDate(9), deliveryPerson: 'Tiffin', amount: 0, remarks: 'Included with tiffin service' },
    { date: getDate(7), deliveryPerson: 'Porter', amount: 120, remarks: 'Single urgent delivery' },
    { date: getDate(4), deliveryPerson: 'Swiggy Genie', amount: 200, remarks: 'Peak hour charges' },
];


// --- DATABASE SEEDING LOGIC ---

/**
 * Deletes all documents in a collection.
 * @param {string} collectionPath The path of the collection to clear.
 */
async function clearCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.limit(500).get(); // Batch delete in chunks

  if (snapshot.size === 0) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the same collection to delete remaining documents
  await clearCollection(collectionPath);
}

/**
 * Seeds a collection with documents from an array of objects.
 * The document ID will be auto-generated by Firestore.
 * @param {string} collectionName The name of the collection.
 * @param {Array<Object>} data The data to add.
 */
async function seedCollection(collectionName, data) {
  const collectionRef = db.collection(collectionName);
  const batch = db.batch();

  data.forEach(itemData => {
    const docRef = collectionRef.doc(); // Auto-generate ID
    batch.set(docRef, itemData);
  });

  await batch.commit();
  console.log(`  - Seeded ${data.length} documents into '${collectionName}'.`);
}


/**
 * Seeds a collection where the document ID is a specific key from the data object.
 * @param {string} collectionName The name of the collection.
 * @param {Object} data The data object, where keys are document IDs.
 */
async function seedCollectionWithIds(collectionName, data) {
  const collectionRef = db.collection(collectionName);
  const batch = db.batch();

  Object.entries(data).forEach(([docId, docData]) => {
    const docRef = collectionRef.doc(docId);
    batch.set(docRef, docData);
  });

  await batch.commit();
  console.log(`  - Seeded ${Object.keys(data).length} documents into '${collectionName}'.`);
}


async function main() {
  console.log('Starting database seeding process...');

  const collectionsToClear = [
    'microgreenVarieties',
    'deliveryModes',
    'seedInventory',
    'orders',
    'sowingLog',
    'wasteLog',
    'deliveryExpenses',
  ];
  
  console.log('\nClearing existing data...');
  await Promise.all(collectionsToClear.map(async (collection) => {
      await clearCollection(collection);
      console.log(`  - Cleared '${collection}'.`);
  }));

  console.log('\nSeeding new data...');
  
  // Seed collections
  await seedCollection('microgreenVarieties', MICROGREEN_VARIETIES);
  await seedCollectionWithIds('deliveryModes', { [DELIVERY_MODES.id]: { modes: DELIVERY_MODES.modes } });
  await seedCollectionWithIds('seedInventory', SEED_INVENTORY);
  await seedCollection('orders', ORDERS);
  await seedCollectionWithIds('sowingLog', SOWING_LOG);
  await seedCollection('wasteLog', WASTE_LOG);
  await seedCollection('deliveryExpenses', DELIVERY_EXPENSES);
  
  console.log('\n✅ Database seeding completed successfully!');
}

main().catch(error => {
  console.error('❌ An error occurred during database seeding:', error);
  process.exit(1);
});

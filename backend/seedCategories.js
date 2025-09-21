const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const categories = [
  {
    name: "Gold Necklace",
    slug: "gold-necklace",
    image: "/Gold Necklace.jpg",
    featured: true,
    order: 1
  },
  {
    name: "Diamond Ring",
    slug: "diamond-ring", 
    image: "/Diamond Ring.jpg",
    featured: true,
    order: 2
  },
  {
    name: "Bridal Set",
    slug: "bridal-set",
    image: "/Bridal Set.jpg",
    featured: true,
    order: 3
  },
  {
    name: "Gold Bangles",
    slug: "gold-bangles",
    image: "/Gold Bangles.jpg", 
    featured: true,
    order: 4
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const result = await Category.insertMany(categories);
    console.log(`✅ Seeded ${result.length} categories:`);
    result.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug}) - Featured: ${cat.featured}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();

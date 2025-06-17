const categories = [
  {
    title: "Gold Earring",
    description: "Minimalist designs to modern styles.",
    image: "/images/earring.png", // Replace with actual image path
  },
  {
    title: "Diamond Ring",
    description: "Pure, perfect and priceless designs.",
    image: "/images/diamond-ring.png",
  },
  {
    title: "Gold Bangles",
    description: "Trendy, traditional, designer & more.",
    image: "/images/gold-bangle.png",
  },
  {
    title: "Diamond Pendant",
    description: "Where beauty and elegance combine!",
    image: "/images/diamond-pendant.png",
  },
  {
    title: "Mangalsutra",
    description: "Inspired by traditions; crafted to perfection.",
    image: "/images/mangalsutra.png",
  },
];

const Category = () => {
  return (
    <section className="py-20 bg-white">
      <h2 className="text-4xl font-semibold text-center mb-10">Trending Categories</h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 px-4">
        {categories.map((cat, index) => (
          <div
            key={index}
            className="bg-white rounded shadow-sm p-4 text-center hover:shadow-lg transition"
          >
            <img
              src={cat.image}
              alt={cat.title}
              className="w-40 h-40 mx-auto object-contain mb-4"
            />
            <p className="text-sm mb-2">{cat.description}</p>
            <span className="text-black font-medium border-b-2 border-yellow-400 pb-0.5">
              {cat.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Category;

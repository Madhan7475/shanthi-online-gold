import React from "react";
import { Link } from "react-router-dom";

const DigiGold = () => {
  const digiGoldPlans = [
    {
      id: 1,
      title: "Buy Online",
      description: "Purchase gold digitally with ease and safety.",
      img: "/digi/buy.jpg",
      link: "/digi/buy",
    },
    {
      id: 2,
      title: "Track Prices",
      description: "Monitor gold rates in real-time.",
      img: "/digi/track.jpg",
      link: "/digi/track",
    },
    {
      id: 3,
      title: "Monthly Plans",
      description: "Invest in gold with monthly saving plans.",
      img: "/scheme/plan.jpg",
      link: "/scheme/monthly",
    },
    {
      id: 4,
      title: "Refer & Earn",
      description: "Invite friends and earn rewards.",
      img: "/scheme/refer.jpg",
      link: "/scheme/refer",
    },
  ];

  return (
    <div className="bg-[#fffdf6] px-4 lg:px-20 py-10 text-[#3e2f1c] min-h-screen">
      <Link
        to="/"
        className="text-sm text-[#9e886e] underline mb-4 inline-block hover:text-[#b19874]"
      >
        ← Back to Home
      </Link>

      <h2 className="text-2xl font-semibold mb-8 text-[#d4af37]">
        DigiGold Services
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {digiGoldPlans.map((plan) => (
          <Link
            key={plan.id}
            to={plan.link}
            className="bg-white border border-[#f4e0b9] p-4 rounded-xl shadow-md hover:shadow-lg transition"
          >
            <img
              src={plan.img}
              alt={plan.title}
              className="w-full h-40 object-cover rounded-lg mb-4"
            />
            <h3 className="text-lg font-semibold text-[#3e2f1c] mb-2">
              {plan.title}
            </h3>
            <p className="text-sm text-[#9e886e]">{plan.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-[#9e886e]">
        <p>✔ Safe and secure digital gold purchases.</p>
        <p>100% Authentic and verified products.</p>
      </div>
    </div>
  );
};

export default DigiGold;

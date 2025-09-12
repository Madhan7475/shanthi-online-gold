import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const DigiGold = () => {
  const [goldPrice, setGoldPrice] = useState({
    price: 6850,
    change: '+25.50',
    percentage: '+0.37%'
  });

  const [selectedPlan, setSelectedPlan] = useState('monthly');
  
  // Simulate live gold price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGoldPrice(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 10,
        change: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 30).toFixed(2),
        percentage: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 2).toFixed(2) + '%'
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const investmentPlans = [
    {
      id: 'monthly',
      title: 'Monthly SIP',
      minAmount: '₹500',
      duration: '12-60 months',
      benefits: ['No wastage charges', 'Flexible amounts', 'Auto investment'],
      icon: '📅'
    },
    {
      id: 'onetime',
      title: 'One-Time Purchase',
      minAmount: '₹100',
      duration: 'Instant',
      benefits: ['Immediate ownership', 'No lock-in', 'Instant liquidity'],
      icon: '💰'
    },
    {
      id: 'gifting',
      title: 'Gold Gifting',
      minAmount: '₹1000',
      duration: 'Instant',
      benefits: ['Digital certificates', 'Easy transfer', 'Special occasions'],
      icon: '🎁'
    }
  ];

  const features = [
    {
      icon: '🔒',
      title: '100% Secure',
      description: 'Bank-grade security with insurance coverage'
    },
    {
      icon: '📊',
      title: 'Live Rates',
      description: 'Real-time gold prices updated every second'
    },
    {
      icon: '🏪',
      title: 'Physical Delivery',
      description: 'Convert to jewelry or coins anytime'
    },
    {
      icon: '💳',
      title: 'Easy Payment',
      description: 'UPI, cards, and net banking supported'
    },
    {
      icon: '📱',
      title: 'Mobile First',
      description: 'Manage investments on the go'
    },
    {
      icon: '🎯',
      title: 'Goal Planning',
      description: 'Set targets for weddings, festivals'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Sign Up',
      description: 'Create your account with KYC verification'
    },
    {
      step: 2,
      title: 'Choose Plan',
      description: 'Select investment amount and frequency'
    },
    {
      step: 3,
      title: 'Start Investing',
      description: 'Begin your digital gold journey'
    },
    {
      step: 4,
      title: 'Track & Redeem',
      description: 'Monitor growth and redeem anytime'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#400F45] via-[#8B4513] to-[#DAA520] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                DigiGold
                <span className="block text-2xl lg:text-3xl font-normal mt-2">
                  Smart Way to Invest in Gold
                </span>
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Start your gold investment journey with as little as ₹100. 
                Buy, sell, and manage digital gold with complete security.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/digi/buy"
                  className="bg-white text-[#400F45] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition text-center"
                >
                  Start Investing
                </Link>
                <Link
                  to="/digi/track"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#400F45] transition text-center"
                >
                  Track Prices
                </Link>
              </div>
            </div>
            <div className="text-center">
              <img
                src="/digi/hero-gold.jpg"
                alt="Digital Gold"
                className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Gold Price Ticker */}
      <div className="bg-[#1a1a1a] text-white py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-semibold">LIVE GOLD PRICE</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                ₹{goldPrice.price.toFixed(2)}/gm
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                goldPrice.change.startsWith('+') 
                  ? 'bg-green-900 text-green-300' 
                  : 'bg-red-900 text-red-300'
              }`}>
                {goldPrice.change} ({goldPrice.percentage})
              </div>
            </div>
            <div className="text-sm opacity-75">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Investment Plans */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#400F45] mb-4">
              Choose Your Investment Plan
            </h2>
            <p className="text-xl text-gray-600">
              Flexible options to suit your financial goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {investmentPlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                  selectedPlan === plan.id 
                    ? 'border-[#400F45] transform scale-105' 
                    : 'border-transparent'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="text-4xl mb-4">{plan.icon}</div>
                <h3 className="text-2xl font-bold text-[#400F45] mb-2">
                  {plan.title}
                </h3>
                <div className="mb-6">
                  <p className="text-gray-600 mb-2">
                    <strong>Min Amount:</strong> {plan.minAmount}
                  </p>
                  <p className="text-gray-600 mb-4">
                    <strong>Duration:</strong> {plan.duration}
                  </p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/digi/${plan.id}`}
                  className="block w-full bg-[#400F45] text-white text-center py-3 rounded-lg font-semibold hover:bg-[#5a1762] transition"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#400F45] mb-4">
              Why Choose DigiGold?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the future of gold investment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 hover:shadow-lg transition-shadow rounded-xl">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-[#400F45] mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gradient-to-r from-[#400F45]/5 to-[#8B4513]/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#400F45] mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in just 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-[#400F45] text-white w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-[#400F45] mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-[#400F45]/30 transform translate-x-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-[#400F45] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <p className="text-xl opacity-90">Happy Investors</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">₹100 Cr+</div>
              <p className="text-xl opacity-90">Gold Purchased</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <p className="text-xl opacity-90">Purity Guarantee</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <p className="text-xl opacity-90">Trading Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#400F45] mb-4">
              Investment Calculator
            </h2>
            <p className="text-xl text-gray-600">
              See how your investment can grow over time
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Investment Amount
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    defaultValue="5000"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>₹500</span>
                    <span className="font-semibold">₹5,000</span>
                    <span>₹50,000</span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Period (Years)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="3"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1 Year</span>
                    <span className="font-semibold">3 Years</span>
                    <span>10 Years</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <h3 className="text-xl font-semibold text-[#400F45] mb-4">
                  Projected Returns
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Investment:</span>
                    <span className="font-semibold">₹1,80,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Gold Value:</span>
                    <span className="font-semibold text-green-600">₹2,16,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Potential Gain:</span>
                    <span className="font-semibold text-green-600">₹36,000 (20%)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  *Based on historical gold price appreciation. Past performance doesn't guarantee future returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-[#400F45] to-[#8B4513] text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-20 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Start Your Gold Investment Journey Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of smart investors who trust DigiGold for their gold investment needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/digi/buy"
              className="bg-white text-[#400F45] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Start Investing Now
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#400F45] transition"
            >
              Get Expert Advice
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigiGold;

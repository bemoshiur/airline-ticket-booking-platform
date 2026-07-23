"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, MapPin, Clock, DollarSign, CheckCircle, ArrowRight } from "lucide-react";
import { SearchWidget } from "@/components/search/search-widget";
import { format, addDays } from "date-fns";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PopularRoutesSection />
      <FeaturedDealsSection />
      <TestimonialsSection />
      <WhyChooseUsSection />
      <CTASection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32">
      {/* Hero Background with Gradient */}
      <div className="absolute inset-0">
        {/* Base Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />

        {/* Animated SVG Background Elements */}
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating Planes Animation */}
        <motion.div
          className="absolute top-20 right-10 text-white opacity-20"
          animate={{ y: [0, -30, 0], x: [0, 20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Plane size={150} strokeWidth={0.5} />
        </motion.div>

        <motion.div
          className="absolute bottom-40 left-5 text-white opacity-15"
          animate={{ y: [0, 30, 0], x: [0, -15, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Plane size={120} strokeWidth={0.5} />
        </motion.div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/30 to-purple-900/50" />

        {/* Light effect */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1360px] mx-auto px-4 lg:px-8">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mb-4 inline-block"
          >
            <Plane size={48} className="text-white opacity-80" />
          </motion.div>

          <h1 className="font-sora font-bold text-6xl md:text-7xl text-white mb-4 leading-tight drop-shadow-lg">
            Discover Your Next Adventure
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-4 font-light drop-shadow-md">
            Explore the world with confidence — Book flights at unbeatable prices
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/80 mb-8">
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
              <span className="text-xl">✈️</span>
              <span className="font-medium">50M+ Travelers</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
              <span className="text-xl">🌍</span>
              <span className="font-medium">1000+ Destinations</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
              <span className="text-xl">💰</span>
              <span className="font-medium">Best Price Guarantee</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Search Widget */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <SearchWidget />
        </motion.div>

        {/* Security Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-white/70"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-300" />
            <span>Secure Booking</span>
          </div>
          <div className="text-white/30">|</div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-300" />
            <span>24/7 Support</span>
          </div>
          <div className="text-white/30">|</div>
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-yellow-300" />
            <span>Best Price Guarantee</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Wave Transition */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/50 to-transparent" />
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Plane,
      title: "1000+ Routes",
      description: "Fly to destinations across Bangladesh and international routes",
      color: "text-brand-500",
    },
    {
      icon: DollarSign,
      title: "Best Prices",
      description: "Compare prices and get the best deals on your flights",
      color: "text-success",
    },
    {
      icon: Clock,
      title: "Fast Booking",
      description: "Book your flight in under 2 minutes with our streamlined process",
      color: "text-info",
    },
    {
      icon: CheckCircle,
      title: "Guaranteed Safe",
      description: "Secure payment gateway with 100% buyer protection",
      color: "text-urgent",
    },
  ];

  return (
    <section className="bg-surface py-20 px-4">
      <div className="max-w-[1360px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-sora font-bold text-h1 text-ink-800 mb-3">
            Why Choose SkyWing
          </h2>
          <p className="text-body text-ink-500 max-w-xl mx-auto">
            Experience seamless flight booking with unbeatable prices and premium service
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group p-6 rounded-2xl border border-line bg-surface-alt hover:border-brand-300 hover:shadow-e2 transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-h3 text-ink-800 mb-2">{feature.title}</h3>
                <p className="text-body-sm text-ink-500">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PopularRoutesSection() {
  const popularRoutes = [
    { from: "Dhaka", fromCode: "DAC", to: "Cox's Bazar", toCode: "CXB", price: 4170, duration: "1h 05m" },
    { from: "Dhaka", fromCode: "DAC", to: "Chattogram", toCode: "CGP", price: 3800, duration: "50m" },
    { from: "Dhaka", fromCode: "DAC", to: "Sylhet", toCode: "ZYL", price: 3900, duration: "1h 15m" },
    { from: "Dhaka", fromCode: "DAC", to: "Jashore", toCode: "JSR", price: 3700, duration: "1h 00m" },
    { from: "Dhaka", fromCode: "DAC", to: "Saidpur", toCode: "SPD", price: 3700, duration: "1h 10m" },
    { from: "Dhaka", fromCode: "DAC", to: "Rajshahi", toCode: "RJH", price: 3600, duration: "1h 20m" },
  ];

  return (
    <section className="bg-canvas py-24 px-4">
      <div className="max-w-[1360px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-sora font-bold text-h1 text-ink-800">
              Popular Routes from Dhaka
            </h2>
            <Link
              href="/flights?tripType=O"
              className="flex items-center gap-1 text-brand-500 hover:text-brand-600 text-sm font-medium transition-colors"
            >
              View all routes
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="text-body text-ink-500">Explore trending destinations with unbeatable fares</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularRoutes.map((r, idx) => (
            <motion.div
              key={r.toCode}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
            >
              <Link
                href={`/flights?tripType=O&itinerary=${r.fromCode}-${r.toCode}-${format(addDays(new Date(), 14), "yyyy-MM-dd")}&cabinClass=economy&adult=1&child=0&kid=0&infant=0&fareType=REGULAR`}
                className="block h-full p-6 rounded-2xl bg-surface border border-line hover:border-brand-400 hover:shadow-e3 hover:-translate-y-1 transition-all group"
              >
                {/* Route Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-label font-semibold">
                      {r.fromCode}
                    </span>
                    <Plane size={16} className="text-brand-400 rotate-90" />
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-label font-semibold">
                      {r.toCode}
                    </span>
                  </div>
                </div>

                {/* Route Details */}
                <div className="mb-4">
                  <h3 className="text-h3 text-ink-800 mb-1">
                    {r.from} → {r.to}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-ink-400">
                    <Clock size={14} />
                    <span>{r.duration}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-ink-400 text-sm">from</span>
                  <span className="text-fare text-brand-500 font-bold">৳{r.price.toLocaleString()}</span>
                </div>

                {/* CTA */}
                <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
                  <span className="text-xs text-ink-400">Book now</span>
                  <ArrowRight size={16} className="text-brand-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  const reasons = [
    {
      title: "Transparent Pricing",
      description: "No hidden fees. What you see is what you pay. Every rupee is accounted for.",
    },
    {
      title: "Instant Confirmation",
      description: "Book instantly and get your e-ticket in seconds. Start your journey immediately.",
    },
    {
      title: "24/7 Support",
      description: "Our dedicated support team is always here to help with any flight-related queries.",
    },
    {
      title: "Flexible Booking",
      description: "Modify or cancel your booking with ease. Travel on your terms.",
    },
  ];

  return (
    <section className="bg-surface py-24 px-4">
      <div className="max-w-[1360px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-sora font-bold text-h1 text-ink-800 mb-3">
            How We Earn Your Trust
          </h2>
          <p className="text-body text-ink-500 max-w-xl mx-auto">
            Every detail matters when it comes to your travel
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reasons.map((reason, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center">
                <span className="text-brand-600 font-bold text-lg">{idx + 1}</span>
              </div>
              <div>
                <h3 className="text-h3 text-ink-800 mb-2">{reason.title}</h3>
                <p className="text-body text-ink-500">{reason.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { number: "50M+", label: "Happy Travelers" },
    { number: "1000+", label: "Flight Routes" },
    { number: "4.9★", label: "Average Rating" },
    { number: "24/7", label: "Support" },
  ];

  return (
    <section className="bg-brand-600 py-16 px-4">
      <div className="max-w-[1360px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
              <div className="text-white/80 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Search",
      description: "Enter your travel dates and preferences. Our AI finds the best options for you.",
    },
    {
      number: "2",
      title: "Compare",
      description: "See prices from multiple airlines side-by-side. Find the perfect balance of price and timing.",
    },
    {
      number: "3",
      title: "Book",
      description: "Secure booking with instant confirmation. Your e-ticket arrives in seconds.",
    },
    {
      number: "4",
      title: "Fly",
      description: "Check in online and head to the airport. Enjoy your journey with peace of mind.",
    },
  ];

  return (
    <section className="bg-surface py-24 px-4">
      <div className="max-w-[1360px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-sora font-bold text-h1 text-ink-800 mb-3">
            How It Works
          </h2>
          <p className="text-body text-ink-500 max-w-xl mx-auto">
            Booking with SkyWing is simple and straightforward
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="relative text-center"
            >
              {/* Number Circle */}
              <div className="w-16 h-16 rounded-full bg-brand-500 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                {step.number}
              </div>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-brand-200" />
              )}

              <h3 className="text-h3 text-ink-800 mb-2">{step.title}</h3>
              <p className="text-body-sm text-ink-500">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedDealsSection() {
  const deals = [
    {
      route: "Dhaka → Chattogram",
      discount: "30%",
      originalPrice: 3800,
      dealPrice: 2660,
      expires: "Today",
      badge: "Hot Deal",
    },
    {
      route: "Dhaka → Sylhet",
      discount: "25%",
      originalPrice: 3900,
      dealPrice: 2925,
      expires: "2 days left",
      badge: "Limited Time",
    },
    {
      route: "Dhaka → Rajshahi",
      discount: "20%",
      originalPrice: 3600,
      dealPrice: 2880,
      expires: "5 days left",
      badge: "Flash Sale",
    },
  ];

  return (
    <section className="bg-canvas py-24 px-4">
      <div className="max-w-[1360px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="font-sora font-bold text-h1 text-ink-800 mb-3">
            ⚡ Featured Deals
          </h2>
          <p className="text-body text-ink-500">Limited time offers on popular routes. Book now!</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {deals.map((deal, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="relative p-6 rounded-2xl bg-white border-2 border-brand-300 hover:shadow-e3 transition-all"
            >
              {/* Badge */}
              <div className="absolute -top-3 left-6">
                <span className="inline-block px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold">
                  {deal.badge}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-h3 text-ink-800 mb-4">{deal.route}</h3>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-fare text-brand-500 font-bold">৳{deal.dealPrice.toLocaleString()}</span>
                    <span className="text-sm text-ink-400 line-through">৳{deal.originalPrice.toLocaleString()}</span>
                  </div>
                  <div className="inline-block px-2 py-1 rounded-lg bg-success-bg text-success text-xs font-bold">
                    Save {deal.discount}
                  </div>
                </div>

                {/* Expires */}
                <div className="text-xs text-urgent mb-4">{deal.expires}</div>

                {/* CTA */}
                <Link
                  href="/flights"
                  className="block w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors text-center"
                >
                  Book Deal
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Rahul Kumar",
      location: "Dhaka",
      rating: 5,
      text: "Best flight booking app! Found amazing deals and the process was super smooth. Highly recommended!",
      avatar: "🧑",
    },
    {
      name: "Priya Sharma",
      location: "Chattogram",
      rating: 5,
      text: "The customer service is excellent. They helped me with a last-minute booking and it was seamless.",
      avatar: "👩",
    },
    {
      name: "Ahmed Hassan",
      location: "Sylhet",
      rating: 5,
      text: "Save so much money compared to other platforms. Love the price comparison feature!",
      avatar: "🧔",
    },
  ];

  return (
    <section className="bg-surface py-24 px-4">
      <div className="max-w-[1360px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-sora font-bold text-h1 text-ink-800 mb-3">
            What Our Customers Say
          </h2>
          <p className="text-body text-ink-500 max-w-xl mx-auto">
            Join millions of happy travelers who trust SkyWing
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="p-6 rounded-2xl bg-white border border-line hover:shadow-e2 transition-all"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-xl">⭐</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-body text-ink-600 mb-4 italic">"{testimonial.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="text-3xl">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold text-ink-800">{testimonial.name}</div>
                  <div className="text-xs text-ink-400">{testimonial.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-500 opacity-90" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-[1360px] mx-auto text-center"
      >
        <h2 className="font-sora font-bold text-h1 text-white mb-4">
          Ready to Take Flight?
        </h2>
        <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
          Join millions of travelers who trust SkyWing for the best flight deals
        </p>
        <Link
          href="/flights"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-600 font-bold hover:bg-brand-50 transition-colors shadow-e3 hover:-translate-y-0.5"
        >
          Start Searching Now
          <ArrowRight size={20} />
        </Link>
      </motion.div>
    </section>
  );
}

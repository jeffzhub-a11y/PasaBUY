import React from 'react';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { ShoppingBag, Truck, Store, ShieldCheck, ArrowRight, MapPin, CreditCard, Clock } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-600">PasaBUY</span>
          </div>
          <button
            onClick={signIn}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          >
            Your Personal Shopper, <br />
            <span className="text-blue-600">Delivered in Minutes.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto mb-10"
          >
            PasaBUY connects you with nearby riders who shop and deliver anything you need. From groceries to custom requests, we've got you covered.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={signIn}
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-200"
            >
              Order Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={signIn}
              className="w-full sm:w-auto bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 rounded-2xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              Become a Rider
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="w-8 h-8 text-blue-600" />,
                title: "Real-time Tracking",
                desc: "Watch your rider's progress on the map from store to your door."
              },
              {
                icon: <CreditCard className="w-8 h-8 text-blue-600" />,
                title: "Multiple Payments",
                desc: "Pay with Cash, GCash, or Maya. Secure and convenient."
              },
              {
                icon: <Clock className="w-8 h-8 text-blue-600" />,
                title: "On-demand Service",
                desc: "Need something now? Our riders are ready to shop for you 24/7."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the PasaBUY Ecosystem</h2>
            <p className="text-gray-600">Choose how you want to use the platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <ShoppingBag />, label: "Customer", color: "bg-blue-50 text-blue-600" },
              { icon: <Truck />, label: "Rider", color: "bg-green-50 text-green-600" },
              { icon: <Store />, label: "Seller", color: "bg-orange-50 text-orange-600" }
            ].map((role, i) => (
              <div key={i} className="flex flex-col items-center p-8 rounded-3xl border border-gray-100 hover:border-blue-600 transition-colors cursor-pointer group">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${role.color}`}>
                  {React.cloneElement(role.icon as React.ReactElement<any>, { className: "w-8 h-8" })}
                </div>
                <span className="text-xl font-bold">{role.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold tracking-tight">PasaBUY</span>
          </div>
          <div className="flex gap-8 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-gray-500 text-sm">© 2026 PasaBUY by jeffzhub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

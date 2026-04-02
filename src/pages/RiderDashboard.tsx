import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../AuthContext';
import { db, storage } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  runTransaction, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Order, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Package, 
  CreditCard,
  Camera,
  DollarSign,
  Navigation,
  Check,
  X,
  ShoppingBag,
  MessageCircle
} from 'lucide-react';
import MapComponent from '../MapComponent';
import ChatComponent from '../ChatComponent';

const RiderDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myActiveOrders, setMyActiveOrders] = useState<Order[]>([]);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState<string | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');

  useEffect(() => {
    if (!profile) return;

    // Listen for available (pending) orders
    const qAvailable = query(
      collection(db, 'orders'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeAvailable = onSnapshot(qAvailable, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setAvailableOrders(ordersData);
    });

    // Listen for my active orders
    const qActive = query(
      collection(db, 'orders'),
      where('riderId', '==', profile.uid),
      where('status', 'in', ['accepted', 'purchasing', 'delivering'])
    );

    const unsubscribeActive = onSnapshot(qActive, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setMyActiveOrders(ordersData);
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeActive();
    };
  }, [profile]);

  const acceptOrder = async (orderId: string) => {
    if (!profile) return;

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);

        if (!orderSnap.exists()) throw "Order does not exist!";
        
        const orderData = orderSnap.data() as Order;
        if (orderData.status !== 'pending') throw "Order already taken!";

        transaction.update(orderRef, {
          riderId: profile.uid,
          status: 'accepted',
          updatedAt: serverTimestamp()
        });
      });
      alert("Order accepted successfully!");
    } catch (error) {
      console.error("Error accepting order:", error);
      alert(error);
    }
  };

  const updateStatus = async (orderId: string, nextStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleUpdatePrice = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        totalPrice: parseFloat(newPrice),
        customerApprovedPrices: false, // Reset approval
        status: 'purchasing',
        updatedAt: serverTimestamp()
      });
      setIsUpdatingPrice(null);
      setNewPrice('');
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  const completeOrder = async (orderId: string, totalPrice: number, deliveryFee: number) => {
    if (!profile) return;

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const riderRef = doc(db, 'users', profile.uid);
        const adminRef = doc(db, 'users', 'admin_system'); // Placeholder for admin

        const riderSnap = await transaction.get(riderRef);
        const riderData = riderSnap.data() as UserProfile;

        // Calculate earnings (e.g. 80% to rider, 20% to admin)
        const adminFee = deliveryFee * 0.2;
        const riderEarning = deliveryFee * 0.8;

        transaction.update(orderRef, {
          status: 'completed',
          updatedAt: serverTimestamp()
        });

        transaction.update(riderRef, {
          walletBalance: (riderData.walletBalance || 0) + riderEarning
        });

        // Log transaction
        const transRef = doc(collection(db, 'transactions'));
        transaction.set(transRef, {
          userId: profile.uid,
          orderId,
          amount: riderEarning,
          type: 'earning',
          status: 'completed',
          createdAt: serverTimestamp()
        });
      });
      alert("Order completed! Earnings added to wallet.");
    } catch (error) {
      console.error("Error completing order:", error);
    }
  };

  const markAdminFeeAsPaid = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        adminFeeStatus: 'paid',
        updatedAt: serverTimestamp()
      });
      alert("Admin fee marked as paid. Admin will confirm receipt.");
    } catch (error) {
      console.error("Error marking admin fee as paid:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Rider Dashboard</h2>
            <p className="text-gray-500">You are currently online and ready for jobs.</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Online
            </div>
          </div>
        </div>

        {/* Active Jobs Section */}
        {myActiveOrders.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              Active Jobs ({myActiveOrders.length})
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {myActiveOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-8 rounded-[32px] border-2 border-blue-100 shadow-xl shadow-blue-50 space-y-6"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          {order.status}
                        </span>
                        <span className="text-sm text-gray-400 font-medium">Order #{order.id.slice(-6).toUpperCase()}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-gray-900">Customer Request:</h4>
                        <p className="text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">"{order.customRequest}"</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="p-2 bg-blue-50 rounded-lg"><MapPin className="w-4 h-4 text-blue-600" /></div>
                          {order.deliveryAddress}
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="p-2 bg-green-50 rounded-lg"><CreditCard className="w-4 h-4 text-green-600" /></div>
                          Payment: {order.paymentMethod.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="md:w-64 space-y-4">
                      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Price</p>
                        <p className="text-3xl font-black text-gray-900">₱{order.totalPrice || '---'}</p>
                        {order.status === 'purchasing' && !order.customerApprovedPrices && (
                          <p className="text-[10px] text-orange-600 font-bold mt-2 animate-pulse">AWAITING APPROVAL</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-3">
                    <button 
                      onClick={() => setActiveChatOrder(order)}
                      className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" /> Chat Customer
                    </button>

                    {order.status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(order.id, 'purchasing')}
                        className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                      >
                        <Package className="w-5 h-5" /> Start Purchasing
                      </button>
                    )}

                    {order.status === 'purchasing' && (
                      <>
                        <button
                          onClick={() => setIsUpdatingPrice(order.id)}
                          className="flex-1 bg-white text-blue-600 border-2 border-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                          <DollarSign className="w-5 h-5" /> Update Price
                        </button>
                        {order.customerApprovedPrices && (
                          <button
                            onClick={() => updateStatus(order.id, 'delivering')}
                            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                          >
                            <Truck className="w-5 h-5" /> Start Delivery
                          </button>
                        )}
                      </>
                    )}

                    {order.status === 'delivering' && (
                      <button
                        onClick={() => completeOrder(order.id, order.totalPrice || 0, order.deliveryFee)}
                        className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Complete Delivery
                      </button>
                    )}
                  </div>

                  {order.status === 'completed' && order.paymentMethod === 'cash' && order.adminFeeStatus !== 'confirmed' && (
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-bold text-orange-900">Admin Fee: ₱{order.adminFee}</p>
                          <p className="text-xs text-orange-700">
                            {order.adminFeeStatus === 'paid' ? 'Awaiting admin confirmation' : 'Please pay admin fee in cash'}
                          </p>
                        </div>
                      </div>
                      {order.adminFeeStatus !== 'paid' && (
                        <button
                          onClick={() => markAdminFeeAsPaid(order.id)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-700"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Available Jobs Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" />
            Available Jobs Nearby ({availableOrders.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {availableOrders.length === 0 ? (
                <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                  <p className="text-gray-500">Searching for new orders...</p>
                </div>
              ) : (
                availableOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">NEW ORDER</div>
                      <p className="text-xs text-gray-400 font-medium">{order.createdAt?.toDate().toLocaleTimeString()}</p>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">{order.customRequest}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      {order.deliveryAddress}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Delivery Fee</p>
                        <p className="text-lg font-bold text-green-600">₱{order.deliveryFee}</p>
                      </div>
                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all"
                      >
                        Accept Job
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Update Price Modal */}
      <AnimatePresence>
        {isUpdatingPrice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsUpdatingPrice(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative overflow-hidden p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Update Item Prices</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Actual Total Price (₱)</label>
                  <input
                    type="number"
                    placeholder="Enter total amount from receipt"
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-2xl font-bold"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500 italic">
                  * Customer will be notified to approve this new price before you can proceed to delivery.
                </p>
                <div className="pt-4 flex gap-4">
                  <button
                    onClick={() => setIsUpdatingPrice(null)}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdatePrice(isUpdatingPrice)}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Submit Price
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {activeChatOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveChatOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Chat with Customer</h3>
                <button onClick={() => setActiveChatOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4">
                <ChatComponent 
                  orderId={activeChatOrder.id} 
                  recipientName="Customer" 
                  recipientRole="customer" 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default RiderDashboard;

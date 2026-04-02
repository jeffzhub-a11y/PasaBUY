import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { Order, OrderItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ShoppingBag, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Package, 
  CreditCard,
  Search,
  Filter,
  Truck,
  Wallet,
  X,
  MessageCircle
} from 'lucide-react';
import MapComponent from '../MapComponent';
import ChatComponent from '../ChatComponent';

const CustomerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [newOrder, setNewOrder] = useState({
    customRequest: '',
    deliveryAddress: '',
    paymentMethod: 'cash' as 'cash' | 'gcash' | 'maya',
    location: { lat: 14.5995, lng: 120.9842 } // Default Manila
  });

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const orderData = {
        customerId: profile.uid,
        status: 'pending',
        items: [],
        customRequest: newOrder.customRequest,
        deliveryAddress: newOrder.deliveryAddress,
        deliveryLocation: newOrder.location,
        deliveryFee: 50, // Base fare
        adminFee: 10,
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: 'unpaid',
        customerApprovedPrices: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      setIsNewOrderModalOpen(false);
      setNewOrder({ customRequest: '', deliveryAddress: '', paymentMethod: 'cash', location: { lat: 14.5995, lng: 120.9842 } });
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const approvePrices = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        customerApprovedPrices: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error approving prices:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'purchasing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivering': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.displayName}!</h2>
            <p className="text-gray-500">Need something today? Our riders are ready to help.</p>
          </div>
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            New Order
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Orders', value: orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length, icon: <Truck className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
            { label: 'Wallet Balance', value: `₱${profile?.walletBalance || 0}`, icon: <Wallet className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
            { label: 'Total Spent', value: `₱${orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0)}`, icon: <CreditCard className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Active Orders Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Your Orders</h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white rounded-xl border border-gray-100 text-gray-600">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white rounded-xl border border-gray-100 text-gray-600">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {orders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center"
                >
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">No orders yet</h4>
                  <p className="text-gray-500 mb-6">Place your first order and let us handle the shopping!</p>
                  <button
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Create New Order
                  </button>
                </motion.div>
              ) : (
                orders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                              {order.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                              ID: {order.id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">Custom Request</h4>
                          <p className="text-gray-600 text-sm line-clamp-2">{order.customRequest}</p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            {order.deliveryAddress}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4 text-green-500" />
                            {order.paymentMethod.toUpperCase()}
                          </div>
                        </div>

                        {order.status === 'purchasing' && !order.customerApprovedPrices && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <AlertCircle className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-sm font-bold text-blue-900">Prices Updated</p>
                                <p className="text-xs text-blue-700">Rider has updated the item prices. Please approve to continue.</p>
                              </div>
                            </div>
                            <button
                              onClick={() => approvePrices(order.id)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700"
                            >
                              Approve
                            </button>
                          </motion.div>
                        )}
                      </div>

                        <div className="lg:w-48 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                          <div>
                            <p className="text-xs text-gray-400 font-medium mb-1">Estimated Total</p>
                            <p className="text-2xl font-bold text-gray-900">₱{order.totalPrice || '---'}</p>
                          </div>
                          <div className="space-y-2 mt-4">
                            {order.riderId && !['completed', 'cancelled'].includes(order.status) && (
                              <button 
                                onClick={() => setActiveChatOrder(order)}
                                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 p-2 rounded-xl transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" /> Chat Rider
                              </button>
                            )}
                            <button className="w-full flex items-center justify-center gap-2 text-gray-600 font-bold text-sm hover:bg-gray-50 p-2 rounded-xl transition-colors">
                              View Details <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* New Order Modal */}
      <AnimatePresence>
        {isNewOrderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsNewOrderModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Create New Order</h3>
                <button onClick={() => setIsNewOrderModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-8 space-y-6 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">What do you need?</label>
                  <textarea
                    required
                    placeholder="List your items here (e.g. 2kg Rice, 1L Milk, 12pcs Eggs...)"
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all min-h-[120px]"
                    value={newOrder.customRequest}
                    onChange={(e) => setNewOrder({ ...newOrder, customRequest: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Delivery Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="House No, Street, Barangay"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        value={newOrder.deliveryAddress}
                        onChange={(e) => setNewOrder({ ...newOrder, deliveryAddress: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['cash', 'gcash', 'maya'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setNewOrder({ ...newOrder, paymentMethod: method as any })}
                          className={`
                            py-3 rounded-xl text-xs font-bold border transition-all capitalize
                            ${newOrder.paymentMethod === method 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-600'}
                          `}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Pin Location</label>
                  <MapComponent 
                    center={[newOrder.location.lat, newOrder.location.lng]} 
                    height="200px"
                    onLocationSelect={(lat, lng) => setNewOrder({ ...newOrder, location: { lat, lng } })}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Place Order
                  </button>
                </div>
              </form>
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
                <h3 className="text-xl font-bold text-gray-900">Chat with Rider</h3>
                <button onClick={() => setActiveChatOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4">
                <ChatComponent 
                  orderId={activeChatOrder.id} 
                  recipientName="Rider" 
                  recipientRole="rider" 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CustomerDashboard;


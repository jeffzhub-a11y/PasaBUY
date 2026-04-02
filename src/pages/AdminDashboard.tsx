import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { Order, UserProfile, Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  DollarSign,
  Search,
  Filter,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'transactions'>('overview');

  useEffect(() => {
    if (!profile) return;

    // Listen for all orders
    const unsubscribeOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50)),
      (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      }
    );

    // Listen for all users
    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), limit(50)),
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserProfile)));
      }
    );

    // Listen for all transactions
    const unsubscribeTransactions = onSnapshot(
      query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50)),
      (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeUsers();
      unsubscribeTransactions();
    };
  }, [profile]);

  const verifyRider = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: true
      });
    } catch (error) {
      console.error("Error verifying rider:", error);
    }
  };

  const confirmAdminFee = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        adminFeeStatus: 'confirmed',
        updatedAt: serverTimestamp()
      });
      alert("Admin fee payment confirmed!");
    } catch (error) {
      console.error("Error confirming admin fee:", error);
    }
  };

  const stats = [
    { label: 'Total Revenue', value: `₱${transactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
    { label: 'Total Orders', value: orders.length, icon: <ShoppingBag className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Users', value: users.length, icon: <Users className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
    { label: 'Pending Verification', value: users.filter(u => u.role === 'rider' && !u.isVerified).length, icon: <ShieldCheck className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Control Panel</h2>
            <p className="text-gray-500">Monitor and manage the entire PasaBUY ecosystem.</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            {['overview', 'users', 'orders', 'transactions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize
                  ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
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

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                <button className="text-blue-600 font-bold text-sm hover:underline">View All</button>
              </div>
              <div className="divide-y divide-gray-50">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{order.deliveryAddress}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₱{order.totalPrice || '---'}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' : 
                        order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Financial Transactions</h3>
                <button className="text-blue-600 font-bold text-sm hover:underline">View All</button>
              </div>
              <div className="divide-y divide-gray-50">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        tx.type === 'earning' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 capitalize">{tx.type}</p>
                        <p className="text-xs text-gray-500">{tx.createdAt?.toDate().toLocaleString()}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${tx.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'earning' ? '+' : '-'}₱{tx.amount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: User Management */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Rider Verification</h3>
              </div>
              <div className="p-6 space-y-4">
                {users.filter(u => u.role === 'rider' && !u.isVerified).length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">No pending verifications</p>
                ) : (
                  users.filter(u => u.role === 'rider' && !u.isVerified).map((rider) => (
                    <div key={rider.uid} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex items-center gap-3">
                        <img src={rider.photoURL} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{rider.displayName}</p>
                          <p className="text-xs text-gray-500">{rider.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => verifyRider(rider.uid)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                        >
                          Verify
                        </button>
                        <button className="flex-1 bg-white text-red-600 border border-red-100 py-2 rounded-xl text-xs font-bold hover:bg-red-50 transition-all">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Pending Admin Fees (Cash)</h3>
              </div>
              <div className="p-6 space-y-4">
                {orders.filter(o => o.paymentMethod === 'cash' && o.adminFeeStatus === 'paid').length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">No pending cash fees</p>
                ) : (
                  orders.filter(o => o.paymentMethod === 'cash' && o.adminFeeStatus === 'paid').map((order) => (
                    <div key={order.id} className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Order #{order.id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-gray-500">Rider: {order.riderId?.slice(-6).toUpperCase()}</p>
                        </div>
                        <p className="font-black text-orange-600">₱{order.adminFee}</p>
                      </div>
                      <button 
                        onClick={() => confirmAdminFee(order.id)}
                        className="w-full bg-orange-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-orange-700 transition-all"
                      >
                        Confirm Receipt
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Platform Settings</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Base Delivery Fee</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-black text-gray-900">₱50.00</p>
                    <button className="text-blue-600 text-xs font-bold">Edit</button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Admin Commission</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-black text-gray-900">20%</p>
                    <button className="text-blue-600 text-xs font-bold">Edit</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

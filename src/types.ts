export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'rider' | 'seller' | 'admin';
  photoURL: string;
  isVerified: boolean;
  walletBalance: number;
}

export interface OrderItem {
  description: string;
  quantity: number;
  unit: string;
  price?: number;
}

export interface Order {
  id: string;
  customerId: string;
  riderId?: string;
  sellerId?: string;
  status: 'pending' | 'accepted' | 'purchasing' | 'delivering' | 'completed' | 'cancelled';
  items: OrderItem[];
  customRequest?: string;
  deliveryAddress: string;
  deliveryLocation: {
    lat: number;
    lng: number;
  };
  totalPrice?: number;
  deliveryFee: number;
  adminFee: number;
  adminFeeStatus?: 'pending' | 'paid' | 'confirmed';
  paymentMethod: 'cash' | 'gcash' | 'maya';
  paymentStatus: 'unpaid' | 'paid' | 'verified';
  receiptURL?: string;
  proofOfPurchaseURL?: string;
  proofOfDeliveryURL?: string;
  customerApprovedPrices: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  imageURL: string;
  category: string;
  isAvailable: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  orderId?: string;
  amount: number;
  type: 'earning' | 'withdrawal' | 'commission' | 'payment';
  status: 'pending' | 'completed' | 'failed';
  createdAt: any;
}

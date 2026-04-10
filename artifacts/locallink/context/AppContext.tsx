import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, clearToken, setToken } from "../lib/api";

export type UserRole = "seeker" | "provider";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  joinedAt: string;
  completedJobs: number;
  earnings?: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

export type ServiceCategory =
  | "tutoring"
  | "tailoring"
  | "homefood"
  | "repair"
  | "cleaning"
  | "beauty"
  | "gardening"
  | "plumbing";

export interface ServiceListing {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  providerRating: number;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number;
  priceType: "hourly" | "fixed" | "negotiable";
  location: string;
  latitude: number;
  longitude: number;
  distance?: number;
  images?: string[];
  availability: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  reviewCount: number;
}

export type RequestStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export interface PaymentEscrow {
  amount: number;
  status: "held" | "released" | "refunded";
  transactionId: string;
}

export interface ServiceRequest {
  id: string;
  listingId: string;
  seekerId: string;
  providerId: string;
  seekerName: string;
  providerName: string;
  seekerAvatar?: string;
  providerAvatar?: string;
  serviceTitle: string;
  serviceCategory: ServiceCategory;
  status: RequestStatus;
  message: string;
  scheduledDate?: string;
  price: number;
  escrow: PaymentEscrow;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  requestId?: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantAvatars?: Record<string, string>;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface Review {
  id: string;
  providerId: string;
  seekerId: string;
  seekerName: string;
  seekerAvatar?: string;
  listingId: string;
  requestId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type:
    | "request_received"
    | "request_accepted"
    | "request_completed"
    | "message"
    | "payment"
    | "review";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, string>;
}

interface AppContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userLocation: UserLocation | null;
  setUserLocation: (loc: UserLocation) => Promise<void>;
  listings: ServiceListing[];
  requests: ServiceRequest[];
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  notifications: Notification[];
  reviews: Review[];
  login: (user: UserProfile, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addListing: (listing: ServiceListing) => Promise<void>;
  updateListing: (id: string, updates: Partial<ServiceListing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  createRequest: (request: ServiceRequest) => Promise<void>;
  updateRequest: (id: string, status: RequestStatus) => Promise<void>;
  sendMessage: (msg: ChatMessage) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  addReview: (review: Review) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  getUnreadNotificationCount: () => number;
  refreshListings: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

function mapApiListing(l: any): ServiceListing {
  return {
    id: l.id,
    providerId: l.providerId,
    providerName: l.providerName,
    providerRating: l.providerRating ?? 0,
    title: l.title,
    description: l.description,
    category: l.category,
    price: l.price,
    priceType: l.priceType ?? "hourly",
    location: l.location,
    latitude: l.latitude,
    longitude: l.longitude,
    availability: l.availabilityDays ?? l.availability ?? [],
    tags: l.tags ?? [],
    isActive: l.isActive ?? true,
    createdAt: l.createdAt ?? new Date().toISOString(),
    reviewCount: l.reviewCount ?? 0,
  };
}

function mapApiRequest(r: any): ServiceRequest {
  return {
    id: r.id,
    listingId: r.listingId,
    seekerId: r.seekerId,
    providerId: r.providerId,
    seekerName: r.seekerName,
    providerName: r.providerName,
    serviceTitle: r.serviceTitle,
    serviceCategory: r.serviceCategory,
    status: r.status,
    message: r.message,
    scheduledDate: r.scheduledDate ?? undefined,
    price: r.price,
    escrow: {
      amount: r.escrowAmount ?? r.price,
      status: r.escrowStatus ?? "held",
      transactionId: r.escrowTransactionId ?? "",
    },
    createdAt: r.createdAt ?? new Date().toISOString(),
    updatedAt: r.updatedAt ?? new Date().toISOString(),
  };
}

function mapApiConversation(c: any): Conversation {
  const participantIds: string[] = (c.participants ?? []).map((p: any) => p.userId);
  const participantNames: Record<string, string> = {};
  for (const p of c.participants ?? []) {
    participantNames[p.userId] = p.userName;
  }
  return {
    id: c.id,
    requestId: c.requestId ?? undefined,
    participantIds,
    participantNames,
    lastMessage: c.lastMessage ?? undefined,
    lastMessageTime: c.lastMessageTime ?? undefined,
    unreadCount: c.unreadCount ?? 0,
  };
}

function mapApiMessage(m: any): ChatMessage {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName: m.senderName,
    text: m.text,
    timestamp: m.createdAt ?? new Date().toISOString(),
    read: m.isRead ?? false,
  };
}

function mapApiReview(r: any): Review {
  return {
    id: r.id,
    providerId: r.providerId,
    seekerId: r.seekerId,
    seekerName: r.seekerName,
    listingId: r.listingId,
    requestId: r.requestId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt ?? new Date().toISOString(),
  };
}

function mapApiNotification(n: any): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.isRead ?? false,
    createdAt: n.createdAt ?? new Date().toISOString(),
    data: n.data ?? undefined,
  };
}

function mapApiUser(u: any): UserProfile {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? undefined,
    role: u.role,
    bio: u.bio ?? undefined,
    location: u.location ?? undefined,
    rating: u.rating ?? 0,
    reviewCount: u.reviewCount ?? 0,
    isVerified: u.isVerified ?? false,
    joinedAt: u.joinedAt ?? u.createdAt ?? new Date().toISOString(),
    completedJobs: u.completedJobs ?? 0,
    earnings: u.earnings ?? 0,
  };
}

const SEED_LISTINGS: ServiceListing[] = [
  {
    id: "seed_l1",
    providerId: "seed_p1",
    providerName: "Rohan Sharma",
    providerRating: 4.9,
    title: "Maths & Science Tutor (10th–12th)",
    description: "Experienced tutor for SSC and HSC students. Algebra, Calculus, Physics and Chemistry. Home visits available in Mulund and nearby areas.",
    category: "tutoring",
    price: 500,
    priceType: "hourly",
    location: "Mulund West, Mumbai",
    latitude: 19.1726,
    longitude: 72.9538,
    availability: ["Mon", "Wed", "Fri", "Sat"],
    tags: ["maths", "science", "SSC", "HSC"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reviewCount: 24,
    distance: 0.5,
  },
  {
    id: "seed_l2",
    providerId: "seed_p2",
    providerName: "Sunita Joshi",
    providerRating: 4.8,
    title: "Custom Tailoring & Alterations",
    description: "Professional tailor with 12 years of experience. Salwar suits, sarees, kurtas, blouses and western wear. Quick turnaround guaranteed.",
    category: "tailoring",
    price: 800,
    priceType: "fixed",
    location: "Mulund East, Mumbai",
    latitude: 19.1700,
    longitude: 72.9580,
    availability: ["Tue", "Thu", "Sat", "Sun"],
    tags: ["tailoring", "blouse", "salwar", "alterations"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewCount: 41,
    distance: 0.8,
  },
  {
    id: "seed_l3",
    providerId: "seed_p3",
    providerName: "Priya Kulkarni",
    providerRating: 4.95,
    title: "Home-Cooked Maharashtrian Tiffin",
    description: "Fresh, home-cooked authentic Maharashtrian food. Daily tiffin service, special Puran Poli, Ukadiche Modak for festivals. Veg options only.",
    category: "homefood",
    price: 200,
    priceType: "fixed",
    location: "Mulund West, Mumbai",
    latitude: 19.1750,
    longitude: 72.9510,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    tags: ["tiffin", "maharashtrian", "veg", "homemade"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    reviewCount: 67,
    distance: 0.4,
  },
  {
    id: "seed_l4",
    providerId: "seed_p4",
    providerName: "Mahesh Patil",
    providerRating: 4.7,
    title: "Home Repair & Handyman Services",
    description: "Licensed handyman with 10+ years experience in Mumbai. Plumbing, electrical, carpentry, AC servicing and general repairs.",
    category: "repair",
    price: 600,
    priceType: "hourly",
    location: "Mulund Colony, Mumbai",
    latitude: 19.1680,
    longitude: 72.9600,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    tags: ["handyman", "plumbing", "electrical", "carpentry"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    reviewCount: 33,
    distance: 1.1,
  },
  {
    id: "seed_l5",
    providerId: "seed_p5",
    providerName: "Kavita Desai",
    providerRating: 4.85,
    title: "Deep Cleaning & Home Organization",
    description: "Professional deep cleaning services for flats and bungalows. Move-in/move-out, festive cleaning, sofa and carpet cleaning. Eco-friendly products.",
    category: "cleaning",
    price: 2000,
    priceType: "fixed",
    location: "Mulund West, Mumbai",
    latitude: 19.1735,
    longitude: 72.9525,
    availability: ["Mon", "Wed", "Fri", "Sat", "Sun"],
    tags: ["cleaning", "deep clean", "sofa", "eco-friendly"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reviewCount: 19,
    distance: 0.6,
  },
  {
    id: "seed_l6",
    providerId: "seed_p6",
    providerName: "Anita Nair",
    providerRating: 4.9,
    title: "Bridal Makeup & Beauty at Home",
    description: "Professional makeup artist for weddings, engagements, parties and events. Offers bridal packages, mehndi, and hair styling at your doorstep.",
    category: "beauty",
    price: 3500,
    priceType: "fixed",
    location: "Mulund East, Mumbai",
    latitude: 19.1710,
    longitude: 72.9560,
    availability: ["Sat", "Sun", "Wed", "Thu"],
    tags: ["bridal", "makeup", "mehndi", "hair"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    reviewCount: 58,
    distance: 0.9,
  },
  {
    id: "seed_l7",
    providerId: "seed_p7",
    providerName: "Raju Tiwari",
    providerRating: 4.6,
    title: "Garden & Plant Care Services",
    description: "Complete terrace garden, balcony garden and indoor plant care. Planting, pruning, watering schedules, fertiliser advice, and seasonal care.",
    category: "gardening",
    price: 500,
    priceType: "hourly",
    location: "Bhandup West, Mumbai",
    latitude: 19.1490,
    longitude: 72.9512,
    availability: ["Sat", "Sun"],
    tags: ["garden", "terrace", "plants", "balcony"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    reviewCount: 12,
    distance: 2.5,
  },
  {
    id: "seed_l8",
    providerId: "seed_p8",
    providerName: "Suresh Kamble",
    providerRating: 4.75,
    title: "Plumbing & Pipe Fitting",
    description: "Expert plumber for all types of plumbing work — leakage, tap replacement, sanitary fittings, water heater installation, and drainage cleaning.",
    category: "plumbing",
    price: 700,
    priceType: "hourly",
    location: "Mulund East, Mumbai",
    latitude: 19.1715,
    longitude: 72.9595,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    tags: ["plumbing", "leakage", "tap", "drainage"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    reviewCount: 28,
    distance: 1.0,
  },
  {
    id: "seed_l9",
    providerId: "seed_p9",
    providerName: "Meena Iyer",
    providerRating: 4.8,
    title: "Spoken English & Communication Classes",
    description: "Improve your English speaking and communication skills. Classes for professionals, students and homemakers. Group or individual sessions available.",
    category: "tutoring",
    price: 400,
    priceType: "hourly",
    location: "Mulund West, Mumbai",
    latitude: 19.1740,
    longitude: 72.9530,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    tags: ["english", "spoken", "communication", "classes"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    reviewCount: 37,
    distance: 0.7,
  },
  {
    id: "seed_l10",
    providerId: "seed_p10",
    providerName: "Deepak Verma",
    providerRating: 4.7,
    title: "AC Servicing & Repair",
    description: "Certified AC technician — servicing, gas refilling, repair for all brands. Window, split, and cassette ACs. Same-day service available in Mulund.",
    category: "repair",
    price: 800,
    priceType: "fixed",
    location: "Mulund Colony, Mumbai",
    latitude: 19.1660,
    longitude: 72.9610,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    tags: ["AC", "servicing", "repair", "gas-refill"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    reviewCount: 45,
    distance: 1.3,
  },
];

const SEED_REVIEWS: Review[] = [
  {
    id: "seed_r1",
    providerId: "seed_p1",
    seekerId: "seed_s1",
    seekerName: "Arjun Mehta",
    listingId: "seed_l1",
    rating: 5,
    comment: "Rohan bhai is an excellent tutor! My daughter's marks improved from 65% to 89%. Highly recommended for Maths!",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "seed_r2",
    providerId: "seed_p2",
    seekerId: "seed_s2",
    seekerName: "Pooja Sawant",
    listingId: "seed_l2",
    rating: 5,
    comment: "Sunita tai did a perfect job on my wedding blouse. Exact fit and delivered in 2 days!",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "seed_r3",
    providerId: "seed_p3",
    seekerId: "seed_s3",
    seekerName: "Rahul Joshi",
    listingId: "seed_l3",
    rating: 5,
    comment: "Best tiffin service in Mulund! Fresh food, on time, very hygienic. Just like ghar ka khana.",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(null);
  const [listings, setListings] = useState<ServiceListing[]>(SEED_LISTINGS);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);

  useEffect(() => {
    const init = async () => {
      try {
        const storedLoc = await AsyncStorage.getItem("@locallink:user_location");
        if (storedLoc) {
          setUserLocationState(JSON.parse(storedLoc));
        }
        const user = await api.auth.me();
        setCurrentUser(mapApiUser(user));
        await Promise.all([
          loadListings(),
          loadRequests(),
          loadConversations(),
          loadNotifications(),
        ]);
      } catch {
        setCurrentUser(null);
        await loadListings();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const setUserLocation = useCallback(async (loc: UserLocation) => {
    setUserLocationState(loc);
    await AsyncStorage.setItem("@locallink:user_location", JSON.stringify(loc));
  }, []);

  const loadListings = async () => {
    try {
      const data = await api.listings.list();
      if (data.length > 0) {
        setListings(data.map(mapApiListing));
      }
    } catch {}
  };

  const loadRequests = async () => {
    try {
      const data = await api.requests.list();
      setRequests(data.map(mapApiRequest));
    } catch {}
  };

  const loadConversations = async () => {
    try {
      const data = await api.conversations.list();
      setConversations(data.map(mapApiConversation));
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data.map(mapApiNotification));
    } catch {}
  };

  const login = useCallback(async (user: UserProfile, token?: string) => {
    if (token) {
      await setToken(token);
    }
    setCurrentUser(user);
    try {
      await Promise.all([loadListings(), loadRequests(), loadConversations(), loadNotifications()]);
    } catch {}
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await clearToken();
    setRequests([]);
    setConversations([]);
    setMessages({});
    setNotifications([]);
    await loadListings();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const updated = await api.auth.updateMe(updates);
      setCurrentUser(mapApiUser(updated));
    } catch {
      setCurrentUser((prev) => prev ? { ...prev, ...updates } : prev);
    }
  }, [currentUser]);

  const addListing = useCallback(async (listing: ServiceListing) => {
    try {
      const created = await api.listings.create({
        title: listing.title,
        description: listing.description,
        category: listing.category,
        price: listing.price,
        priceType: listing.priceType,
        location: listing.location,
        latitude: listing.latitude,
        longitude: listing.longitude,
        availabilityDays: listing.availability,
        tags: listing.tags,
      });
      const mapped = mapApiListing(created);
      setListings((prev) => [mapped, ...prev]);
    } catch {
      setListings((prev) => [listing, ...prev]);
    }
  }, []);

  const updateListing = useCallback(async (id: string, updates: Partial<ServiceListing>) => {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
    try {
      const apiUpdates: any = { ...updates };
      if (updates.availability) {
        apiUpdates.availabilityDays = updates.availability;
        delete apiUpdates.availability;
      }
      await api.listings.update(id, apiUpdates);
    } catch {}
  }, []);

  const deleteListing = useCallback(async (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.listings.delete(id);
    } catch {}
  }, []);

  const createRequest = useCallback(async (request: ServiceRequest) => {
    try {
      const created = await api.requests.create({
        listingId: request.listingId,
        providerId: request.providerId,
        message: request.message,
        scheduledDate: request.scheduledDate,
        price: request.price,
      });
      const mapped = mapApiRequest(created);
      setRequests((prev) => [mapped, ...prev]);

      const convId = `conv_${created.id}`;
      const newConv: Conversation = {
        id: convId,
        requestId: created.id,
        participantIds: [request.seekerId, request.providerId],
        participantNames: {
          [request.seekerId]: request.seekerName,
          [request.providerId]: request.providerName,
        },
        unreadCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
    } catch {
      setRequests((prev) => [request, ...prev]);
    }
  }, []);

  const updateRequest = useCallback(async (id: string, status: RequestStatus) => {
    setRequests((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      let escrow = { ...r.escrow };
      if (status === "completed") escrow = { ...escrow, status: "released" };
      if (status === "cancelled") escrow = { ...escrow, status: "refunded" };
      return { ...r, status, escrow, updatedAt: new Date().toISOString() };
    }));
    try {
      await api.requests.updateStatus(id, status);
      await loadNotifications();
    } catch {}
  }, []);

  const sendMessage = useCallback(async (msg: ChatMessage) => {
    const convMessages = messages[msg.conversationId] ?? [];
    setMessages((prev) => ({
      ...prev,
      [msg.conversationId]: [...convMessages, msg],
    }));
    setConversations((prev) => prev.map((c) =>
      c.id === msg.conversationId
        ? { ...c, lastMessage: msg.text, lastMessageTime: msg.timestamp }
        : c
    ));
    try {
      await api.conversations.sendMessage(msg.conversationId, msg.text);
    } catch {}
  }, [messages]);

  const markConversationRead = useCallback(async (conversationId: string) => {
    setConversations((prev) => prev.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ));
    setMessages((prev) => {
      const updated: Record<string, ChatMessage[]> = {};
      for (const [key, msgs] of Object.entries(prev)) {
        updated[key] = key === conversationId ? msgs.map((m) => ({ ...m, read: true })) : msgs;
      }
      return updated;
    });
    try {
      const data = await api.conversations.messages(conversationId);
      setMessages((prev) => ({
        ...prev,
        [conversationId]: data.map(mapApiMessage),
      }));
    } catch {}
  }, []);

  const addReview = useCallback(async (review: Review) => {
    setReviews((prev) => [review, ...prev]);
    try {
      await api.reviews.create({
        providerId: review.providerId,
        listingId: review.listingId,
        requestId: review.requestId ?? "",
        rating: review.rating,
        comment: review.comment,
      });
      await loadListings();
    } catch {}
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    try {
      await api.notifications.markRead(id);
    } catch {}
  }, []);

  const getUnreadNotificationCount = useCallback(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const refreshListings = useCallback(loadListings, []);
  const refreshRequests = useCallback(loadRequests, []);
  const refreshConversations = useCallback(loadConversations, []);
  const refreshNotifications = useCallback(loadNotifications, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        userLocation,
        setUserLocation,
        listings,
        requests,
        conversations,
        messages,
        notifications,
        reviews,
        login,
        logout,
        updateProfile,
        addListing,
        updateListing,
        deleteListing,
        createRequest,
        updateRequest,
        sendMessage,
        markConversationRead,
        addReview,
        markNotificationRead,
        getUnreadNotificationCount,
        refreshListings,
        refreshRequests,
        refreshConversations,
        refreshNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

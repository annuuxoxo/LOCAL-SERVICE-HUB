import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
  listings: ServiceListing[];
  requests: ServiceRequest[];
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  notifications: Notification[];
  reviews: Review[];
  login: (user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addListing: (listing: ServiceListing) => Promise<void>;
  updateListing: (
    id: string,
    updates: Partial<ServiceListing>
  ) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  createRequest: (request: ServiceRequest) => Promise<void>;
  updateRequest: (id: string, status: RequestStatus) => Promise<void>;
  sendMessage: (msg: ChatMessage) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  addReview: (review: Review) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  getUnreadNotificationCount: () => number;
}

const AppContext = createContext<AppContextType | null>(null);

const SEED_LISTINGS: ServiceListing[] = [
  {
    id: "l1",
    providerId: "p1",
    providerName: "Maria Santos",
    providerRating: 4.9,
    title: "Math & Science Tutoring",
    description:
      "Expert tutoring for K-12 and college students. Specialized in Algebra, Calculus, Physics, and Chemistry. Patient, experienced, and results-oriented.",
    category: "tutoring",
    price: 35,
    priceType: "hourly",
    location: "Brooklyn, NY",
    latitude: 40.6782,
    longitude: -73.9442,
    availability: ["Mon", "Wed", "Fri", "Sat"],
    tags: ["math", "science", "K-12", "college"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reviewCount: 24,
    distance: 0.8,
  },
  {
    id: "l2",
    providerId: "p2",
    providerName: "Aisha Thompson",
    providerRating: 4.8,
    title: "Custom Tailoring & Alterations",
    description:
      "Professional tailor with 15 years of experience. Wedding dresses, suits, casual wear. Quick turnaround and perfect fit guaranteed.",
    category: "tailoring",
    price: 50,
    priceType: "fixed",
    location: "Queens, NY",
    latitude: 40.7282,
    longitude: -73.7949,
    availability: ["Tue", "Thu", "Sat", "Sun"],
    tags: ["tailoring", "alterations", "wedding", "suits"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewCount: 41,
    distance: 1.2,
  },
  {
    id: "l3",
    providerId: "p3",
    providerName: "Priya Patel",
    providerRating: 4.95,
    title: "Authentic Home-Cooked Indian Meals",
    description:
      "Fresh, home-cooked authentic Indian cuisine. Meal prep, tiffin service, and catering for small events. Vegan and gluten-free options available.",
    category: "homefood",
    price: 15,
    priceType: "fixed",
    location: "Jersey City, NJ",
    latitude: 40.7178,
    longitude: -74.0431,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    tags: ["indian food", "meal prep", "vegan", "catering"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    reviewCount: 67,
    distance: 2.1,
  },
  {
    id: "l4",
    providerId: "p4",
    providerName: "Carlos Rivera",
    providerRating: 4.7,
    title: "Home Repair & Handyman Services",
    description:
      "Licensed handyman with 10+ years experience. Plumbing, electrical, carpentry, painting, and general repairs. Licensed and insured.",
    category: "repair",
    price: 75,
    priceType: "hourly",
    location: "Bronx, NY",
    latitude: 40.8448,
    longitude: -73.8648,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    tags: ["handyman", "plumbing", "electrical", "carpentry"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    reviewCount: 33,
    distance: 3.5,
  },
  {
    id: "l5",
    providerId: "p5",
    providerName: "Sophie Chen",
    providerRating: 4.85,
    title: "Deep Cleaning & Organization",
    description:
      "Professional deep cleaning services. Move-in/move-out, weekly cleaning, and home organization. Eco-friendly products available.",
    category: "cleaning",
    price: 120,
    priceType: "fixed",
    location: "Manhattan, NY",
    latitude: 40.7831,
    longitude: -73.9712,
    availability: ["Mon", "Wed", "Fri", "Sat", "Sun"],
    tags: ["cleaning", "deep clean", "organization", "eco-friendly"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reviewCount: 19,
    distance: 4.2,
  },
  {
    id: "l6",
    providerId: "p6",
    providerName: "James Wilson",
    providerRating: 4.6,
    title: "Garden & Lawn Care",
    description:
      "Complete garden care including lawn mowing, hedge trimming, planting, and seasonal clean-up. Transform your outdoor space.",
    category: "gardening",
    price: 60,
    priceType: "hourly",
    location: "Staten Island, NY",
    latitude: 40.5795,
    longitude: -74.1502,
    availability: ["Sat", "Sun"],
    tags: ["garden", "lawn care", "landscaping", "seasonal"],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    reviewCount: 12,
    distance: 5.8,
  },
];

const SEED_REVIEWS: Review[] = [
  {
    id: "r1",
    providerId: "p1",
    seekerId: "s1",
    seekerName: "Alex Kim",
    listingId: "l1",
    rating: 5,
    comment:
      "Maria is an incredible tutor! My son's grades improved dramatically. Highly recommended!",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "r2",
    providerId: "p2",
    seekerId: "s2",
    seekerName: "Emma Davis",
    listingId: "l2",
    rating: 5,
    comment:
      "Amazing work on my wedding dress alterations. Perfect fit, fast turnaround!",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<ServiceListing[]>(SEED_LISTINGS);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          storedUser,
          storedListings,
          storedRequests,
          storedConvos,
          storedMessages,
          storedNotifications,
          storedReviews,
        ] = await Promise.all([
          AsyncStorage.getItem("currentUser"),
          AsyncStorage.getItem("listings"),
          AsyncStorage.getItem("requests"),
          AsyncStorage.getItem("conversations"),
          AsyncStorage.getItem("messages"),
          AsyncStorage.getItem("notifications"),
          AsyncStorage.getItem("reviews"),
        ]);
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
        if (storedListings) setListings(JSON.parse(storedListings));
        if (storedRequests) setRequests(JSON.parse(storedRequests));
        if (storedConvos) setConversations(JSON.parse(storedConvos));
        if (storedMessages) setMessages(JSON.parse(storedMessages));
        if (storedNotifications)
          setNotifications(JSON.parse(storedNotifications));
        if (storedReviews) setReviews(JSON.parse(storedReviews));
      } catch {}
    };
    loadData();
  }, []);

  const save = useCallback(async (key: string, value: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }, []);

  const login = useCallback(
    async (user: UserProfile) => {
      setCurrentUser(user);
      await save("currentUser", user);
    },
    [save]
  );

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem("currentUser");
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!currentUser) return;
      const updated = { ...currentUser, ...updates };
      setCurrentUser(updated);
      await save("currentUser", updated);
    },
    [currentUser, save]
  );

  const addListing = useCallback(
    async (listing: ServiceListing) => {
      const updated = [listing, ...listings];
      setListings(updated);
      await save("listings", updated);
      const notif: Notification = {
        id: Date.now().toString(),
        type: "request_received",
        title: "Listing Created",
        body: `Your listing "${listing.title}" is now live!`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const updatedNotifs = [notif, ...notifications];
      setNotifications(updatedNotifs);
      await save("notifications", updatedNotifs);
    },
    [listings, notifications, save]
  );

  const updateListing = useCallback(
    async (id: string, updates: Partial<ServiceListing>) => {
      const updated = listings.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      );
      setListings(updated);
      await save("listings", updated);
    },
    [listings, save]
  );

  const deleteListing = useCallback(
    async (id: string) => {
      const updated = listings.filter((l) => l.id !== id);
      setListings(updated);
      await save("listings", updated);
    },
    [listings, save]
  );

  const createRequest = useCallback(
    async (request: ServiceRequest) => {
      const updated = [request, ...requests];
      setRequests(updated);
      await save("requests", updated);

      const convId = `conv_${request.id}`;
      const newConv: Conversation = {
        id: convId,
        requestId: request.id,
        participantIds: [request.seekerId, request.providerId],
        participantNames: {
          [request.seekerId]: request.seekerName,
          [request.providerId]: request.providerName,
        },
        unreadCount: 0,
      };
      const updatedConvs = [newConv, ...conversations];
      setConversations(updatedConvs);
      await save("conversations", updatedConvs);

      const notif: Notification = {
        id: Date.now().toString(),
        type: "request_received",
        title: "New Service Request",
        body: `You have a new request for "${request.serviceTitle}"`,
        read: false,
        createdAt: new Date().toISOString(),
        data: { requestId: request.id },
      };
      const updatedNotifs = [notif, ...notifications];
      setNotifications(updatedNotifs);
      await save("notifications", updatedNotifs);
    },
    [requests, conversations, notifications, save]
  );

  const updateRequest = useCallback(
    async (id: string, status: RequestStatus) => {
      const updated = requests.map((r) => {
        if (r.id !== id) return r;
        let escrow = { ...r.escrow };
        if (status === "completed") escrow = { ...escrow, status: "released" };
        if (status === "cancelled") escrow = { ...escrow, status: "refunded" };
        return { ...r, status, escrow, updatedAt: new Date().toISOString() };
      });
      setRequests(updated);
      await save("requests", updated);

      const req = updated.find((r) => r.id === id);
      if (req) {
        const notif: Notification = {
          id: Date.now().toString(),
          type:
            status === "accepted"
              ? "request_accepted"
              : status === "completed"
                ? "request_completed"
                : "payment",
          title:
            status === "accepted"
              ? "Request Accepted!"
              : status === "completed"
                ? "Service Completed"
                : "Request Updated",
          body:
            status === "accepted"
              ? `${req.providerName} accepted your request for "${req.serviceTitle}"`
              : status === "completed"
                ? `Payment of $${req.price} released from escrow`
                : `Your request status changed to ${status}`,
          read: false,
          createdAt: new Date().toISOString(),
          data: { requestId: id },
        };
        const updatedNotifs = [notif, ...notifications];
        setNotifications(updatedNotifs);
        await save("notifications", updatedNotifs);
      }
    },
    [requests, notifications, save]
  );

  const sendMessage = useCallback(
    async (msg: ChatMessage) => {
      const convMessages = messages[msg.conversationId] ?? [];
      const updatedMessages = {
        ...messages,
        [msg.conversationId]: [...convMessages, msg],
      };
      setMessages(updatedMessages);
      await save("messages", updatedMessages);

      const updatedConvs = conversations.map((c) =>
        c.id === msg.conversationId
          ? {
              ...c,
              lastMessage: msg.text,
              lastMessageTime: msg.timestamp,
              unreadCount:
                c.unreadCount +
                (msg.senderId !== currentUser?.id ? 1 : 0),
            }
          : c
      );
      setConversations(updatedConvs);
      await save("conversations", updatedConvs);
    },
    [messages, conversations, currentUser, save]
  );

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      const updatedMessages: Record<string, ChatMessage[]> = {};
      for (const [key, msgs] of Object.entries(messages)) {
        updatedMessages[key] =
          key === conversationId
            ? msgs.map((m) => ({ ...m, read: true }))
            : msgs;
      }
      setMessages(updatedMessages);
      await save("messages", updatedMessages);

      const updatedConvs = conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      setConversations(updatedConvs);
      await save("conversations", updatedConvs);
    },
    [messages, conversations, save]
  );

  const addReview = useCallback(
    async (review: Review) => {
      const updated = [review, ...reviews];
      setReviews(updated);
      await save("reviews", updated);

      const allForProvider = updated.filter(
        (r) => r.providerId === review.providerId
      );
      const avgRating =
        allForProvider.reduce((sum, r) => sum + r.rating, 0) /
        allForProvider.length;
      const updatedListings = listings.map((l) =>
        l.providerId === review.providerId
          ? {
              ...l,
              providerRating: Math.round(avgRating * 10) / 10,
              reviewCount: allForProvider.length,
            }
          : l
      );
      setListings(updatedListings);
      await save("listings", updatedListings);

      const notif: Notification = {
        id: Date.now().toString(),
        type: "review",
        title: "New Review",
        body: `${review.seekerName} left you a ${review.rating}-star review!`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const updatedNotifs = [notif, ...notifications];
      setNotifications(updatedNotifs);
      await save("notifications", updatedNotifs);
    },
    [reviews, listings, notifications, save]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updated);
      await save("notifications", updated);
    },
    [notifications, save]
  );

  const getUnreadNotificationCount = useCallback(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
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

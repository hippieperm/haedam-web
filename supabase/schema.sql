-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('USER', 'SELLER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE item_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'SCHEDULED', 'LIVE', 'PAUSED', 'ENDED', 'SETTLED', 'CANCELED');
CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE shipping_method AS ENUM ('DIRECT_PICKUP', 'COURIER', 'QUICK', 'FREIGHT');
CREATE TYPE shipping_status AS ENUM ('PENDING', 'PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED');
CREATE TYPE payout_status AS ENUM ('SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');
CREATE TYPE report_target AS ENUM ('ITEM', 'BID', 'USER');
CREATE TYPE report_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
CREATE TYPE notification_type AS ENUM ('BID_PLACED', 'OUTBID', 'AUCTION_WON', 'AUCTION_LOST', 'PAYMENT_REMINDER', 'PAYMENT_RECEIVED', 'ITEM_SHIPPED', 'ITEM_DELIVERED', 'REVIEW_RECEIVED', 'ADMIN_MESSAGE', 'SYSTEM_NOTICE');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'USER',
  name TEXT,
  nickname TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expiry TIMESTAMP WITH TIME ZONE,
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Addresses table
CREATE TABLE public.addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  receiver TEXT NOT NULL,
  phone TEXT NOT NULL,
  addr1 TEXT NOT NULL,
  addr2 TEXT,
  postcode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  species TEXT NOT NULL,
  style TEXT,
  size_class TEXT,
  height_cm FLOAT,
  crown_width_cm FLOAT,
  trunk_diameter_cm FLOAT,
  age_years_est INTEGER,
  health_notes TEXT,
  origin_notes TEXT,
  care_history TEXT,
  cover_image_url TEXT,
  status item_status DEFAULT 'DRAFT',
  start_price FLOAT NOT NULL,
  current_price FLOAT DEFAULT 0,
  buy_now_price FLOAT,
  reserve_price FLOAT,
  bid_step FLOAT NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_extend_minutes INTEGER,
  shipping_method shipping_method NOT NULL,
  shipping_fee_policy TEXT,
  packaging_notes TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Item media table
CREATE TABLE public.item_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  type media_type NOT NULL,
  sort INTEGER DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bids table
CREATE TABLE public.bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) NOT NULL,
  bidder_id UUID REFERENCES public.users(id) NOT NULL,
  amount FLOAT NOT NULL,
  is_proxy BOOLEAN DEFAULT false,
  max_proxy_amount FLOAT,
  is_winning BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  item_id UUID REFERENCES public.items(id) UNIQUE NOT NULL,
  buyer_id UUID REFERENCES public.users(id) NOT NULL,
  address_id UUID REFERENCES public.addresses(id),
  final_price FLOAT NOT NULL,
  buyer_premium FLOAT NOT NULL,
  seller_fee FLOAT NOT NULL,
  vat FLOAT DEFAULT 0,
  shipping_fee FLOAT DEFAULT 0,
  total_amount FLOAT NOT NULL,
  payment_status payment_status NOT NULL,
  payment_method TEXT,
  payment_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  shipping_status shipping_status DEFAULT 'PENDING',
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  escrow BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  canceled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT
);

-- Payouts table
CREATE TABLE public.payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) UNIQUE NOT NULL,
  seller_id UUID REFERENCES public.users(id) NOT NULL,
  amount FLOAT NOT NULL,
  status payout_status NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  transaction_id TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watchlists table
CREATE TABLE public.watchlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Reports table
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id) NOT NULL,
  target_type report_target NOT NULL,
  target_id TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id),
  target_item_id UUID REFERENCES public.items(id),
  reason TEXT NOT NULL,
  description TEXT,
  evidence_url TEXT,
  status report_status NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) UNIQUE NOT NULL,
  author_id UUID REFERENCES public.users(id) NOT NULL,
  target_id UUID REFERENCES public.users(id) NOT NULL,
  item_id UUID REFERENCES public.items(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id UUID REFERENCES public.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_item_id UUID REFERENCES public.items(id),
  diff JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table
CREATE TABLE public.tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item tags junction table
CREATE TABLE public.item_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, tag_id)
);

-- Create indexes
CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX idx_items_seller_id ON public.items(seller_id);
CREATE INDEX idx_items_status ON public.items(status);
CREATE INDEX idx_items_starts_at ON public.items(starts_at);
CREATE INDEX idx_items_ends_at ON public.items(ends_at);
CREATE INDEX idx_item_media_item_id ON public.item_media(item_id);
CREATE INDEX idx_bids_item_id ON public.bids(item_id);
CREATE INDEX idx_bids_bidder_id ON public.bids(bidder_id);
CREATE INDEX idx_bids_created_at ON public.bids(created_at);
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_payouts_seller_id ON public.payouts(seller_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX idx_watchlists_item_id ON public.watchlists(item_id);
CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_target_type_target_id ON public.reports(target_type, target_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reviews_author_id ON public.reviews(author_id);
CREATE INDEX idx_reviews_target_id ON public.reviews(target_id);
CREATE INDEX idx_reviews_item_id ON public.reviews(item_id);
CREATE INDEX idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target_type_target_id ON public.audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_item_tags_item_id ON public.item_tags(item_id);
CREATE INDEX idx_item_tags_tag_id ON public.item_tags(tag_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own profile and public profiles
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON public.users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Addresses policies
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- Items policies
CREATE POLICY "Anyone can view published items" ON public.items
  FOR SELECT USING (status IN ('LIVE', 'ENDED', 'SETTLED'));

CREATE POLICY "Sellers can manage own items" ON public.items
  FOR ALL USING (auth.uid() = seller_id);

-- Item media policies
CREATE POLICY "Anyone can view item media" ON public.item_media
  FOR SELECT USING (true);

CREATE POLICY "Item owners can manage media" ON public.item_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.items 
      WHERE items.id = item_media.item_id 
      AND items.seller_id = auth.uid()
    )
  );

-- Bids policies
CREATE POLICY "Anyone can view bids" ON public.bids
  FOR SELECT USING (true);

CREATE POLICY "Users can place bids" ON public.bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view orders for their items" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.items 
      WHERE items.id = orders.item_id 
      AND items.seller_id = auth.uid()
    )
  );

-- Watchlists policies
CREATE POLICY "Users can manage own watchlists" ON public.watchlists
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Anyone can view tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view item tags" ON public.item_tags
  FOR SELECT USING (true);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name, nickname)
  VALUES (
    NEW.id,
    NEW.email,
    'USER',
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

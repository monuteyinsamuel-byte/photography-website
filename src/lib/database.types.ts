type Table<Row, Insert = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: []
}

export type SiteSettingsRow = {
  id: string
  business_name: string | null
  photographer_name: string | null
  logo_path: string | null
  profile_image_path: string | null
  hero_image_path: string | null
  website_title: string | null
  tagline: string | null
  introduction: string | null
  about_text: string | null
  contact_email: string | null
  whatsapp_number: string | null
  location: string | null
  social_links: Record<string, string> | null
  homepage_headline: string | null
  homepage_text: string | null
  website_description: string | null
  default_social_image_path: string | null
  canonical_url: string | null
  currency: string | null
  country: string | null
}

export type GalleryCategoryRow = {
  id: string
  name: string
  slug: string
  sort_order: number
}

export type PortfolioImageRow = {
  id: string
  image_path: string
  caption: string | null
  alt_text: string | null
  category_id: string | null
  sort_order: number
  is_published: boolean
}

export type ServiceRow = {
  id: string
  name: string
  description: string | null
  pricing_type: 'fixed' | 'quote'
  price_amount: number | null
  is_published: boolean
  sort_order: number
}

export type TestimonialRow = {
  id: string
  customer_name: string
  rating: number
  review: string
  photographer_response: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export type JournalArticleRow = {
  id: string
  title: string
  slug: string
  cover_image_path: string | null
  excerpt: string | null
  content: string
  category: string | null
  publication_date: string | null
  seo_description: string | null
  is_published: boolean
}

export type BookingInsert = {
  full_name: string
  phone: string
  email: string
  service_id: string
  preferred_date: string
  preferred_time: string
  event_location: string
  event_description: string
  estimated_budget: number | null
  status: 'pending'
}

export type EnquiryInsert = {
  name: string
  email: string
  phone: string | null
  message: string
}

export interface Database {
  public: {
    Tables: {
      site_settings: Table<SiteSettingsRow>
      gallery_categories: Table<GalleryCategoryRow>
      portfolio_images: Table<PortfolioImageRow>
      services: Table<ServiceRow>
      testimonials: Table<TestimonialRow>
      journal_articles: Table<JournalArticleRow>
      bookings: Table<
        BookingInsert & { id: string },
        BookingInsert
      >
      enquiries: Table<EnquiryInsert & { id: string }, EnquiryInsert>
    }
    Views: Record<string, never>
    Functions: {
      is_current_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_setup_available: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

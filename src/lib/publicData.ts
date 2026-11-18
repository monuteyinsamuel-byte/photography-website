import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import type {
  BookingInsert,
  EnquiryInsert,
  GalleryCategoryRow,
  JournalArticleRow,
  PortfolioImageRow,
  ServiceRow,
  SiteSettingsRow,
  TestimonialRow,
} from './database.types'

export const PORTFOLIO_BUCKET = 'business-images'
export const PORTFOLIO_PAGE_SIZE = 12

export interface Resource<T> {
  data: T | null
  error: string | null
}

function unavailable<T>(): Resource<T> {
  return {
    data: null,
    error:
      'Connect this site to its Supabase project to load published business content.',
  }
}

export async function loadRows<T>(
  query: () => PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<Resource<T>> {
  if (!isSupabaseConfigured()) return unavailable<T>()
  const { data, error } = await query()
  return { data: error ? null : data, error: error?.message ?? null }
}

export function loadSiteSettings() {
  return loadRows<SiteSettingsRow>(() =>
    getSupabaseClient().from('site_settings').select('*').limit(1).maybeSingle(),
  )
}

export function loadCategories() {
  return loadRows<GalleryCategoryRow[]>(() =>
    getSupabaseClient()
      .from('gallery_categories')
      .select('*')
      .order('sort_order')
      .order('name'),
  )
}

export function loadPortfolioPage(page: number, categoryId?: string) {
  const start = page * PORTFOLIO_PAGE_SIZE
  const end = start + PORTFOLIO_PAGE_SIZE - 1
  return loadRows<PortfolioImageRow[]>(() => {
    let query = getSupabaseClient()
      .from('portfolio_images')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .order('id')
      .range(start, end)
    if (categoryId) query = query.eq('category_id', categoryId)
    return query
  })
}

export function loadServices() {
  return loadRows<ServiceRow[]>(() =>
    getSupabaseClient()
      .from('services')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .order('name'),
  )
}

export function loadTestimonials() {
  return loadRows<TestimonialRow[]>(() =>
    getSupabaseClient()
      .from('testimonials')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6),
  )
}

export function loadArticles(limit?: number) {
  return loadRows<JournalArticleRow[]>(() => {
    let query = getSupabaseClient()
      .from('journal_articles')
      .select('*')
      .eq('is_published', true)
      .order('publication_date', { ascending: false })
    if (limit) query = query.limit(limit)
    return query
  })
}

export async function loadHomeContent() {
  const [settings, images, services, testimonials, articles] = await Promise.all([
    loadSiteSettings(),
    loadPortfolioPage(0),
    loadServices(),
    loadTestimonials(),
    loadArticles(3),
  ])
  return { data: { settings, images, services, testimonials, articles }, error: null }
}

export function loadArticle(slug: string) {
  return loadRows<JournalArticleRow>(() =>
    getSupabaseClient()
      .from('journal_articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle(),
  )
}

export async function submitBooking(
  booking: BookingInsert,
): Promise<Resource<{ id: string }>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase is not configured. Configure the project before sending booking requests.',
    }
  }
  const { data, error } = await getSupabaseClient()
    .from('bookings')
    .insert(booking)
    .select('id')
    .single()
  return { data, error: error?.message ?? null }
}

export async function submitEnquiry(
  enquiry: EnquiryInsert,
): Promise<Resource<{ id: string }>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: 'Supabase is not configured. Configure the project before sending enquiries.',
    }
  }
  const { data, error } = await getSupabaseClient()
    .from('enquiries')
    .insert(enquiry)
    .select('id')
    .single()
  return { data, error: error?.message ?? null }
}

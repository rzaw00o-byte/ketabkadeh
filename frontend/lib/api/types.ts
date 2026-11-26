// تایپ‌ها دقیقاً طبق CONTRACT.md بخش ۴ — منطبق با خروجی واقعی API
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export interface Cover {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface BookAuthorRef {
  name: string;
  slug: string;
  role: "author" | "translator";
}

export interface NamedRef {
  name: string;
  slug: string;
}

export interface CategoryRef extends NamedRef {
  breadcrumb: NamedRef[];
}

export interface Edition {
  id: number;
  format: "print" | "ebook";
  price: number;
  stock?: number | null;
  in_stock: boolean;
}

export interface BookListItem {
  id: number;
  title: string;
  slug: string;
  cover: Cover | null;
  authors: BookAuthorRef[];
  price_from: number | null;
  in_stock: boolean;
  formats: ("print" | "ebook")[];
}

export interface BookDetail {
  id: number;
  title: string;
  slug: string;
  isbn: string | null;
  description: string;
  pages: number | null;
  published_year: number | null;
  cover: Cover | null;
  authors: BookAuthorRef[];
  publisher: NamedRef;
  category: CategoryRef;
  editions: Edition[];
  rating: { average: number | null; count: number };
  seo: {
    title: string;
    description: string;
    is_indexable: boolean;
    canonical_path: string;
  };
  updated_at: string;
}
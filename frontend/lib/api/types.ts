// تایپ‌ها دقیقاً طبق CONTRACT.md بخش ۴

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// قالب خطای همه endpointها
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
  width: number;
  height: number;
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
  price: number; // تومان، عدد صحیح
  stock?: number; // فقط برای چاپی
  in_stock: boolean;
}

export interface BookDetail {
  id: number;
  title: string;
  slug: string;
  isbn: string;
  description: string;
  pages: number;
  published_year: number;
  cover: Cover;
  authors: BookAuthorRef[];
  publisher: NamedRef;
  category: CategoryRef;
  editions: Edition[];
  rating: { average: number; count: number };
  seo: {
    title: string;
    description: string;
    is_indexable: boolean;
    canonical_path: string;
  };
  updated_at: string; // ISO 8601 UTC
}
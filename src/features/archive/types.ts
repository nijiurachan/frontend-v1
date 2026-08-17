export interface ArchiveThread {
  id: number;
  title: string | null;
  body: string;
  image: string | null;
  thumb: string | null;
  reply_count: number;
  soudane_count: number;
  created_at: string;
  archived_at: string;
  is_permanent: boolean;
}

export interface ArchivePagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ArchiveStorage {
  used_bytes: number;
  limit_bytes: number;
  remaining_bytes: number;
  usage_ratio: number;
}

export interface ArchiveThreadsResponse {
  threads: ArchiveThread[];
  pagination: ArchivePagination;
  storage?: ArchiveStorage;
}

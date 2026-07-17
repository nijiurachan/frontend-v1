export interface ArchiveThread {
  threadId: string;
  opExcerpt: string;
  thumbnailUrl: string | null;
  replyCount: number;
  archivedAt: string;
}

export interface ArchivePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ArchiveStorage {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usageRatio: number;
}

export interface ArchiveThreadsResponse {
  threads: ArchiveThread[];
  pagination: ArchivePagination;
  storage: ArchiveStorage;
}

// Manages a cache for data fetched by Fetchers.
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { FetcherCreator } from './loader';
import { Fetcher, Handler } from './fetcher';
import { IDisposable } from '@neditor/core/base/common/lifecycle';

export class FetcherCache implements IDisposable {
  constructor(
    // name: string,
    capacity: number
  ) {
    this.capacity_ = capacity;
    this.memory_size_in_bytes_ = 0;
    this.count_resources_cached_ = 0;
  }

  dispose() {
    this.cache_entries_.clear();

    this.memory_size_in_bytes_ = 0;
    this.count_resources_cached_ = 0;
  }

  GetFetcherCreator(
    url: string,
    real_fetcher_creator: FetcherCreator): FetcherCreator {
    NOTIMPLEMENTED();

  }
  NotifyResourceRequested(url: string) {
    NOTIMPLEMENTED();
  }

  private CreateCachedFetcher(
    url: string,
    real_fetcher_creator: FetcherCreator,
    handler: Handler): Fetcher {
    NOTIMPLEMENTED();
  }
  OnFetchSuccess(
    url: string,
    // const scoped_refptr<net::HttpResponseHeaders>& headers,
    // const Origin& last_url_origin,
    did_fail_from_transient_error: boolean, data: string) {

  }

  private capacity_: number;
  private total_size_ = 0;

  private cache_entries_ = new Map<string, CacheEntry>();

  private memory_size_in_bytes_: number;
  private count_resources_cached_: number;
};

class CacheEntry {
  constructor() {
    NOTIMPLEMENTED();
  }
}

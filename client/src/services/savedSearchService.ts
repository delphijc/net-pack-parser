// client/src/services/savedSearchService.ts
import type { MultiSearchCriteria } from '@/utils/multiCriteriaSearch';
import { localStorageService } from './localStorage';

export interface SavedSearch {
  name: string;
  criteria: MultiSearchCriteria;
}

const SAVED_SEARCHES_KEY = 'savedSearches';

class SavedSearchService {
  private getSavedSearches(): Record<string, SavedSearch> {
    return (
      localStorageService.getValue<Record<string, SavedSearch>>(
        SAVED_SEARCHES_KEY,
      ) || {}
    );
  }

  private setSavedSearches(searches: Record<string, SavedSearch>): void {
    localStorageService.setValue(SAVED_SEARCHES_KEY, searches);
  }

  getAllSavedSearches(): SavedSearch[] {
    const searches = this.getSavedSearches();
    return Object.values(searches);
  }

  saveSearch(name: string, criteria: MultiSearchCriteria): boolean {
    if (!name.trim()) {
      return false; // Name cannot be empty
    }
    const searches = this.getSavedSearches();
    if (searches[name]) {
      // Optionally handle duplicate names, e.g., by overwriting or returning false
      // For now, we'll overwrite.
    }
    searches[name] = { name, criteria };
    this.setSavedSearches(searches);
    return true;
  }

  loadSearch(name: string): MultiSearchCriteria | null {
    const searches = this.getSavedSearches();
    return searches[name]?.criteria || null;
  }

  deleteSearch(name: string): void {
    const searches = this.getSavedSearches();
    delete searches[name];
    this.setSavedSearches(searches);
  }
}

export const savedSearchService = new SavedSearchService();

import { create } from 'zustand';

export type SortMode = 'newest' | 'cheapest' | 'mostViewed';

export interface BookFilterState {
  keyword: string;
  facultyCode: string;
  bookTypeCode: string;
  onlyGiveaway: boolean;
  minPrice?: number;
  maxPrice?: number;
  campusLocation: string;
  fromDate: string;
  toDate: string;
  sortBy: SortMode;
  pageNumber: number;
  pageSize: number;
  drawerOpen: boolean;
  focusedRowId: number | null;
  setFilter: (patch: Partial<Omit<BookFilterState, 'setFilter' | 'resetFilters' | 'focusRowByTableAction' | 'clearFocusedRow'>>) => void;
  resetFilters: () => void;
  focusRowByTableAction: (id: number) => void;
  clearFocusedRow: () => void;
}

const initialValues = {
  keyword: '',
  facultyCode: 'ALL',
  bookTypeCode: 'ALL',
  onlyGiveaway: false,
  minPrice: undefined,
  maxPrice: undefined,
  campusLocation: 'ALL',
  fromDate: '',
  toDate: '',
  sortBy: 'newest' as SortMode,
  pageNumber: 1,
  pageSize: 10,
  drawerOpen: false,
  focusedRowId: null as number | null,
};

export const useBookFilterStore = create<BookFilterState>((set) => ({
  ...initialValues,
  setFilter: (patch) =>
    set((state) => ({
      ...state,
      ...patch,
    })),
  resetFilters: () =>
    set((state) => ({
      ...state,
      ...initialValues,
    })),
  focusRowByTableAction: (id) =>
    set((state) => ({
      ...state,
      focusedRowId: id,
    })),
  clearFocusedRow: () =>
    set((state) => ({
      ...state,
      focusedRowId: null,
    })),
}));

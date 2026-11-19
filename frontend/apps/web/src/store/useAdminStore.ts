import { create } from 'zustand';
import type { CategoryAxis, ReportSourceType, ReportStatusType } from '../services/mock-data';

interface AdminStoreState {
  // Reports filter + table row focus
  reportKeyword: string;
  reportSourceFilter: 'ALL' | ReportSourceType;
  reportStatusFilter: 'ALL' | ReportStatusType;
  reportPage: number;
  focusedReportId: number | null;
  // Posts filter + table row focus
  postKeyword: string;
  postFacultyFilter: string;
  postStatusFilter: string;
  postPage: number;
  focusedPostId: number | null;
  // Users filter + table row focus
  userKeyword: string;
  userStatusFilter: string;
  userPage: number;
  focusedUserId: number | null;
  // Categories filter + tree local filter + table row focus
  treeKeyword: string;
  selectedTreeNodeCode: string;
  categoryKeyword: string;
  categoryAxisFilter: 'ALL' | CategoryAxis;
  categoryPage: number;
  focusedCategoryId: number | null;
  // Actions
  setReportFilter: (patch: Partial<Pick<AdminStoreState, 'reportKeyword' | 'reportSourceFilter' | 'reportStatusFilter' | 'reportPage'>>) => void;
  setPostFilter: (patch: Partial<Pick<AdminStoreState, 'postKeyword' | 'postFacultyFilter' | 'postStatusFilter' | 'postPage'>>) => void;
  setUserFilter: (patch: Partial<Pick<AdminStoreState, 'userKeyword' | 'userStatusFilter' | 'userPage'>>) => void;
  setCategoryFilter: (patch: Partial<Pick<AdminStoreState, 'treeKeyword' | 'selectedTreeNodeCode' | 'categoryKeyword' | 'categoryAxisFilter' | 'categoryPage'>>) => void;
  focusRowByTableAction: (section: 'reports' | 'posts' | 'users' | 'categories', id: number) => void;
  clearFocusedRow: (section: 'reports' | 'posts' | 'users' | 'categories') => void;
}

export const useAdminStore = create<AdminStoreState>((set) => ({
  reportKeyword: '',
  reportSourceFilter: 'ALL',
  reportStatusFilter: 'ALL',
  reportPage: 1,
  focusedReportId: 1,
  postKeyword: '',
  postFacultyFilter: 'ALL',
  postStatusFilter: 'ALL',
  postPage: 1,
  focusedPostId: 101,
  userKeyword: '',
  userStatusFilter: 'ALL',
  userPage: 1,
  focusedUserId: 1,
  treeKeyword: '',
  selectedTreeNodeCode: 'ALL',
  categoryKeyword: '',
  categoryAxisFilter: 'ALL',
  categoryPage: 1,
  focusedCategoryId: 1,

  setReportFilter: (patch) => set((s) => ({ ...s, ...patch })),
  setPostFilter: (patch) => set((s) => ({ ...s, ...patch })),
  setUserFilter: (patch) => set((s) => ({ ...s, ...patch })),
  setCategoryFilter: (patch) => set((s) => ({ ...s, ...patch })),
  focusRowByTableAction: (section, id) =>
    set((s) => {
      if (section === 'reports') return { ...s, focusedReportId: id };
      if (section === 'posts') return { ...s, focusedPostId: id };
      if (section === 'users') return { ...s, focusedUserId: id };
      return { ...s, focusedCategoryId: id };
    }),
  clearFocusedRow: (section) =>
    set((s) => {
      if (section === 'reports') return { ...s, focusedReportId: null };
      if (section === 'posts') return { ...s, focusedPostId: null };
      if (section === 'users') return { ...s, focusedUserId: null };
      return { ...s, focusedCategoryId: null };
    }),
}));

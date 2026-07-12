// ============================================
// AssetFlow UI Store (Zustand v5) — DevB
// Sidebar collapse + modal management
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      // ── Sidebar ──────────────────────────────────────────────
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

      // ── Active modal ─────────────────────────────────────────
      // modal names: 'registerAsset' | 'allocateAsset' | 'returnAsset' | null
      activeModal: null,
      modalData: null, // optional payload passed into the modal
      openModal: (name, data = null) =>
        set({ activeModal: name, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'assetflow-ui',
      storage: createJSONStorage(() => localStorage),
      // Only persist sidebar state; modals always reset on reload
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);

// ── Selectors ─────────────────────────────────────────────────
export const selectSidebarCollapsed = (s) => s.sidebarCollapsed;
export const selectActiveModal = (s) => s.activeModal;
export const selectModalData = (s) => s.modalData;

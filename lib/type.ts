export type ModalType = 'createSubaccount' | null

export interface ModalData {
  [key: string]: unknown
}

export interface ModalContextType {
  type: ModalType
  data: ModalData | null
  open: (type: ModalType, data?: ModalData) => void
  close: () => void
}

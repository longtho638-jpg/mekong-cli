// Mock sonner for build pass
export const toast = {
  success: (msg: string) => console.log('Toast Success:', msg),
  error: (msg: string) => console.error('Toast Error:', msg),
  message: (msg: string) => console.log('Toast Message:', msg),
};

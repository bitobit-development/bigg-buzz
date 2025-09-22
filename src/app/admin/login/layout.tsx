import { ReactNode } from 'react'
import { Toaster } from 'sonner'

interface LoginLayoutProps {
  children: ReactNode
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  )
}
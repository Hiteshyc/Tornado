import type { Metadata } from 'next'
import './globals.css'
import { DataProvider } from './context/DataContext'

export const metadata: Metadata = {
  title: 'Tornado — Coastal Hazard Prevention',
  description: 'Real-time coastal hazard monitoring, alerts, and emergency response platform for India.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <body className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  )
}

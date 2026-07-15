import type { Metadata } from "next"
import localFont from "next/font/local"

import { ReactDevTools } from "@/components/react-dev-tools"
import { AppProviders } from "@/providers"

import "./globals.css"

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/public/variable/PretendardVariable.ttf",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
})

export const metadata: Metadata = {
  title: "엔지니어 역량평가",
  description: "점수 입력, 가중 합산, 순위와 평가 인사이트를 관리하는 엔지니어 역량평가 시스템",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`}>
      <body className="min-h-dvh">
        <ReactDevTools />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}

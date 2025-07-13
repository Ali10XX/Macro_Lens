import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Welcome to{' '}
            <span className="text-primary">MacroLens</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            AI-powered recipe and nutrition management system combining video/audio/text parsing, 
            robust food tracking, and intuitive interfaces.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild>
              <Link href="/auth/register">Get started</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
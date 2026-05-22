import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-32">
        <div className="container-custom text-center">
          <h1 className="text-6xl font-bold text-accent-blue mb-4">404</h1>
          <h2 className="heading-2 mb-4">Page Not Found</h2>
          <p className="text-text-secondary mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
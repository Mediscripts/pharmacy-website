import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.join(__dirname, '../public')
const sitemapPath = path.join(publicDir, 'sitemap.xml')

const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:4000'
const frontendUrl = String(process.env.FRONTEND_URL || 'https://www.mediscriptspharmacy.com').replace(/\/$/, '')
const staticPaths = ['', 'products', 'contact', 'track-order', 'cart', 'checkout']
const pageSize = 50

async function fetchProducts() {
  try {
    const products = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const url = `${apiBaseUrl}/api/catalog/products?page=${page}&limit=${pageSize}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Unable to fetch products from ${url}: ${response.status} ${response.statusText}`)
      }

      const payload = await response.json()
      if (!Array.isArray(payload.products)) {
        throw new Error(`Invalid product response from ${url}`)
      }

      products.push(...payload.products)
      hasMore = Boolean(payload.hasMore)
      page += 1
    }

    return products.filter((product) => product?.slug)
  } catch (error) {
    console.warn('Backend fetch failed, falling back to local product data:', error.message)
    const { featuredProducts } = await import('../src/data/siteContent.js')
    return featuredProducts.map((product) => ({ slug: product.slug })).filter((product) => product.slug)
  }
}

function createSitemap(urls) {
  const now = new Date().toISOString()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`,
    )
    .join('\n')}\n</urlset>\n`
  return xml
}

async function main() {
  console.log('Generating sitemap...')
  const products = await fetchProducts()
  const productUrls = products.map((product) => `${frontendUrl}/products/${encodeURIComponent(product.slug)}`)
  const urls = [...new Set([...staticPaths.map((path) => `${frontendUrl}/${path}`), ...productUrls])]
  const xml = createSitemap(urls)

  fs.writeFileSync(sitemapPath, xml, 'utf8')
  console.log(`Sitemap written to ${sitemapPath} (${urls.length} URLs)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

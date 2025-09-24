import { PrismaClient, ProductCategory, StrainType, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting production database seeding...')

  // Create a vendor for products
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Bigg Buzz Cannabis Co.',
      email: 'vendor@biggbuzz.co.za',
      phone: '+27123456789',
      address: 'Cape Town, South Africa',
      isActive: true,
      licenseNumber: 'LIC-001-SA-2024',
    },
  })

  // Create sample products
  const products = [
    {
      name: 'Premium Sativa Blend',
      description: 'High-quality sativa strain with energizing effects',
      price: 250.00,
      category: ProductCategory.FLOWER,
      strain: StrainType.SATIVA,
      thcContent: 18.5,
      cbdContent: 0.8,
      weight: 3.5,
      inStock: true,
      stockQuantity: 50,
      images: JSON.stringify(['https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400']),
      sku: 'BB-SATIVA-001',
      vendorId: vendor.id,
    },
    {
      name: 'Relaxing Indica',
      description: 'Pure indica strain perfect for evening relaxation',
      price: 275.00,
      category: ProductCategory.FLOWER,
      strain: StrainType.INDICA,
      thcContent: 22.3,
      cbdContent: 1.2,
      weight: 3.5,
      inStock: true,
      stockQuantity: 35,
      images: JSON.stringify(['https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400']),
      sku: 'BB-INDICA-001',
      vendorId: vendor.id,
    },
    {
      name: 'Balanced Hybrid',
      description: 'Perfect balance of sativa and indica effects',
      price: 260.00,
      category: ProductCategory.FLOWER,
      strain: StrainType.HYBRID,
      thcContent: 20.1,
      cbdContent: 2.5,
      weight: 3.5,
      inStock: true,
      stockQuantity: 42,
      images: JSON.stringify(['https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400']),
      sku: 'BB-HYBRID-001',
      vendorId: vendor.id,
    },
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }

  console.log('✅ Production seeding completed successfully!')
  console.log(`📦 Created ${products.length} products`)
  console.log(`🏪 Created 1 vendor: ${vendor.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Production seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
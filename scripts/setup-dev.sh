#!/bin/bash

# Bigg Buzz Development Environment Setup Script
echo "🚀 Setting up Bigg Buzz development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.local exists, if not copy from .env.example
if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local from .env.example..."
    cp .env.example .env.local
    print_success ".env.local created"
    print_warning "Please update .env.local with your actual configuration values"
else
    print_status ".env.local already exists"
fi

# Check for required dependencies
print_status "Checking system dependencies..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi
print_success "Node.js $(node --version) detected"

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm --version) detected"

# Install dependencies
print_status "Installing npm dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check for PostgreSQL
print_status "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL not found locally"
    print_status "You can use a local PostgreSQL installation or a cloud service like:"
    echo "  - Supabase: https://supabase.com/"
    echo "  - Neon: https://neon.tech/"
    echo "  - Railway: https://railway.app/"
    echo "  - Heroku Postgres: https://www.heroku.com/postgres"
else
    print_success "PostgreSQL detected"
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Generate Prisma client
print_status "Generating Prisma client..."
npm run db:generate
if [ $? -eq 0 ]; then
    print_success "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    print_warning "Make sure your DATABASE_URL is configured in .env.local"
fi

# Check database connection and run migrations
print_status "Checking database connection..."
if npm run db:push &> /dev/null; then
    print_success "Database connection successful"

    print_status "Running database migrations..."
    npm run db:migrate

    print_status "Seeding database with sample data..."
    npm run db:seed
    if [ $? -eq 0 ]; then
        print_success "Database seeded successfully"
    else
        print_warning "Database seeding failed. You can run 'npm run db:seed' manually later"
    fi
else
    print_warning "Could not connect to database"
    print_status "Please ensure your DATABASE_URL is correct in .env.local"
    print_status "You can test the connection later with: npm run db:push"
fi

# Create necessary directories
print_status "Creating application directories..."
mkdir -p public/uploads
mkdir -p public/images/products
mkdir -p public/images/vendors
mkdir -p public/images/users
print_success "Application directories created"

# Environment validation
print_status "Validating environment configuration..."

# Check for required environment variables
REQUIRED_VARS=(
    "NEXTAUTH_SECRET"
    "DATABASE_URL"
    "JWT_SECRET"
    "ENCRYPTION_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env.local || grep -q "^${var}=\"your-" .env.local; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_warning "The following environment variables need to be configured:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    print_status "Please update these values in .env.local before starting the application"
else
    print_success "Environment configuration looks good"
fi

# Generate secure keys if needed
print_status "Checking for secure keys..."

# Generate NEXTAUTH_SECRET if it's still the default
if grep -q "your-nextauth-secret-here" .env.local; then
    print_status "Generating NEXTAUTH_SECRET..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    sed -i.bak "s/your-nextauth-secret-here-minimum-32-characters-long/$NEXTAUTH_SECRET/" .env.local
    print_success "NEXTAUTH_SECRET generated"
fi

# Generate JWT_SECRET if it's still the default
if grep -q "your-jwt-secret-key" .env.local; then
    print_status "Generating JWT_SECRET..."
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    sed -i.bak "s/your-jwt-secret-key-minimum-32-characters/$JWT_SECRET/" .env.local
    print_success "JWT_SECRET generated"
fi

# Generate ENCRYPTION_KEY if it's still the default
if grep -q "your-encryption-key-for-sensitive-data" .env.local; then
    print_status "Generating ENCRYPTION_KEY..."
    ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    sed -i.bak "s/your-encryption-key-for-sensitive-data-32-chars/$ENCRYPTION_KEY/" .env.local
    print_success "ENCRYPTION_KEY generated"
fi

# Remove backup files
rm -f .env.local.bak

print_success "🎉 Development environment setup complete!"
echo
print_status "Next steps:"
echo "  1. Configure your DATABASE_URL in .env.local"
echo "  2. Set up payment gateway credentials (Peach, PayFast, etc.)"
echo "  3. Configure SMS service (Clickatel or Twilio)"
echo "  4. Set up file upload service (Cloudinary)"
echo "  5. Configure email service (Resend)"
echo
print_status "To start the development server:"
echo "  npm run dev"
echo
print_status "To access the database admin panel:"
echo "  npm run db:studio"
echo
print_status "Test accounts (after seeding):"
echo "  Admin: admin@biggbuzz.co.za / +27123456789"
echo "  Customer: customer1@example.com / +27821234567"
echo "  Vendor: vendor@greenleaf.co.za / +27812345678"
echo
print_status "For development, OTP codes will be logged to the console"
echo
print_success "Happy coding! 🌿"
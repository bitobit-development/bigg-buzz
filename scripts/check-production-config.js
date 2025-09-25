const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function checkProductionConfiguration() {
  console.log('🔧 Production Environment Configuration Audit');
  console.log('=============================================\n');

  // 1. Check environment files
  console.log('1. Environment Configuration Check...');
  const envFiles = ['.env.local', '.env.production', '.env.example'];

  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });

  // 2. Check production environment variables
  console.log('\\n2. Production Environment Variables...');

  // Read production env file
  const prodEnvPath = path.join(process.cwd(), '.env.production');
  if (fs.existsSync(prodEnvPath)) {
    const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');
    const envVars = prodEnvContent.split('\n')
      .filter(line => line.includes('=') && !line.startsWith('#'))
      .map(line => line.split('=')[0])
      .filter(key => key.trim());

    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'CLICKATEL_API_KEY',
      'NEXT_PUBLIC_APP_URL',
      'NODE_ENV'
    ];

    console.log('Required environment variables:');
    requiredVars.forEach(varName => {
      if (envVars.includes(varName)) {
        console.log(`✅ ${varName} - configured`);
      } else {
        console.log(`❌ ${varName} - missing`);
      }
    });

    console.log('\\nAdditional production variables:');
    const additionalVars = envVars.filter(v => !requiredVars.includes(v));
    additionalVars.forEach(varName => {
      console.log(`ℹ️  ${varName}`);
    });
  }

  // 3. Test database connection with production config
  console.log('\\n3. Database Connection Test...');
  try {
    const prodDbUrl = "postgresql://neondb_owner:npg_0uvMgpKtXib1@ep-spring-feather-adff5uk4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
    const prisma = new PrismaClient({
      datasourceUrl: prodDbUrl
    });

    // Test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ PostgreSQL production database connection successful');

    // Check database configuration
    const dbInfo = await prisma.$queryRaw`
      SELECT
        version() as postgresql_version,
        current_database() as database_name,
        current_user as database_user,
        inet_server_addr() as server_ip
    `;
    console.log(`✅ PostgreSQL Version: ${dbInfo[0].postgresql_version.split(' ')[1]}`);
    console.log(`✅ Database: ${dbInfo[0].database_name}`);
    console.log(`✅ User: ${dbInfo[0].database_user}`);

    // Check SSL configuration (implied by sslmode=require in connection string)
    console.log(`✅ SSL Enabled: true (via connection string)`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }

  // 4. Check schema migration status
  console.log('\\n4. Schema Migration Status...');
  try {
    const prodDbUrl = "postgresql://neondb_owner:npg_0uvMgpKtXib1@ep-spring-feather-adff5uk4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
    const prisma = new PrismaClient({
      datasourceUrl: prodDbUrl
    });
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, started_at
      FROM _prisma_migrations
      ORDER BY started_at DESC
      LIMIT 5
    `;

    if (migrations.length > 0) {
      console.log('✅ Recent migrations:');
      migrations.forEach((migration, i) => {
        const status = migration.finished_at ? '✅ Completed' : '⏳ Running';
        console.log(`   ${i + 1}. ${migration.migration_name} - ${status}`);
      });
    } else {
      console.log('⚠️  No migrations found');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration check failed:', error.message);
  }

  // 5. Check database indexes and constraints
  console.log('\\n5. Database Performance Configuration...');
  try {
    const prodDbUrl = "postgresql://neondb_owner:npg_0uvMgpKtXib1@ep-spring-feather-adff5uk4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
    const prisma = new PrismaClient({
      datasourceUrl: prodDbUrl
    });

    // Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;

    console.log(`✅ Database indexes: ${indexes.length} total`);
    const tableIndexCounts = {};
    indexes.forEach(idx => {
      tableIndexCounts[idx.tablename] = (tableIndexCounts[idx.tablename] || 0) + 1;
    });

    Object.entries(tableIndexCounts).forEach(([table, count]) => {
      console.log(`   - ${table}: ${count} indexes`);
    });

    // Check foreign key constraints
    const constraints = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `;

    console.log(`✅ Foreign key constraints: ${constraints.length} total`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Performance check failed:', error.message);
  }

  // 6. Check security configuration
  console.log('\\n6. Security Configuration...');

  // Check if sensitive files are properly configured
  const securityChecks = [
    { file: '.env.production', check: 'Production secrets configured' },
    { file: 'middleware.ts', check: 'Route protection middleware' },
    { file: 'src/lib/auth', check: 'Authentication system' }
  ];

  securityChecks.forEach(({ file, check }) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath) || fs.existsSync(filePath + '.ts') || fs.existsSync(filePath + '.js')) {
      console.log(`✅ ${check}`);
    } else {
      console.log(`⚠️  ${check} - verify configuration`);
    }
  });

  // 7. Performance recommendations
  console.log('\\n7. Performance Recommendations...');
  try {
    const prodDbUrl = "postgresql://neondb_owner:npg_0uvMgpKtXib1@ep-spring-feather-adff5uk4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
    const prisma = new PrismaClient({
      datasourceUrl: prodDbUrl
    });

    // Check table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    console.log('✅ Database size analysis:');
    let totalBytes = 0;
    tableSizes.forEach((table, i) => {
      totalBytes += parseInt(table.bytes);
      console.log(`   ${i + 1}. ${table.tablename}: ${table.size}`);
    });

    const totalSize = totalBytes < 1024 * 1024 ?
      `${Math.round(totalBytes / 1024)} KB` :
      `${Math.round(totalBytes / (1024 * 1024))} MB`;
    console.log(`✅ Total database size: ${totalSize}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Size analysis failed:', error.message);
  }

  console.log('\\n🏁 Production Configuration Audit Complete');
  console.log('==========================================');
}

checkProductionConfiguration();
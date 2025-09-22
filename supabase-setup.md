# Supabase Setup Guide

This project supports both local PostgreSQL development and production deployment with Supabase.

## Local Development (PostgreSQL)

The project is currently configured to use local PostgreSQL for development. This is automatically set up and works out of the box.

## Production Setup with Supabase

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `supply-chain-platform`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users

### 2. Get Your Supabase Credentials

After project creation, go to Settings > API and copy:

- **Project URL** (looks like: `https://your-project-id.supabase.co`)
- **Anon Key** (public key for client-side access)
- **Service Role Key** (secret key for server-side admin access)

### 3. Update Environment Variables

Add these variables to your production environment or update `/app/backend/.env`:

```bash
# Switch to supabase mode
DB_MODE=supabase

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Run Database Migrations

Run the migration script to set up your database schema:

```bash
cd /app/backend
npm run migrate
```

Alternatively, you can run the SQL migration manually:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `/app/backend/src/migrations/001_init.sql`
4. Execute the SQL

### 5. Set Up Storage Buckets

The migration script will automatically create these storage buckets:

- `batch-images` - For produce batch photos
- `quality-certificates` - For quality check documents
- `user-documents` - For user verification documents
- `qr-codes` - For generated QR codes

### 6. Configure Row Level Security (RLS)

The migration script includes RLS policies that provide:

- Users can only access their own data
- Farmers can create produce batches
- Current owners can update batch information
- Regulators can perform quality checks
- Secure transfer history tracking

### 7. API Integration

The backend automatically detects whether to use local PostgreSQL or Supabase based on the `DB_MODE` environment variable.

#### Local PostgreSQL (`DB_MODE=local`)
- Uses TypeORM for database operations
- Direct SQL queries through pg driver
- Local file storage

#### Supabase (`DB_MODE=supabase`)
- Uses Supabase client for database operations
- Supabase Storage for file uploads
- Built-in authentication (optional)
- Real-time subscriptions available

## Frontend Integration

Update your frontend environment variables:

```bash
# Add to /app/frontend/.env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Switching Between Local and Supabase

You can easily switch between local development and Supabase by changing the `DB_MODE` environment variable:

```bash
# Local development
DB_MODE=local

# Supabase production
DB_MODE=supabase
```

## Database Schema

The database includes these main tables:

### Core Tables
- `users` - All platform users (farmers, distributors, retailers, consumers, regulators)
- `produce_batches` - Produce batch information and tracking
- `batch_transfers` - Ownership transfer history
- `quality_checks` - Quality inspection records
- `audit_logs` - System audit trail
- `notifications` - User notifications

### Key Features
- UUID primary keys for better scalability
- JSONB fields for flexible data storage
- Proper foreign key relationships
- Indexes for optimal performance
- Timestamp tracking with timezone support
- Row Level Security for data protection

## Backup and Recovery

### Supabase
- Automatic daily backups
- Point-in-time recovery
- Export/import capabilities through dashboard

### Local PostgreSQL
```bash
# Backup
pg_dump supplychain > backup.sql

# Restore
psql supplychain < backup.sql
```

## Monitoring and Logs

### Supabase Dashboard
- Real-time database activity
- API usage metrics
- Error logs and performance insights
- User authentication logs

### Local Development
- Application logs via Winston
- PostgreSQL logs
- Custom audit logging

## Production Deployment Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] Storage buckets created
- [ ] RLS policies enabled
- [ ] SSL/TLS configured
- [ ] Backup strategy implemented
- [ ] Monitoring set up
- [ ] Performance optimization applied

## Troubleshooting

### Common Issues

1. **Migration Failed**
   - Check Supabase project permissions
   - Verify environment variables
   - Ensure service role key has admin privileges

2. **RLS Blocking Operations**
   - Verify user authentication
   - Check policy conditions
   - Use service role key for admin operations

3. **Storage Upload Issues**
   - Verify bucket permissions
   - Check file size limits
   - Ensure proper MIME types

4. **Connection Issues**
   - Verify project URL and keys
   - Check network connectivity
   - Validate SSL certificates

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Project Issues](https://github.com/your-repo/issues)
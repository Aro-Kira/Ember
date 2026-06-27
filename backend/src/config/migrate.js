import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'youth',
    avatar VARCHAR(500),
    emergency_contact VARCHAR(100),
    points INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    check_ins INTEGER DEFAULT 0,
    check_ins_target INTEGER DEFAULT 15,
    prayers_shared INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    bio TEXT,
    theme_preference VARCHAR(20) DEFAULT 'dark',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

const createRefreshTokensTable = `
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

const createEventsTable = `
  CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    date VARCHAR(100) NOT NULL,
    time VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    image VARCHAR(500),
    description TEXT,
    points_reward INTEGER DEFAULT 0,
    price VARCHAR(50) DEFAULT 'FREE',
    total_capacity INTEGER DEFAULT 100,
    type VARCHAR(50) DEFAULT 'live',
    registration_fields JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

const createEventRegistrationsTable = `
  CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    checked_in BOOLEAN DEFAULT FALSE,
    registration_data JSONB DEFAULT '{}',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
  );
`;

const createPostsTable = `
  CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('devotional', 'testimony')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

const createPrayersTable = `
  CREATE TABLE IF NOT EXISTS prayers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    stage VARCHAR(50) DEFAULT 'new' CHECK (stage IN ('new', 'active', 'archived')),
    prayed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

const createPrayerInteractionsTable = `
  CREATE TABLE IF NOT EXISTS prayer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prayer_id UUID NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
    prayed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, prayer_id)
  );
`;

const createPostReactionsTable = `
  CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('amen', 'encouraged', 'praying', 'blessed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id, reaction_type)
  );
`;

const createAnnouncementsTable = `
  CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'Normal' CHECK (priority IN ('High', 'Normal', 'Low')),
    target_audience VARCHAR(100) DEFAULT 'All Youth',
    cover_image VARCHAR(500),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Draft', 'Archive')),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

const createSundayAttendanceTable = `
  CREATE TABLE IF NOT EXISTS sunday_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
  );
`;

const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
  CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
  CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
  CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
  CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
  CREATE INDEX IF NOT EXISTS idx_prayers_author_id ON prayers(author_id);
  CREATE INDEX IF NOT EXISTS idx_prayers_stage ON prayers(stage);
  CREATE INDEX IF NOT EXISTS idx_prayer_interactions_user_id ON prayer_interactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_prayer_interactions_prayer_id ON prayer_interactions(prayer_id);
  CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
  CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
  CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
  CREATE INDEX IF NOT EXISTS idx_sunday_attendance_date ON sunday_attendance(date);
`;

async function migrate() {
  const client = new pg.Client({
    host: process.env.DB_HOST || process.env.PGHOST || 'db.vgaehagmmiquanwouvkq.supabase.co',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
    database: process.env.DB_NAME || process.env.PGDATABASE || 'postgres',
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    await client.query(createUsersTable);
    console.log('Created users table');

    // Add theme_preference column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN theme_preference VARCHAR(20) DEFAULT 'dark';
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
    console.log('Ensured theme_preference column exists');

    await client.query(createRefreshTokensTable);
    console.log('Created refresh_tokens table');

    await client.query(createEventsTable);
    console.log('Created events table');

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE events ADD COLUMN registration_fields JSONB DEFAULT '[]';
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
    console.log('Ensured registration_fields column exists');

    await client.query(createEventRegistrationsTable);
    console.log('Created event_registrations table');

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE event_registrations ADD COLUMN registration_data JSONB DEFAULT '{}';
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
    console.log('Ensured registration_data column exists');

    await client.query(createPostsTable);
    console.log('Created posts table');

    await client.query(createPrayersTable);
    console.log('Created prayers table');

    await client.query(createPrayerInteractionsTable);
    console.log('Created prayer_interactions table');

    await client.query(createPostReactionsTable);
    console.log('Created post_reactions table');

    await client.query(createAnnouncementsTable);
    console.log('Created announcements table');

    await client.query(createSundayAttendanceTable);
    console.log('Created sunday_attendance table');

    await client.query(createIndexes);
    console.log('Created indexes');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();

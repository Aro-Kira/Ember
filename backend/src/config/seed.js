import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 10;

async function seed() {
  const client = new pg.Client({
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
    database: process.env.DB_NAME || process.env.PGDATABASE || 'risktaker_youth',
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Create leader account
    const leaderPassword = await bcrypt.hash('leader123', SALT_ROUNDS);
    const leaderResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, avatar, points, level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['leader@risktakergeneration.com', leaderPassword, 'Chloe Simmons', 'leader', 
       'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
       500, 15]
    );
    
    let leaderId;
    if (leaderResult.rows[0]) {
      leaderId = leaderResult.rows[0].id;
      console.log('Created leader account: leader@risktakergeneration.com');
    } else {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', ['leader@risktakergeneration.com']);
      leaderId = existing.rows[0].id;
      console.log('Leader account already exists');
    }

    // Create sample youth accounts
    const youthAccounts = [
      { email: 'aaron@risktakergeneration.com', name: 'Aaron', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANk-XFd6Gvyzx3kDej5Vtr4qf7gdca2Ll7BpF8VLWScwITBIt3mSVHjs-z4xPHJL6EwAJ2ckm3Q-55XC8gWGPEx57m6KQpWck8meaFuCAtrFlzw_qTelRK0rj-HAWERrVlfR_OykTH8PPRnRb9-6eSW9iFkMAteloRfIV96cHcUv2pmg-UW3x20ZEgD8HEUqXFmiwC35zv5CjfyhHhaEjlo9TXvY11W1V9E50-BD6lM-byECVW1G-AP8iz5AFl2uJ4oqUCe45EEp3d' },
      { email: 'nathan@risktakergeneration.com', name: 'Nathan Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { email: 'sarah@risktakergeneration.com', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
      { email: 'grace@risktakergeneration.com', name: 'Creative Grace', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { email: 'david@risktakergeneration.com', name: 'Musician David', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
    ];

    const youthPassword = await bcrypt.hash('password123', SALT_ROUNDS);
    
    for (const youth of youthAccounts) {
      await client.query(
        `INSERT INTO users (email, password_hash, name, role, avatar, points, level, streak, check_ins)
         VALUES ($1, $2, $3, 'youth', $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING`,
        [youth.email, youthPassword, youth.name, youth.avatar,
         Math.floor(Math.random() * 500) + 100,
         Math.floor(Math.random() * 12) + 1,
         Math.floor(Math.random() * 5),
         Math.floor(Math.random() * 10)]
      );
    }
    console.log('Created youth accounts');

    // Create sample events
    const events = [
      {
        title: 'Ignite Youth Camp 2026',
        date: 'JULY 15-18',
        time: '9:00 AM - 5:00 PM',
        location: 'Mountain Valley Retreat Center',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIa25iDUQr9Gp9A9N50B0k7vwh4la2xmzFeEqRledK3pQxHTWuv87yAy_SRD_maAIKVgkEfRZ7NPX-VL1Fa2QCkfR7JxMlw2wW9wGA9MdCVhn6LbtGPB9slMWNi8AfuKU05LvYGWkDqBnNVEJwzH7J5sL5yjdC1tgLNQcIniw4JSI_TP7UbOMPHuDnqauscgbbS0p9XwbGq0pXkAQITF7aQEQzfQZ4U60d8kGMSUmAz8LOPfDVfEYExUpkdA8Sb-6CX0G6IyoY9BET',
        description: 'Join us for 4 days of powerful worship, deep connections, and life-changing encounters.',
        pointsReward: 100,
        price: '$120 (Scholarships available)',
        totalCapacity: 50,
        type: 'summit'
      },
      {
        title: 'Friday Fellowship Night',
        date: 'THIS FRIDAY',
        time: '6:00 PM - 9:30 PM',
        location: 'Main Sanctuary & Youth Hall',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        description: 'Bring a friend for high-energy group games, free pizza, and an inspiring discussion.',
        pointsReward: 30,
        price: 'FREE',
        totalCapacity: 100,
        type: 'meet'
      },
      {
        title: 'Praise & Acoustic Night',
        date: 'AUGUST 07',
        time: '7:00 PM - 9:30 PM',
        location: 'The Fireplace Lounge',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        description: 'An intimate candlelit evening of acoustic worship and personal testimonies.',
        pointsReward: 40,
        price: 'FREE',
        totalCapacity: 50,
        type: 'live'
      },
      {
        title: 'Youth Leadership Summit',
        date: 'SEPTEMBER 12',
        time: '10:00 AM - 4:00 PM',
        location: 'Multipurpose Auditorium',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        description: 'Equipping the next generation of small group leaders, AV tech wizards, and worship musicians.',
        pointsReward: 75,
        price: '$15 (Includes lunch)',
        totalCapacity: 75,
        type: 'summit'
      }
    ];

    for (const event of events) {
      await client.query(
        `INSERT INTO events (title, date, time, location, image, description, points_reward, price, total_capacity, type, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT DO NOTHING`,
        [event.title, event.date, event.time, event.location, event.image, 
         event.description, event.pointsReward, event.price, event.totalCapacity, event.type, leaderId]
      );
    }
    console.log('Created sample events');

    // Create sample announcements
    const announcements = [
      {
        title: 'Youth Fellowship Night This Friday!',
        content: 'Join us at 6:00 PM for group games and worship in the Main Sanctuary. Bring a friend!',
        priority: 'High',
        targetAudience: 'All Youth',
        status: 'Active'
      },
      {
        title: 'New Devotional Series Starting Next Week',
        content: 'We are starting a 4-week devotional series on "Walking in Faith". Don\'t miss it!',
        priority: 'Normal',
        targetAudience: 'All Youth',
        status: 'Active'
      },
      {
        title: 'Leaders Meeting - This Sunday',
        content: 'All youth leaders please meet after service for our monthly planning session.',
        priority: 'Normal',
        targetAudience: 'Leaders Only',
        status: 'Active'
      }
    ];

    for (const announcement of announcements) {
      await client.query(
        `INSERT INTO announcements (author_id, title, content, priority, target_audience, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [leaderId, announcement.title, announcement.content, announcement.priority, 
         announcement.targetAudience, announcement.status]
      );
    }
    console.log('Created sample announcements');

    console.log('\nSeed completed successfully!');
    console.log('\nTest accounts:');
    console.log('  Leader:  leader@risktakergeneration.com / leader123');
    console.log('  Youth:   aaron@risktakergeneration.com / password123');
    console.log('  Youth:   nathan@risktakergeneration.com / password123');
    
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();

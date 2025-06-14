const { Client } = require('pg')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
})

const sampleUsers = [
  { email: 'test1@data.gov.sg' },
  { email: 'test2@tech.gov.sg' },
  { email: 'test3@open.gov.sg' },
]

const sampleUrls = [
  {
    longUrl: 'https://www.data.gov.sg/',
    description: 'Singapore Government Open Data Portal',
    tags: ['data', 'government', 'open-data'],
  },
  {
    longUrl: 'https://www.tech.gov.sg/',
    description: 'Government Technology Agency of Singapore',
    tags: ['tech', 'government', 'digital'],
  },
  {
    longUrl: 'https://www.open.gov.sg/',
    description: 'Open Government Products',
    tags: ['open-source', 'government', 'products'],
  },
]

async function generateSampleData() {
  try {
    await client.connect()
    console.log('Connected to database')

    // Create users
    await Promise.all(
      sampleUsers.map(async (user) => {
        const apiKeyHash = await bcrypt.hash(uuidv4(), 10)
        await client.query(
          'INSERT INTO users (email, "apiKeyHash", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (email) DO NOTHING',
          [user.email, apiKeyHash],
        )
      }),
    )

    // Get user IDs
    const userResult = await client.query('SELECT id, email FROM users')
    const users = userResult.rows

    // Create URLs for each user
    await Promise.all(
      users.map(async (user) => {
        await Promise.all(
          sampleUrls.map(async (url) => {
            const shortUrl = Math.random().toString(36).substring(2, 8)
            const tagStrings = url.tags.join(',')

            // Insert URL
            await client.query(
              `INSERT INTO urls (
            "shortUrl", "longUrl", "state", "userId", "isFile", 
            "description", "source", "tagStrings", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
              [
                shortUrl,
                url.longUrl,
                'ACTIVE',
                user.id,
                false,
                url.description,
                'CONSOLE',
                tagStrings,
              ],
            )

            // Insert URL clicks
            const clicks = Math.floor(Math.random() * 1000)
            await client.query(
              'INSERT INTO url_clicks ("shortUrl", clicks, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
              [shortUrl, clicks],
            )

            // Insert URL history
            await client.query(
              `INSERT INTO url_histories (
            "urlShortUrl", "longUrl", "state", "userId", "isFile",
            "description", "source", "tagStrings", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
              [
                shortUrl,
                url.longUrl,
                'ACTIVE',
                user.id,
                false,
                url.description,
                'CONSOLE',
                tagStrings,
              ],
            )
          }),
        )
      }),
    )

    console.log('Sample data generated successfully')
  } catch (err) {
    console.error('Error generating sample data:', err)
  } finally {
    await client.end()
  }
}

generateSampleData()

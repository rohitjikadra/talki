const { MongoClient, ObjectId } = require('mongodb')
const fs = require('fs')
const path = require('path')

const DB_URI = process.env.MongoDb_Connection_String || 'mongodb://127.0.0.1:27017/talki'
const DB_DIR = path.join(__dirname, '../../DB')

const IMPORTS = [
  { file: 'settings.json', collection: 'settings' },
  { file: 'languages.json', collection: 'languages' },
  { file: 'currencies.json', collection: 'currencies' },
  { file: 'coinplans.json', collection: 'coinplans' },
  { file: 'faqs.json', collection: 'faqs' },
  { file: 'talktopics.json', collection: 'talktopics' },
  { file: 'identityproofs.json', collection: 'identityproofs' },
  { file: 'translations.json', collection: 'translations' }
]

function convertExtendedJSON(value) {
  if (value === null || value === undefined) return value

  if (Array.isArray(value)) {
    return value.map(convertExtendedJSON)
  }

  if (typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, '$oid')) {
      return new ObjectId(value.$oid)
    }

    if (Object.prototype.hasOwnProperty.call(value, '$date')) {
      return new Date(value.$date)
    }

    const converted = {}

    for (const [key, nestedValue] of Object.entries(value)) {
      converted[key] = convertExtendedJSON(nestedValue)
    }

    return converted
  }

  return value
}

async function importCollection(db, { file, collection }) {
  const filePath = path.join(DB_DIR, file)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`)
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const documents = (Array.isArray(raw) ? raw : [raw]).map(convertExtendedJSON)
  const existingCount = await db.collection(collection).countDocuments()

  if (existingCount > 0) {
    console.log(`SKIP  ${collection} (${existingCount} documents already exist)`)
    return
  }

  if (documents.length === 0) {
    console.log(`SKIP  ${collection} (file is empty)`)
    return
  }

  await db.collection(collection).insertMany(documents)
  console.log(`OK    ${collection} (${documents.length} documents imported)`)
}

async function main() {
  const client = new MongoClient(DB_URI)

  try {
    await client.connect()
    const dbName = new URL(DB_URI.replace('mongodb://', 'http://')).pathname.replace(/^\//, '') || 'talki'
    const db = client.db(dbName)

    console.log(`Connected to MongoDB database: ${dbName}`)

    for (const item of IMPORTS) {
      await importCollection(db, item)
    }

    const collections = await db.listCollections().toArray()
    console.log('\nCollections in database:')
    for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
      const count = await db.collection(name).countDocuments()
      console.log(`- ${name}: ${count}`)
    }
  } finally {
    await client.close()
  }
}

main().catch(error => {
  console.error('Import failed:', error.message)
  process.exit(1)
})

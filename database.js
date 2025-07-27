const { Pool } = require('pg')
 
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

pool.connect((err) => {
    if (err) throw err
})

module.exports = pool
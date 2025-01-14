import dotenv from 'dotenv'
import { Pool, PoolClient } from 'pg'

dotenv.config()

class PostgreSQLConnect {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: parseInt(process.env.DB_PORT as string, 10),
      max: parseInt(process.env.DB_MAX_POOL_SIZE as string, 10) // Số kết nối tối đa trong pool
    })
    this.connect()
  }
  public getPool() {
    return this.pool
  }
  private connect() {
    this.pool.connect((err: Error | undefined, client: PoolClient | undefined, done: (release?: any) => void) => {
      if (err) {
        return console.error('Error acquiring client', err.stack)
      }

      if (client) {
        console.log('Connected to PostgreSQL')
        done() // Release the client back to the pool
      } else {
        console.error('No client available')
      }
    })
  }

  public async disconnect() {
    await this.pool.end()
    console.log('Disconnected from PostgreSQL')
  }
}

const dbConnection = new PostgreSQLConnect()

export default dbConnection
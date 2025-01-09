import { Pool } from 'pg'

const queryData = async <T>(db: Pool, query: string, params: (string | number)[]): Promise<T[]> => {
  const client = await db.connect()
  try {
    const result = await client.query(query, params)
    return result.rows as T[]
  } catch (error) {
    console.error('Error executing query:', error)
    throw new Error('Query execution failed')
  } finally {
    client.release()
  }
}

export { queryData }
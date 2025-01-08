import Branch from "./branch"

type Department={
    id: string
    name: string
    branch?:Branch
    created_at: Date
    updated_at: Date
}
export default Department
import Company from "./company"

type Branch={
    id: string
    name: string
    address?: string
    district?:string
    province?:string
    company?:Company
    created_at?: Date
    updated_at?: Date
}
export default Branch
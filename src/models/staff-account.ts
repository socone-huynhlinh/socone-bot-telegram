import Roles from "./roles"
import StaffDevices from "./staff-devices"

type StaffAccount = {
    id: string
    telegram_account_name: string
    full_name: string
    phone: string
    company_email: string
    address?: string
    district?: string
    province?: string
    day_of_birth?: Date
    gender?: string
    level?: string
    staff_devices?: StaffDevices
    staff_role: Roles
    created_at: Date
    updated_at: Date
}
export default StaffAccount

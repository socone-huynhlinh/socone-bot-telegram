import Department from "./department"
import TelegramAccount from "./telegram-account"
import TypeReport from "./type-report"

type Staff = {
    id: string
    full_name: string
    company_email: string
    position: string
    department?:Department
    type_report?:TypeReport
    tele_account?:TelegramAccount
    created_at: Date
    updated_at: Date

}
export default Staff

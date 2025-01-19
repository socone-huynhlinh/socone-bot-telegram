import Department from "./department"
import Device from "./device"
import TelegramAccount from "./telegram-account"
import TypeReport from "./type-report"

type Staff = {
    id?: string
    full_name: string
    company_email: string
    position: string
    department?: Department
    type_report?: TypeReport
    tele_account?: TelegramAccount
    device?: Device
    created_at?: Date
    updated_at?: Date
    type_staff?: string
}
export const mapStaffFromJson = (json: any): Staff => {
    return {
        id: json["id"],
        full_name: json["full_name"],
        company_email: json["company_email"],
        position: json["position"],
        department: {
            id: json["department_id"],
            name: json["department_name"],
        },
        type_report: {
            name: json["type_report"],
        },
        tele_account: {
            id: json["tele_id"],
            username: json["tele_username"],
            phone: json["tele_phone"],
        },
        type_staff: json["type_staff"],
    }
}
export default Staff

import Department from "./departments"
import Device from "./device"
import TelegramAccount from "./telegram-account"

type Staff = {
    id?: string
    full_name: string
    company_email: string
    position: string
    department?: Department
    type_report?: string
    tele_account?: TelegramAccount
    device?: Device
    created_at?: Date
    updated_at?: Date
    type_staff?: string
    status?: string
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
            branch: {
                id: json["branch_id"],
                name: json["branch_name"],
            },
        },
        type_report: json["type_report"] || null,
        tele_account: {
            id: json["tele_id"],
            username: json["tele_username"],
            phone: json["tele_phone"],
        },
        type_staff: json["type_staff"],
        status: json["status"],
        created_at: json["created_at"],
        updated_at: json["updated_at"],
    };
};
export default Staff

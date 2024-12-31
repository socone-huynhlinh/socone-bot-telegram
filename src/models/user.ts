export class Staff {
    id: string
    full_name: string
    role_name: string
    phone_number: string
    company_mail: string

    constructor(id: string, full_name: string, role_name: string, phone_number: string, company_mail: string) {
        this.id = id
        this.full_name = full_name
        this.role_name = role_name
        this.phone_number = phone_number
        this.company_mail = company_mail
    }
}

export class TelegramAccount {
    id?: number
    first_name?: string
    last_name?: string
    staff_id: string
    work_mode: string

    constructor(id: number, first_name: string, last_name: string, staff_id: string, work_mode: string) {
        this.id = id
        this.first_name = first_name
        this.last_name = last_name
        this.staff_id = staff_id
        this.work_mode = work_mode
    }
}
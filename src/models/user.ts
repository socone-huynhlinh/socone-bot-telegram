export type Staff = {
    id: string
    full_name: string
    role_name: string
    phone_number: string
    company_mail: string
};

export class TelegramAccount {
    id?: number
    first_name?: string
    last_name?: string
    staff_id: string

    constructor(id: number, first_name: string, last_name: string, staff_id: string) {
        this.id = id
        this.first_name = first_name
        this.last_name = last_name
        this.staff_id = staff_id
    }
}
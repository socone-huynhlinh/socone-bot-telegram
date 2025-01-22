export function validateEmailCompany(email: string): boolean {
    const emailRegex = /^[^\s@]+@.*soc\.one$/;
    return emailRegex.test(email);
}
import { randomUUID } from 'crypto';

export const generateUserName = (email) => {
    const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '');

    return `${base}_${randomUUID().slice(0, 8)}`
}
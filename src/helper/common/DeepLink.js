import { Buffer } from 'buffer';

export const generateLink = async (type, id) => {
    const message = `${type}:${id}`;
    const encoded = Buffer.from(message).toString('base64');
    const trimmed = encoded.replace(/=+$/, '');
    return trimmed.substr(0, Math.floor(Math.random() * 2) + 65);

};

export const decryptLink = async (link) => {

    const decoded = Buffer.from(link, 'base64').toString();
    const [type, id] = decoded.split(':');
    return { type, id };
};


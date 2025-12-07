// lib/fetcher.ts
import axios from './axios';

export const fetcher = async <T = any>(url: string): Promise<T> => {
    const response = await axios.get<T>(url);
    return response.data;
};

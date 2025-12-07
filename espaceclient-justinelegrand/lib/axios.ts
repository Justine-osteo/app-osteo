'use client'
import axios, { AxiosInstance } from 'axios'

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  // tu peux ajouter d'autres options ici (headers, timeout, etc.)
})

export default instance

import axios, { AxiosInstance } from 'axios'

export interface VoiceResponse {
  transcript: string
  response: string
  audio_url: string
}

export interface Metrics {
  total_queries: number
  active_farmers: number
  resolution_rate: number
  avg_response_time: number
  queries_today: number
  queries_this_week: number
}

export interface Crop {
  id: string
  name: string
  names: string[]
  problems: Record<string, Problem>
}

export interface Problem {
  keywords: string[]
  symptoms: string
  organic_solution: string
  chemical_solution: string
  safety_notes: string
}

class VillageAIClient {
  private api: AxiosInstance
  private baseURL: string

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            // Redirect to login if needed
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Voice processing
  async processVoice(audioFile: File): Promise<VoiceResponse> {
    const formData = new FormData()
    formData.append('file', audioFile)

    const response = await this.api.post<VoiceResponse>('/voice/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.api.get('/')
    return response.data
  }

  // Admin endpoints (to be implemented)
  async getMetrics(): Promise<Metrics> {
    // Mock data for now
    return {
      total_queries: 1234,
      active_farmers: 456,
      resolution_rate: 78,
      avg_response_time: 3.2,
      queries_today: 45,
      queries_this_week: 312,
    }
  }

  // Knowledge base endpoints (to be implemented)
  async getCrops(): Promise<Crop[]> {
    // For now, return mock data
    return [
      {
        id: 'wheat',
        name: 'Wheat',
        names: ['wheat', 'gehun', 'gehu'],
        problems: {
          yellow_rust: {
            keywords: ['yellow', 'spots', 'rust'],
            symptoms: 'Yellow stripes or patches on wheat leaves',
            organic_solution: 'Neem Oil Spray (5 ml per liter water)',
            chemical_solution: 'Propiconazole 25% EC (1 ml per liter)',
            safety_notes: 'Wear gloves and mask while spraying',
          },
        },
      },
    ]
  }

  async createCrop(crop: Partial<Crop>): Promise<Crop> {
    const response = await this.api.post<Crop>('/admin/crops', crop)
    return response.data
  }

  async updateCrop(id: string, crop: Partial<Crop>): Promise<Crop> {
    const response = await this.api.put<Crop>(`/admin/crops/${id}`, crop)
    return response.data
  }

  async deleteCrop(id: string): Promise<void> {
    await this.api.delete(`/admin/crops/${id}`)
  }
}

// Create singleton instance
export const apiClient = new VillageAIClient()
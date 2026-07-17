import { getAuthHeaders } from '@/libs/getAuthHeaders'

export async function GET(request) {
  const headers = await getAuthHeaders()
  
  return new Response(JSON.stringify({ message: 'Hello from API!' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

import { apiPost } from './client';
import type { Result } from './client';

export type SubmitPhotosRequest = {
  readonly order_id: number
  readonly photos: ReadonlyArray<string>   // base64 strings (no data: prefix)
  readonly description?: string
}

export type SubmitPhotosResponse = {
  readonly submission_id: ReadonlyArray<number>
  readonly message: string
}

export async function submitPhotos(
  data: SubmitPhotosRequest
): Promise<Result<SubmitPhotosResponse>> {
  return apiPost<SubmitPhotosResponse>('/photos/submit', data)
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

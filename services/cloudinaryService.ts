const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dvmjukj2e';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'photopath';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * 上传图片到 Cloudinary
 * @param file - 图片文件
 * @returns 图片 URL 和元数据
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'photopath'); // 存放在 photopath 文件夹

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error('图片上传失败');
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}

/**
 * 生成 Cloudinary 缩略图 URL
 * 利用 Cloudinary 的 URL 变换功能，无需额外请求
 */
export function getThumbnailUrl(url: string, width = 200, height?: number): string {
  if (!url || !url.includes('cloudinary')) {
    return url; // 非 Cloudinary URL，原样返回
  }

  const transformation = height
    ? `w_${width},h_${height},c_fill,q_auto,f_auto`
    : `w_${width},c_scale,q_auto,f_auto`;

  return url.replace('/upload/', `/upload/${transformation}/`);
}

/**
 * 生成优化后的图片 URL（用于详情页等需要高清图的场景）
 */
export function getOptimizedUrl(url: string, maxWidth = 1200): string {
  if (!url || !url.includes('cloudinary')) {
    return url;
  }

  return url.replace('/upload/', `/upload/w_${maxWidth},c_limit,q_auto,f_auto/`);
}

/**
 * 检查是否是 Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url?.includes('cloudinary.com') || url?.includes('res.cloudinary.com');
}

/**
 * 从 base64 上传（兼容旧数据）
 */
export async function uploadBase64(base64: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', base64);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'photopath');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error('图片上传失败');
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}

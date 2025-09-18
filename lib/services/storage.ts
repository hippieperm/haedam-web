import { createClient } from '@/lib/supabase/server'

export class StorageService {
  private static getBucketName(folder: "items" | "profiles" | "temp" = "items") {
    switch (folder) {
      case "items":
        return "item-media";
      case "profiles":
        return "profile-images";
      case "temp":
        return "temp-uploads";
      default:
        return "item-media";
    }
  }

  // 이미지 업로드
  static async uploadImage(
    file: Buffer | File,
    fileName: string,
    contentType: string,
    folder: "items" | "profiles" | "temp" = "items"
  ): Promise<{ url: string; key: string }> {
    const supabase = createClient();
    const bucketName = this.getBucketName(folder);
    const key = `${folder}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(key, file, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(key);

    return { url: urlData.publicUrl, key };
  }

  // 다중 이미지 업로드
  static async uploadMultipleImages(
    files: Array<{ buffer: Buffer | File; fileName: string; contentType: string }>,
    folder: "items" | "profiles" | "temp" = "items"
  ): Promise<Array<{ url: string; key: string }>> {
    const uploadPromises = files.map((file) =>
      this.uploadImage(file.buffer, file.fileName, file.contentType, folder)
    );

    return Promise.all(uploadPromises);
  }

  // 이미지 삭제
  static async deleteImage(key: string, folder: "items" | "profiles" | "temp" = "items"): Promise<void> {
    const supabase = createClient();
    const bucketName = this.getBucketName(folder);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([key]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // 다중 이미지 삭제
  static async deleteMultipleImages(keys: string[], folder: "items" | "profiles" | "temp" = "items"): Promise<void> {
    const supabase = createClient();
    const bucketName = this.getBucketName(folder);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove(keys);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // 프리사인드 URL 생성 (직접 업로드용)
  static async generatePresignedUrl(
    fileName: string,
    contentType: string,
    folder: "items" | "profiles" | "temp" = "items"
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const supabase = createClient();
    const bucketName = this.getBucketName(folder);
    const key = `${folder}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(key, {
        expiresIn: 3600,
        contentType
      });

    if (error) {
      throw new Error(`Presigned URL generation failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(key);

    return {
      uploadUrl: data.signedUrl,
      fileUrl: urlData.publicUrl,
      key
    };
  }

  // 이미지 리사이징 (Supabase Transform 사용)
  static generateResizedUrls(
    originalKey: string,
    sizes: number[] = [300, 600, 1200],
    folder: "items" | "profiles" | "temp" = "items"
  ) {
    const supabase = createClient();
    const bucketName = this.getBucketName(folder);

    return sizes.map((size) => {
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(originalKey, {
          transform: {
            width: size,
            height: size,
            resize: 'cover',
            quality: 80
          }
        });

      return {
        size,
        url: data.publicUrl,
      };
    });
  }

  // 이미지 최적화 URL 생성
  static getOptimizedImageUrl(
    key: string,
    width?: number,
    height?: number,
    quality = 80,
    folder: "items" | "profiles" | "temp" = "items"
  ) {
    const supabase = createClient();
    const bucketName = this.getBucketName(folder);

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(key, {
        transform: {
          width: width || undefined,
          height: height || undefined,
          resize: 'cover',
          quality
        }
      });

    return data.publicUrl;
  }

  // 파일 다운로드 URL 생성 (제한된 시간)
  static async generateDownloadUrl(
    key: string,
    expiresIn = 3600,
    folder: "items" | "profiles" | "temp" = "items"
  ): Promise<string> {
    const supabase = createClient();
    const bucketName = this.getBucketName(folder);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(key, expiresIn);

    if (error) {
      throw new Error(`Download URL generation failed: ${error.message}`);
    }

    return data.signedUrl;
  }
}

// 파일 유효성 검사
export class FileValidator {
  static validateImage(file: { size: number; type: string; name: string }) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

    const errors: string[] = [];

    if (file.size > maxSize) {
      errors.push("파일 크기는 10MB를 초과할 수 없습니다.");
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push("지원되는 이미지 형식: JPEG, PNG, WebP, AVIF");
    }

    const extension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(extension)) {
      errors.push("지원되는 파일 확장자: .jpg, .jpeg, .png, .webp, .avif");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

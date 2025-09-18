import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const species = searchParams.get("species");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = await createAdminClient();


    // Build query with simplified select
    let query = supabase
      .from('items')
      .select(`
        *
      `)
      .is('deleted_at', null);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (species) {
      query = query.ilike('species', `%${species}%`);
    }

    if (minPrice) {
      query = query.gte('current_price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('current_price', parseFloat(maxPrice));
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,species.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort) {
      case "price_asc":
        query = query.order('current_price', { ascending: true });
        break;
      case "price_desc":
        query = query.order('current_price', { ascending: false });
        break;
      case "ending_soon":
        query = query.order('ends_at', { ascending: true });
        break;
      case "most_watched":
        query = query.order('view_count', { ascending: false });
        break;
      case "most_bids":
        // This would need a custom query with joins
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    // Transform data for frontend compatibility
    const transformedItems = (items || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      species: item.species,
      currentPrice: item.current_price,
      buyNowPrice: item.buy_now_price,
      endsAt: item.ends_at,
      status: item.status,
      coverImageUrl: item.cover_image_url || "https://via.placeholder.com/400x400",
      _count: { 
        bids: 0, // Will be updated with proper join later
        watchlists: 0 
      },
      seller: { nickname: "익명" }, // Will be updated with proper join later
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: transformedItems,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return NextResponse.json(
      { success: false, message: "상품 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 사용자 역할 확인 (일반 사용자도 상품 등록 가능)
    if (!user.role || user.role === 'GUEST') {
      return NextResponse.json(
        { success: false, message: "상품 등록 권한이 없습니다. 로그인이 필요합니다." },
        { status: 403 }
      );
    }

    // FormData 처리
    const formData = await request.formData();

    const supabase = await createClient();

    // FormData 값 확인 및 검증
    const title = formData.get("title") as string;
    const species = formData.get("species") as string;
    const startPrice = formData.get("startPrice") as string;
    const bidStep = formData.get("bidStep") as string;
    const startsAt = formData.get("startsAt") as string;
    const endsAt = formData.get("endsAt") as string;
    const shippingMethod = formData.get("shippingMethod") as string;

    console.log('FormData received:', {
      title, species, startPrice, bidStep, startsAt, endsAt, shippingMethod
    });

    // 필수 필드 검증
    if (!title || !species || !startPrice || !bidStep || !startsAt || !endsAt || !shippingMethod) {
      return NextResponse.json(
        { 
          success: false, 
          message: "필수 정보를 모두 입력해주세요.",
          missing: { title: !title, species: !species, startPrice: !startPrice, bidStep: !bidStep, startsAt: !startsAt, endsAt: !endsAt, shippingMethod: !shippingMethod }
        },
        { status: 400 }
      );
    }

    // 기본 상품 정보
    const itemData = {
      seller_id: user.id,
      title: title,
      description: (formData.get("description") as string) || null,
      species: species,
      style: (formData.get("style") as string) || null,
      size_class: (formData.get("sizeClass") as string) || null,
      height_cm: formData.get("heightCm")
        ? parseFloat(formData.get("heightCm") as string)
        : null,
      crown_width_cm: formData.get("crownWidthCm")
        ? parseFloat(formData.get("crownWidthCm") as string)
        : null,
      trunk_diameter_cm: formData.get("trunkDiameterCm")
        ? parseFloat(formData.get("trunkDiameterCm") as string)
        : null,
      age_years_est: formData.get("ageYearsEst")
        ? parseInt(formData.get("ageYearsEst") as string)
        : null,
      health_notes: (formData.get("healthNotes") as string) || null,
      origin_notes: (formData.get("originNotes") as string) || null,
      care_history: (formData.get("careHistory") as string) || null,
      status: "PENDING_REVIEW",
      start_price: parseFloat(startPrice),
      current_price: parseFloat(startPrice),
      buy_now_price: formData.get("buyNowPrice")
        ? parseFloat(formData.get("buyNowPrice") as string)
        : null,
      reserve_price: formData.get("reservePrice")
        ? parseFloat(formData.get("reservePrice") as string)
        : null,
      bid_step: parseFloat(bidStep),
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      auto_extend_minutes: formData.get("autoExtendMinutes")
        ? parseInt(formData.get("autoExtendMinutes") as string)
        : null,
      shipping_method: shippingMethod,
      shipping_fee_policy: (formData.get("shippingFeePolicy") as string) || null,
      packaging_notes: (formData.get("packagingNotes") as string) || null,
    };

    console.log('Attempting to insert item with data:', itemData);

    // 상품 생성
    const { data: item, error: itemError } = await supabase
      .from('items')
      .insert(itemData)
      .select()
      .single();

    if (itemError) {
      console.error('Item creation error:', itemError);
      throw itemError;
    }

    console.log('Item created successfully:', item);

    // 미디어 파일 처리 (base64 방식)
    const mediaFiles = [];
    let mediaIndex = 0;

    while (formData.has(`media_${mediaIndex}_base64`)) {
      const base64Data = formData.get(`media_${mediaIndex}_base64`) as string;
      const fileName = formData.get(`media_${mediaIndex}_name`) as string;
      const mediaType = formData.get(`media_type_${mediaIndex}`) as string;

      if (base64Data && fileName) {
        console.log(`Processing media file ${mediaIndex}:`, fileName);
        
        try {
          // base64에서 실제 파일 데이터 추출
          const base64Content = base64Data.split(',')[1]; // "data:image/jpeg;base64," 부분 제거
          const buffer = Buffer.from(base64Content, 'base64');
          
          const fileExt = fileName.split('.').pop();
          const newFileName = `${item.id}_${mediaIndex}.${fileExt}`;
          const filePath = `items/${item.id}/${newFileName}`;

          // 임시로 public 폴더에 저장 (개발용)
          // 실제 운영에서는 Supabase Storage나 다른 클라우드 스토리지 사용 권장
          const fs = require('fs');
          const path = require('path');
          
          const publicDir = path.join(process.cwd(), 'public', 'uploads', 'items', item.id);
          
          // 디렉토리가 없으면 생성
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          
          const fullPath = path.join(publicDir, newFileName);
          fs.writeFileSync(fullPath, buffer);
          
          const publicUrl = `/uploads/items/${item.id}/${newFileName}`;

          mediaFiles.push({
            item_id: item.id,
            url: publicUrl,
            type: mediaType,
            sort: mediaIndex,
            file_name: newFileName,
            file_size: buffer.length,
          });
          
          console.log(`Media file saved: ${publicUrl}`);
        } catch (fileError) {
          console.error(`Error processing file ${mediaIndex}:`, fileError);
        }
      }

      mediaIndex++;
    }

    // 미디어 파일 저장 (인증된 클라이언트 사용)
    if (mediaFiles.length > 0) {
      console.log('Saving media files:', mediaFiles);
      const { error: mediaError } = await supabase
        .from('item_media')
        .insert(mediaFiles);

      if (mediaError) {
        console.error('Media save error:', mediaError);
        console.error('Media save error details:', JSON.stringify(mediaError, null, 2));
      } else {
        console.log('Media files saved successfully');
      }
    }

    return NextResponse.json({
      success: true,
      data: item,
      message:
        "상품이 성공적으로 등록되었습니다. 관리자 검수 후 경매가 시작됩니다.",
    });
  } catch (error) {
    console.error("Failed to create item:", error);
    return NextResponse.json(
      { success: false, message: "상품 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "LIVE";
    const species = searchParams.get("species");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('items')
      .select(`
        *,
        seller:users(id, name, nickname),
        media:item_media(*),
        bids(*),
        watchlists(*)
      `)
      .eq('status', status)
      .is('deleted_at', null);

    // Apply filters
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
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        items: items || [],
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

    // 미디어 파일 처리 제거 (임시로 주석 처리하여 Storage RLS 문제 우회)
    /*
    const mediaFiles = [];
    let mediaIndex = 0;

    while (formData.has(`media_${mediaIndex}`)) {
      const file = formData.get(`media_${mediaIndex}`) as File;
      const mediaType = formData.get(`media_type_${mediaIndex}`) as string;

      if (file) {
        console.log(`Processing media file ${mediaIndex}:`, file.name);
        
        // Supabase Storage에 파일 업로드
        const fileExt = file.name.split('.').pop();
        const fileName = `${item.id}_${mediaIndex}.${fileExt}`;
        const filePath = `items/${item.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('item-media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Public URL 생성
        const { data: urlData } = supabase.storage
          .from('item-media')
          .getPublicUrl(filePath);

        mediaFiles.push({
          item_id: item.id,
          url: urlData.publicUrl,
          type: mediaType,
          sort: mediaIndex,
        });
      }

      mediaIndex++;
    }

    // 미디어 파일 저장
    if (mediaFiles.length > 0) {
      const { error: mediaError } = await supabase
        .from('item_media')
        .insert(mediaFiles);

      if (mediaError) {
        console.error('Media save error:', mediaError);
      }
    }
    */

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

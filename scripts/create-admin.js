const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
    console.error('NEXT_PUBLIC_SUPABASE_URL와 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
    try {
        const adminEmail = 'admin@haedam.com'
        const adminPassword = 'Admin123!@#'
        const adminName = '관리자'
        const adminNickname = '관리자'

        console.log('🔐 관리자 계정 생성 중...')

        // 1. Supabase Auth에 사용자 생성
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
                name: adminName,
                nickname: adminNickname,
            }
        })

        if (authError) {
            console.error('❌ Auth 사용자 생성 실패:', authError.message)
            return
        }

        console.log('✅ Auth 사용자 생성 완료:', authData.user.id)

        // 2. users 테이블에 프로필 생성
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: adminEmail,
                name: adminName,
                nickname: adminNickname,
                role: 'ADMIN',
                is_verified: true,
                phone: '',
                profile_image: null
            })
            .select()
            .single()

        if (profileError) {
            console.error('❌ 프로필 생성 실패:', profileError.message)
            return
        }

        console.log('✅ 관리자 프로필 생성 완료')

        // 3. 결과 출력
        console.log('\n🎉 관리자 계정 생성 완료!')
        console.log('📧 이메일:', adminEmail)
        console.log('🔑 비밀번호:', adminPassword)
        console.log('👤 역할: ADMIN')
        console.log('🆔 사용자 ID:', authData.user.id)
        console.log('\n🌐 로그인: http://localhost:3000/login')
        console.log('🏛️ 관리자 대시보드: http://localhost:3000/admin')

    } catch (error) {
        console.error('❌ 오류 발생:', error.message)
    }
}

createAdminUser()

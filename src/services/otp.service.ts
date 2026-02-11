import supabase from "@src/client/supabase";

function generateOTPCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000))
}

export async function createOTP() {
    const code = generateOTPCode()
    const expired_at = new Date(Date.now() + 2 * 60 * 1000).toISOString()

    const { error } = await supabase
        .from('otp')
        .insert({ code, expired_at })

    if (error) {
        throw new Error(error.message)
    }

    return code
}

export async function getOTP(code: string) {
    const { data, error } = await supabase
        .from('otp')
        .select('*')
        .eq('code', code)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function grantOTP(code: string, uid: string) {
    const otp = await getOTP(code)

    if (otp.is_expired || new Date(otp.expired_at) < new Date()) {
        throw new Error('OTP code is expired')
    }

    if (otp.granted_by) {
        throw new Error('OTP code is already granted')
    }

    const { error } = await supabase
        .from('otp')
        .update({ granted_by: uid })
        .eq('code', code)

    if (error) {
        throw new Error(error.message)
    }
}

export async function consumeOTP(code: string) {
    const otp = await getOTP(code)

    if (otp.is_expired) {
        throw new Error('OTP code is expired')
    }

    if (new Date(otp.expired_at) < new Date()) {
        throw new Error('OTP code is expired')
    }

    if (!otp.granted_by) {
        return { granted: false }
    }

    const { error: expireError } = await supabase
        .from('otp')
        .update({ is_expired: true })
        .eq('code', code)

    if (expireError) {
        throw new Error(expireError.message)
    }

    const { data, error } = await supabase
        .from('APIKey')
        .insert({ uid: otp.granted_by })
        .select('key')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return { granted: true, key: data.key }
}

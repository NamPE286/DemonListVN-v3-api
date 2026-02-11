import supabase from "@src/client/supabase";
import { randomInt } from "crypto";

function generateOTPCode(): string {
    return String(randomInt(100000, 1000000))
}

function isOTPExpired(otp: { is_expired: boolean; expired_at: string }): boolean {
    return otp.is_expired || new Date(otp.expired_at) < new Date()
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

    if (isOTPExpired(otp)) {
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

    if (isOTPExpired(otp)) {
        throw new Error('OTP code is expired')
    }

    if (!otp.granted_by) {
        return { granted: false }
    }

    const { data: updated, error: expireError } = await supabase
        .from('otp')
        .update({ is_expired: true })
        .eq('code', code)
        .eq('is_expired', false)
        .select()

    if (expireError) {
        throw new Error(expireError.message)
    }

    if (!updated || updated.length === 0) {
        throw new Error('OTP code is expired')
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

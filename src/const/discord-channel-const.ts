const IS_DEV = process.env.DEVELOPMENT === 'true';
const TEST_CHANNEL_ID = "1470163143446630656"

export const DiscordChannel = {
    GENERAL: IS_DEV ? TEST_CHANNEL_ID : "1387261135576633554"
}
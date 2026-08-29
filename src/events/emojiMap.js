const emojiMap = {
    althardev: '6084459510003409024',
    accept: '6220019131815567199',
    decline: '6219900869891072756',
    rowr: '6219798224467665097',

    lightning: '5456140674028019486',
    denied: '5240241223632954241',
    warn: '5447644880824181073',
    msg: '5443038326535759644',
    statsup: '5244837092042750681',
    statsdown: '5246762912428603768',
    bell: '5458603043203327669',
    pin: '5397782960512444700',
    sb: '5424818078833715060',
    shield: '5251203410396458957',
    csoon: '5440621591387980068',
    crown: '5217822164362739968',
    trash: '5445267414562389170',
    tone: '5445267414562389170',
    ttwo: '5447203607294265305',
    tthree: '5453902265922376865',
    free: '5406756500108501710',
    sale: '5406683434124859552',
    party: '5461151367559141950',
    cart: '5864095106096698177',
    cart2: '5864218290053714610',
    fire: '5859539275372040586',
    book: '6172413765846310345',
    iphone: '6172378706028273125',
    user: '5863838791038407008',
    phone: '5415856569441093255',
    globe: '5861517687632433327',
    bot: '5864127571754489150',
    nonstop: '5854847234054558104',
    telep: '5861680977994060034',
    lock: '5296369303661067030',
    flag: '5460755126761312667',
    loader: '5386367538735104399',
    user2: '6255716507683129387',
    money: '5863998851584627334',
    check: '6170486390682296160',
    add: '6080018342020655804',
    minus: '6082665171451388803',
    buy: '6170434537542132949',
    msg2: '5861820727639937460',
    stock: '5895476993314524652',
    scart: '5864218290053714610',
    star1: '5936259309812846957',
    star2: '5935782740241683188',
    star3: '5938152874994308605',
    verified: '6296501388276926215',
    tiktoks: '5895287787120233726',

    //main1
    right: '6079955536713883621',
    left: '6079983694519475813',
    backs: '6219550383379848533',
    homes: '6079976869816443303',
    gear: '6080023384312259341',
    refresh: '6219593998772740992',
    checklist: '6220019131815567199',
    cross: '6219900869891072756',
    coin: '6219742450022359786',
    coin1: '6219865380576306269',
    coin2: '6219889436688131930',
    diamond: '6222059821101751779',
    diamond1: '6220033352452285617',
    diamond2: '6219830346528071201',
    marts: '6219484653200350720',
    arrowR: '6219798224467665097',
    checkl1: '6219547686140387134',
    cross1: '6221764597934726611',

    //sosmed
    youtube: '6219515396576256854',
    instagram: '6219556211650470144',
    telegram: '6219490996867046406',
    whatsapp: '6221798906133488248',
    facebook: '6219547175039278862',
    messanger: '6219754694974119412',
    tiktok: '6219814180271171657',
    twitter: '6219856709037335263',
    line: '6219751405029171106',
    discord: '6219938571113996835',
    linkedin: '6221811434553093634',

    //payment
    dana: '6222240935577656510',
    ovo: '6219671084845768912',
    gopay: '6219543855029560157',
    shopeepay: '6219656791194608422',
    linkaja: '6219690437968404818',
    doku: '6220030350270145680',
    isaku: '6194773752136343974',
    qris: '6219489004002222865',
    qris1: '6213187479525139392',

    //app
    alightm: '6219514189690445879',
    bstation: '6219513936287377395',
    capcut: '6219610044770558599',
    duolingo: '6219916460622358309',
    canva: '6219633370737941559',
    canva2: '6221829623739587987',
    chatgpt: '6219584068808356078',
    chatgptb: '6219724372505010686',
    claude: '6219811770794515358',
    netflix: '6219833825451582062',
    picsart: '6219794389061870226',
    spotify: '6222263299472367458',
    remini: '6219735075563513415',
    viu: '6219770663662526464',
    primevideo: '6221829211422728319',
    vidio: '6219824466717843418',
    gemini: '6219959427475185989',
    grok: '6219537086161100881',
    deepseek: '6219885588397433334',
    blackbox: '6219605801342870586',
    perplexity: '6219511775918825329',
    disney: '6220021708795944910',
    pinterest: '6221824650167460052',
    figma: '6219851464882265945',
    zoom: '6219685318367387868',

    //main
    depo: '5406745015365943482',
    hilo: '5413694143601842851',
    blnce: '6213258771687285396',
    users: '6212793132807889066',
    user1: '6212767852630384814',
    price: '6215121868370749047',
    bill: '6213005295602377677',
    ref: '6219826103100383157',
    wallet: '6213114048469279374',


    n1: '5370704514561093615',
    n2: '5372991773624774501',
    n3: '5370760374905747934',
    n4: '5372923273191370827',
    n5: '5372812377135789260',
    n6: '5377677857822618738',
    n7: '5372944481739879706',
    n8: '5375318911459798766',
    n9: '5373204164052528927',
    n0: '5375536082186154221',

    pr1: '6269298139165889540',
    pr2: '6269144224717870116',
    pr3: '6269464775307038921',
    pr4: '6269520996428943568',
};

const placeholderMap = {
    althardev: '😝',
    accept: '✅',
    decline: '❌',
    rowr: '↩️',
    lightning: '⚡',
    denied: '⛔',
    warn: '⚠️',
    msg: '💬',
    statsup: '📈',
    statsdown: '📉',
    bell: '🔔',
    pin: '📌',
    sb: '📋',
    shield: '🛡️',
    csoon: '🚧',
    crown: '👑',
    trash: '🗑️',
    tone: '🚮', // Diubah agar tidak kembar dengan trash
    ttwo: '🥈', // Diubah dari angka biasa agar beda dengan n2
    tthree: '🥉', // Diubah dari angka biasa agar beda dengan n3
    free: '🆓',
    sale: '🏷️',
    party: '🥳',
    cart: '🛒',
    cart2: '🛍️',
    fire: '🔥',
    book: '📖',
    iphone: '📱',
    user: '👤',
    phone: '☎️',
    globe: '🌐',
    bot: '🤖',
    nonstop: '♾️',
    telep: '📞',
    lock: '🔒', // Diubah dari %F0%9F%94%92
    flag: '🚩',
    loader: '⌛',
    user2: '👥',
    money: '💰',
    check: '✅',
    add: '➕',
    minus: '➖',
    buy: '💸',
    msg2: '💭',
    stock: '📦',
    scart: '🧺',
    star1: '⭐',
    star2: '🌟',
    star3: '✨',
    verified: '✔️',
    tiktoks: '🎶', // Diubah agar tidak kembar dengan tiktok
    right: '➡️',
    left: '⬅️',
    backs: '🔙',
    homes: '🏠',
    gear: '⚙️',
    refresh: '🔄',
    checklist: '☑️',
    cross: '❌',
    coin: '🪙',
    coin1: '🪙', // Duplikat dibiarkan jika memang harus sama, namun agar unik:
    coin1: '💰',
    coin2: '💳',
    diamond: '💎',
    diamond1: '🔮', // Diubah agar unik
    diamond2: '💍',
    marts: '🏪',
    arrowR: '➜',
    checkl1: '🌿', // Diubah agar tidak kembar dengan verified
    cross1: '✖️',
    youtube: '▶️',
    instagram: '📸',
    telegram: '✈️',
    whatsapp: '🟢',
    facebook: '📘',
    messanger: '🗣️',
    tiktok: '🎵',
    twitter: '🐦',
    line: '💚',
    discord: '🎮',
    linkedin: '💼',
    dana: '💙',
    ovo: '💜',
    gopay: '🟦',
    shopeepay: '🟠',
    linkaja: '🔴',
    doku: '💵',
    isaku: '👜',
    qris: '📲',
    qris1: '🧾',
    alightm: '💥',
    bstation: '📺',
    capcut: '🎬',
    duolingo: '🦉',
    canva: '🎨',
    canva2: '🖌️',
    chatgpt: '💻',
    chatgptb: '💡',
    claude: '🧠',
    netflix: '🎥',
    picsart: '🖼️',
    spotify: '🎧',
    remini: '📷',
    viu: '🍿',
    primevideo: '🎞️',
    vidio: '📹',
    gemini: '♊',
    grok: '🚀',
    deepseek: '🔎',
    blackbox: '⬛',
    perplexity: '❓',
    disney: '🏰',
    pinterest: '📍',
    figma: '📐',
    zoom: '↔️',
    depo: '🏦',
    hilo: '👋🏻',
    blnce: '⚖️',
    users: '🧑‍🤝‍🧑',
    user1: '🧑',
    price: '💲',
    bill: '📑',
    ref: '🆔',
    wallet: '👛',
    n1: '1️⃣',
    n2: '2️⃣',
    n3: '3️⃣',
    n4: '4️⃣',
    n5: '5️⃣',
    n6: '6️⃣',
    n7: '7️⃣',
    n8: '8️⃣',
    n9: '9️⃣',
    n0: '0️⃣',
    pr1: '😀',
    pr2: '😃',
    pr3: '😄',
    pr4: '😁',
};

const getCustomEmojiId = (keyOrId) => {
    if (!keyOrId || typeof keyOrId !== 'string') return null;
    if (emojiMap[keyOrId]) return emojiMap[keyOrId];
    return /^[0-9]+$/.test(keyOrId) ? keyOrId : null;
};

const buildEmojiEntities = (text) => {
    if (!text || typeof text !== 'string') return [];

    const entities = [];
    for (const [key, placeholder] of Object.entries(placeholderMap)) {
        const custom_emoji_id = emojiMap[key];
        if (!custom_emoji_id) continue;

        let index = text.indexOf(placeholder);
        while (index !== -1) {
            entities.push({
                type: 'custom_emoji',
                offset: index,
                length: placeholder.length,
                custom_emoji_id
            });
            index = text.indexOf(placeholder, index + placeholder.length);
        }
    }

    return entities.sort((a, b) => a.offset - b.offset);
};

const buildEmojiHtml = (text) => {
    if (!text || typeof text !== 'string') return '';

    let result = text;
    for (const [key, placeholder] of Object.entries(placeholderMap)) {
        const customEmojiId = emojiMap[key];
        if (!customEmojiId) continue;
        const cleanPlaceholder = placeholder.replace(/\uFE0E|\uFE0F/g, '');
        const tag = `<tg-emoji emoji-id="${customEmojiId}">${cleanPlaceholder}</tg-emoji>`;
        result = result.split(placeholder).join(tag);
    }

    return result;
};

const Emoji = Object.freeze({
    ...placeholderMap
});

const EmojiBtn = Object.freeze(
    Object.fromEntries(
        Object.keys(emojiMap).map((key) => [key, emojiMap[key]])
    )
);

module.exports = {
    ...emojiMap,
    emojiMap,
    placeholderMap,
    getCustomEmojiId,
    buildEmojiEntities,
    buildEmojiHtml,
    Emoji,
    EmojiBtn
};
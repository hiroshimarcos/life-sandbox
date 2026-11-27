function encodeUtf8Base64(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

function decodeUtf8Base64(base64) {
    return decodeURIComponent(escape(atob(base64)));
}

function computeSaveChecksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function exportSaveState(game, wardrobeList, marketData) {
    const snapshot = {
        player: {
            name: game.player.name,
            gender: game.player.gender,
            skinTone: game.player.skinTone,
            height: game.player.height,
            hairStyle: game.player.hairStyle,
            hairColor: game.player.hairColor,
            energy: game.player.energy,
            maxEnergy: game.player.maxEnergy,
            hunger: game.player.hunger,
            money: game.player.money,
            clothes: game.player.clothes,
            fat: game.player.fat,
            muscle: game.player.muscle,
            isEmployed: game.player.isEmployed,
            taskQueue: game.player.taskQueue,
            houseUpgrades: { ...game.player.houseUpgrades },
            pet: game.player.pet ? { ...game.player.pet } : null
        },
        time: {
            day: game.time.day,
            hour: game.time.hour,
            minute: game.time.minute
        },
        ownedOutfits: wardrobeList.filter(o => o.owned).map(o => o.id),
        foodStock: Object.fromEntries((marketData.comida || []).map(item => [item.id, item.stock])),
        location: {
            currentEnvironment: game.currentEnvironment,
            currentSubRoom: game.currentSubRoom
        }
    };

    const base64 = encodeUtf8Base64(JSON.stringify(snapshot));
    const checksum = computeSaveChecksum(base64);
    return `LS1:${checksum}:${base64}`;
}

function importSaveState(saveString) {
    const invalidError = () => new Error("Código de save inválido ou corrompido.");

    if (typeof saveString !== "string") throw invalidError();

    const trimmed = saveString.trim();
    if (!trimmed.startsWith("LS1:")) throw invalidError();

    const parts = trimmed.split(":");
    if (parts.length !== 3 || !parts[1] || !parts[2]) throw invalidError();

    const [, checksum, base64] = parts;
    if (String(computeSaveChecksum(base64)) !== checksum) throw invalidError();

    let data;
    try {
        data = JSON.parse(decodeUtf8Base64(base64));
    } catch {
        throw invalidError();
    }

    if (!data || typeof data !== "object" || !data.player || !data.time) {
        throw invalidError();
    }

    return data;
}

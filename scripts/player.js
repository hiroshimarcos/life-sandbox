// ==========================================
// LISTA GLOBAL DE ROUPAS
// ==========================================
const wardrobeOptions = [
    { id: "pijama", name: "Pijama 🛌", price: 0, owned: true },
    { id: "casual", name: "Camiseta e Jeans 👕", price: 0, owned: true },
    { id: "esporte", name: "Roupa Esportiva 🏃", price: 80, owned: false },
    { id: "social", name: "Roupa Social Casual 👔", price: 120, owned: false },
    { id: "festa", name: "Vestido de Festa 👗", price: 150, owned: false },
    { id: "terno", name: "Terno Completo 💼", price: 250, owned: false },
    { id: "inverno", name: "Casaco de Inverno ❄️", price: 180, owned: false },
    { id: "praia", name: "Roupa de Praia 🌴", price: 60, owned: false },
    { id: "trabalho_pesado", name: "Macacão de Trabalho 🛠️", price: 100, owned: false },
    { id: "fantasia", name: "Fantasia de Super-herói 🦸", price: 400, owned: false }
];

// ==========================================
// CONFIGURAÇÃO DOS TIPOS CORPORAIS
// ==========================================
const BODY_TYPES_CONFIG = [
    { id: "magro", attributes: { fat: "low", muscle: "low" }, display_name: "Magro", description: "Corpo bem magro, pouca massa, aparência frágil ou ágil." },
    { id: "comum", attributes: { fat: "medium", muscle: "low" }, display_name: "Comum", description: "Físico padrão do dia a dia, sem muita definição muscular e sem excesso de peso." },
    { id: "volumoso", attributes: { fat: "high", muscle: "low" }, display_name: "Volumoso", description: "Corpo com peso acumulado e pouca sustentação muscular." },
    { id: "definido", attributes: { fat: "low", muscle: "medium" }, display_name: "Definido", description: "Pouca gordura e músculos à mostra; visual fit e trabalhado." },
    { id: "equilibrado", attributes: { fat: "medium", muscle: "medium" }, display_name: "Equilibrado", description: "Aparência saudável, forte e natural; físico clássico de aventureiro." },
    { id: "pesado", attributes: { fat: "high", muscle: "medium" }, display_name: "Pesado", description: "Porte físico largo e denso, passando ideia de estrutura e peso." },
    { id: "esculpido", attributes: { fat: "low", muscle: "high" }, display_name: "Esculpido", description: "Físico de alta definição; baixíssima gordura com músculos extremamente em evidência." },
    { id: "musculoso", attributes: { fat: "medium", muscle: "high" }, display_name: "Musculoso", description: "Grande volume muscular e boa estrutura; porte forte e imponente." },
    { id: "colossal", attributes: { fat: "high", muscle: "high" }, display_name: "Colossal", description: "Físico de força bruta; massa muscular gigante somada a uma camada espessa de gordura." }
];

const BODY_TYPE_GENDER_NAMES = {
    magro: { masculino: "Magro", feminino: "Magra", outro: "Magro(a)" },
    comum: { masculino: "Comum", feminino: "Comum", outro: "Comum" },
    volumoso: { masculino: "Volumoso", feminino: "Volumosa", outro: "Volumoso(a)" },
    definido: { masculino: "Definido", feminino: "Definida", outro: "Definido(a)" },
    equilibrado: { masculino: "Equilibrado", feminino: "Equilibrada", outro: "Equilibrado(a)" },
    pesado: { masculino: "Pesado", feminino: "Pesada", outro: "Pesado(a)" },
    esculpido: { masculino: "Esculpido", feminino: "Esculpida", outro: "Esculpido(a)" },
    musculoso: { masculino: "Musculoso", feminino: "Musculosa", outro: "Musculoso(a)" },
    colossal: { masculino: "Colossal", feminino: "Colossal", outro: "Colossal" }
};

// ==========================================
// SISTEMA DO PLAYER
// ==========================================
class Player {
    constructor(name, gender = "masculino", appearance = {}) {
        this.name = name;
        this.gender = gender;
        this.skinTone = appearance.skinTone || "medio";
        this.height = appearance.height || "medio";
        this.hairStyle = appearance.hairStyle || "curto";
        this.hairColor = appearance.hairColor || "castanho";
        this.energy = 100;
        this.maxEnergy = 100;
        this.hunger = 0;
        this.money = 150;
        this.clothes = "pijama";

        this.fat = 35;
        this.muscle = 15;

        this.isEmployed = false;
        this.taskQueue = 0;
        this.houseUpgrades = { patio: false, piscina: false };
        this.pet = null;
    }

    modifyEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, Math.max(0, this.energy + amount));
    }

    modifyHunger(amount) {
        this.hunger = Math.min(100, Math.max(0, this.hunger + amount));
    }

    modifyFat(amount) {
        this.fat = Math.min(100, Math.max(0, this.fat + amount));
    }

    modifyMuscle(amount) {
        this.muscle = Math.min(100, Math.max(0, this.muscle + amount));
    }

    setClothes(outfitIdOrName) {
        const match = wardrobeOptions.find(o => o.id === outfitIdOrName || o.name === outfitIdOrName);
        this.clothes = match ? match.id : outfitIdOrName;
    }

    setHair(hairStyle, hairColor) {
        if (hairStyle) this.hairStyle = hairStyle;
        if (hairColor) this.hairColor = hairColor;
    }

    getClothesName() {
        const item = wardrobeOptions.find(o => o.id === this.clothes);
        return item ? item.name : this.clothes;
    }

    hasOutfit(outfitId) {
        const item = wardrobeOptions.find(o => o.id === outfitId);
        return item ? item.owned : false;
    }

    buyOutfit(outfitId) {
        const item = wardrobeOptions.find(o => o.id === outfitId);
        if (item) {
            item.owned = true;
        }
    }

    hasHouseUpgrade(upgradeId) {
        return Boolean(this.houseUpgrades[upgradeId]);
    }

    unlockHouseUpgrade(upgradeId) {
        this.houseUpgrades[upgradeId] = true;
    }

    adoptPet(type, name) {
        this.pet = {
            type,
            name,
            energy: 100,
            hunger: 0,
            hygiene: 100,
            happiness: 100,
            foodStock: 0,
            outfit: "Nenhuma",
            accessory: "Nenhum"
        };
    }

    renamePet(name) {
        if (!this.pet) return false;
        const trimmed = String(name || "").trim();
        if (!trimmed) return false;
        this.pet.name = trimmed;
        return true;
    }

    modifyPetStat(stat, amount) {
        if (!this.pet || !["energy", "hunger", "hygiene", "happiness"].includes(stat)) return;
        this.pet[stat] = Math.min(100, Math.max(0, this.pet[stat] + amount));
    }

    getCategoryLevel(value) {
        if (value <= 33) return "low";
        if (value <= 66) return "medium";
        return "high";
    }

    getBodyTypeInfo() {
        const fatLevel = this.getCategoryLevel(this.fat);
        const muscleLevel = this.getCategoryLevel(this.muscle);

        const match = BODY_TYPES_CONFIG.find(type =>
            type.attributes.fat === fatLevel && type.attributes.muscle === muscleLevel
        );

        if (!match) return { display_name: "Indefinido", description: "" };

        const displayName = BODY_TYPE_GENDER_NAMES[match.id]?.[this.gender] || match.display_name;
        return { ...match, display_name: displayName };
    }
}
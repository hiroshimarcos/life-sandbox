// ==========================================
// SISTEMA DE ESTOQUE E ITENS DO MERCADO
// ==========================================
const marketCatalog = {
    comida: [
        { id: "agua", name: "Garrafa de Água 💧", price: 5, type: "food", hungerRestore: 5, energyRestore: 5, fatFood: 0, stock: 0 },
        { id: "lanche", name: "Lanche Rápido 🍔", price: 15, type: "food", hungerRestore: 40, energyRestore: 10, fatFood: 5, stock: 0 },
        { id: "salada", name: "Salada Saudável 🥗", price: 25, type: "food", hungerRestore: 30, energyRestore: 15, fatFood: 1, stock: 0 },
        { id: "pizza", name: "Pizza Inteira 🍕", price: 45, type: "food", hungerRestore: 70, energyRestore: 20, fatFood: 10, stock: 0 },
        { id: "banquete", name: "Banquete Completo 🍖", price: 80, type: "food", hungerRestore: 100, energyRestore: 35, fatFood: 18, stock: 0 }
    ]
};

class MarketManager {
    constructor() {
        this.catalog = marketCatalog;
    }

    // Retorna apenas as roupas que ainda NÃO foram compradas usando a lista global 'wardrobeOptions'
    getClothingActions(game) {
        const unownedClothes = wardrobeOptions.filter(item => !item.owned);

        if (unownedClothes.length === 0) {
            return [{
                label: "✨ Todas as roupas já foram adquiridas!",
                costEnergy: 0,
                costHours: 0,
                execute: (g) => { g.log("A arara de roupas está vazia."); }
            }];
        }

        return unownedClothes.map(item => ({
            label: `Comprar ${item.name} (R$ ${item.price})`,
            costEnergy: -10,
            costHours: 0.5,
            execute: (g) => {
                if (g.player.money < item.price) {
                    g.log(`Você não tem dinheiro suficiente para ${item.name} (R$ ${item.price})!`);
                    return;
                }
                g.player.money -= item.price;
                g.player.buyOutfit(item.id);
                g.player.modifyEnergy(-10);
                g.time.advanceTime(0.5, g);
                g.log(`🛍️ Você comprou: **${item.name}**!`);
                g.updateUI();
                g.renderActions();
            }
        }));
    }

    getFoodActions() {
        return this.catalog.comida.map(item => {
            const energySign = item.energyRestore >= 0 ? "+" : "";
            const fatSign = item.fatFood >= 0 ? "+" : "";
            return {
                label: `Comprar ${item.name} [Estoque: ${item.stock}] ⚡ ${energySign}${item.energyRestore} 🤤 ${fatSign}${item.fatFood} (R$ ${item.price})`,
                costEnergy: -1,
                costHours: 0.25,
                execute: (g) => {
                    if (g.player.money < item.price) {
                        g.log(`Você não tem dinheiro suficiente para comprar ${item.name} (R$ ${item.price})!`);
                        return;
                    }
                    g.player.money -= item.price;
                    item.stock += 1;
                    g.player.modifyEnergy(-1);
                    g.time.advanceTime(0.25, g);
                    g.log(`🛒 Você comprou 1x ${item.name} para o seu estoque!`);
                    g.updateUI();
                    g.renderActions();
                }
            };
        });
    }

    getKitchenFoodActions() {
        const availableFood = this.catalog.comida.filter(item => item.stock > 0);

        if (availableFood.length === 0) {
            return [{
                label: "🚫 Seu estoque de comida está vazio (Vá ao Mercado comprar)",
                costEnergy: 0,
                costHours: 0,
                execute: (g) => { g.log("Você não tem comida guardada na despensa."); }
            }];
        }

        return availableFood.map(item => {
            const energySign = item.energyRestore >= 0 ? "+" : "";
            const fatSign = item.fatFood >= 0 ? "+" : "";
            return {
                label: `Comer ${item.name} [Estoque: ${item.stock}] ⚡ ${energySign}${item.energyRestore} 🤤 ${fatSign}${item.fatFood}`,
                costEnergy: 0,
                costHours: 0.25,
                execute: (g) => {
                    item.stock -= 1;
                    g.player.modifyHunger(-item.hungerRestore);
                    g.player.modifyEnergy(item.energyRestore);
                    g.player.modifyFat(item.fatFood);
                    g.time.advanceTime(0.25, g);
                    g.log(`😋 Você comeu 1x ${item.name} do seu estoque.`);
                    g.updateUI();
                    g.renderActions();
                }
            };
        });
    }
}

const market = new MarketManager();
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
        let actions = [];
        
        // Filtra direto da lista global as roupas não compradas
        const unownedClothes = wardrobeOptions.filter(item => !item.owned);

        unownedClothes.queries || unownedClothes.forEach(item => {
            actions.push({
                label: `Comprar ${item.name} (R$ ${item.price})`,
                costEnergy: -10,
                costHours: 0.5,
                execute: (g) => {
                    if (g.player.money >= item.price) {
                        g.player.money -= item.price;
                        g.player.buyOutfit(item.id); // Altera o status 'owned' na lista global
                        game.player.modifyEnergy(-10); // Perde energia
                        game.time.advanceTime(0.5, game); // Avança hora
                        g.log(`🛍️ Você comprou: **${item.name}**!`);
                    } else {
                        g.log(`Você não tem dinheiro suficiente para ${item.name} (R$ ${item.price})!`);
                    }
                    g.updateUI();
                    g.renderActions();
                }
            });
        });

        if (actions.length === 0) {
            actions.push({
                label: "✨ Todas as roupas já foram adquiridas!",
                costEnergy: 0,
                costHours: 0,
                execute: (g) => { g.log("A arara de roupas está vazia."); }
            });
        }
        return actions;
    }

    getFoodActions(game) {
        let actions = [];
        this.catalog.comida.forEach(item => {
            const energySign = item.energyRestore >= 0 ? "+" : "";
            const fatSign = item.fatFood >= 0 ? "+" : "";
            actions.push({
                label: `Comprar ${item.name} [Estoque: ${item.stock}] ⚡ ${energySign}${item.energyRestore} 🤤 ${fatSign}${item.fatFood} (R$ ${item.price})`,
                costEnergy: -1,
                costHours: 0.25,
                execute: (g) => {
                    if (g.player.money >= item.price) {
                        g.player.money -= item.price;
                        item.stock += 1;
                        game.player.modifyEnergy(-1); // Perde energia
                        game.time.advanceTime(0.25, game); // Avança hora
                        g.log(`🛒 Você comprou 1x ${item.name} para o seu estoque!`);
                    } else {
                        g.log(`Você não tem dinheiro suficiente para comprar ${item.name} (R$ ${item.price})!`);
                    }
                    g.updateUI();
                    g.renderActions();
                }
            });
        });
        return actions;
    }

    // Retorna as ações de comer os itens que estão no estoque (para usar na Cozinha)
    getKitchenFoodActions(game) {
        let actions = [];
        
        this.catalog.comida.forEach(item => {
            if (item.stock > 0) {
                // Formata os sinais de + ou - para energia e gordura
                const energySign = item.energyRestore >= 0 ? "+" : "";
                const fatSign = item.fatFood >= 0 ? "+" : "";

                actions.push({
                    label: `Comer ${item.name} [Estoque: ${item.stock}] ⚡ ${energySign}${item.energyRestore} 🤤 ${fatSign}${item.fatFood}`,
                    costEnergy: 0,
                    costHours: 0.25, // 15 minutos para comer
                    execute: (g) => {
                        item.stock -= 1;
                        g.player.modifyHunger(-item.hungerRestore);
                        g.player.modifyEnergy(item.energyRestore); // Valores positivos recuperam energia
                        g.player.modifyFat(item.fatFood);    
                        game.time.advanceTime(0.25, game); // Avança hora
                        g.log(`😋 Você comeu 1x ${item.name} do seu estoque.`);
                        g.updateUI();
                        g.renderActions();
                    }
                });
            }
        });

        if (actions.length === 0) {
            actions.push({
                label: "🚫 Seu estoque de comida está vazio (Vá ao Mercado comprar)",
                costEnergy: 0,
                costHours: 0,
                execute: (g) => { g.log("Você não tem comida guardada na despensa."); }
            });
        }

        return actions;
    }
}

const market = new MarketManager();
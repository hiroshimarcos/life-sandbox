// ==========================================
// AMBIENTES E SUBROOMS (CÔMODOS)
// ==========================================
function buildHairActions(options, prop, price, onApply, customExecute) {
    return options.map(([id, label, icon]) => ({
        label: `${icon} ${label} (R$ ${price})`,
        costEnergy: 0,
        costHours: 1,
        execute: (game) => {
            if (game.player[prop] === id) {
                game.log(`💇 Você já está com esse visual (${label}).`);
                return;
            }
            if (game.player.money < price) {
                game.log(`❌ Dinheiro insuficiente! Você precisa de R$ ${price}.`);
                return;
            }
            if (customExecute) {
                customExecute(game, id, label);
                return;
            }
            game.player.money -= price;
            game.time.advanceTime(1, game);
            onApply(game, id);
            game.log(`💇 Visual atualizado para **${label}**! (-R$ ${price})`);
        }
    }));
}

function buyHouseUpgrade(game, upgradeId, label, price) {
    if (game.player.hasHouseUpgrade(upgradeId)) return;
    if (game.player.money < price) {
        game.log(`❌ Dinheiro insuficiente! Você precisa de R$ ${price} para construir ${label}.`);
        return;
    }
    game.player.money -= price;
    game.player.unlockHouseUpgrade(upgradeId);
    game.time.updateRentCost(game.player);
    game.player.modifyEnergy(-5);
    game.time.advanceTime(1, game);
    game.log(`🏗️ Você contratou a reforma e construiu **${label}** em casa! O aluguel subiu para R$ ${game.time.rentCost}.`);
    game.updateUI();
    game.renderActions();
}

function adoptPetFromShop(game, type, price, defaultName) {
    if (game.player.pet) {
        game.log("🚫 Você já possui um pet!");
        return;
    }
    if (game.player.money < price) {
        game.log(`❌ Dinheiro insuficiente! Você precisa de R$ ${price} para adotar um ${type}.`);
        return;
    }
    const input = typeof prompt === "function" ? prompt(`Escolha um nome para o seu ${type}:`, defaultName) : "";
    const name = (input && input.trim()) ? input.trim() : defaultName;
    game.player.money -= price;
    game.player.adoptPet(type, name);
    game.log(`🐾 Você adotou um ${type} chamado **${name}**! O menu de Status do Pet foi desbloqueado.`);
}

function buyPetItem(game, price, logMessage, applyEffect) {
    if (!game.player.pet) {
        game.log("🚫 Você precisa adotar um pet antes de comprar itens na loja!");
        return;
    }
    if (game.player.money < price) {
        game.log(`❌ Dinheiro insuficiente! Você precisa de R$ ${price}.`);
        return;
    }
    game.player.money -= price;
    applyEffect(game.player.pet);
    game.log(logMessage);
}

function interactWithPet(game, { playerEnergy, petEnergy, hours, happiness, actionName }) {
    if (!game.player.pet) {
        game.log("🚫 Você precisa adotar um pet antes!");
        return;
    }
    if (game.player.energy < playerEnergy) {
        game.log("❌ Energia insuficiente para interagir com seu pet.");
        return;
    }
    if (game.player.pet.energy < petEnergy) {
        game.log(`😴 **${game.player.pet.name}** está sem energia para ${actionName}.`);
        return;
    }
    game.player.modifyEnergy(-playerEnergy);
    game.time.advanceTime(hours, game);
    game.player.modifyPetStat("energy", -petEnergy);
    game.player.modifyPetStat("happiness", happiness);
    game.log(`🐾 Você ${actionName} com **${game.player.pet.name}**! (+${happiness} Felicidade, -${petEnergy} Energia do Pet)`);
    game.updateUI();
}

const rooms = {
    // 🏠 AMBIENTE 1: A CASA
    casa: {
        name: "Casa",
        isEnvironment: true,
        subRooms: {
            sala: {
                name: "Sala",
                actions: [
                    {
                        label: "📺 Assistir TV",
                        costEnergy: -10, // Perde 10 de energia
                        costHours: 1,
                        execute: (game) => {
                            game.player.modifyEnergy(-10); // 
                            game.time.advanceTime(1, game); // Avança 1 hora
                            game.log("📺 Você assistiu TV e relaxou um pouco.");
                            game.updateUI();
                        }
                    },
                    {
                        label: "💼 Procurar Trabalho",
                        costEnergy: -10, // Gasta 10 de energia
                        costHours: 2,
                        execute: (game) => {
                            game.searchForJob();
                        }
                    },
                    {
                        label: "🐾 Fazer Carinho no Pet",
                        requiresPet: true,
                        costEnergy: -5,
                        petEnergyCost: 5,
                        costHours: 0.5,
                        execute: (game) => interactWithPet(game, {
                            playerEnergy: 5,
                            petEnergy: 5,
                            hours: 0.5,
                            happiness: 15,
                            actionName: "fez carinho"
                        })
                    }
                ]
            },
            quarto: {
                name: "Quarto",
                actions: [
                    {
                        label: "🛏️ Dormir (Até acordar no dia seguinte)",
                        costEnergy: 100, // Recupera muita energia
                        execute: (game) => {
                            game.player.modifyEnergy(100);
                            game.time.sleepUntilNextMorning(8, game);
                            game.log("💤 Você dormiu profundamente e recuperou suas energias.");
                            game.updateUI();
                        }
                    },
                    {
                        label: "🛋️ Tirar um Cochilo",
                        costEnergy: 30, // Recupera energia
                        costHours: 2,
                        execute: (game) => {
                            game.player.modifyEnergy(30);
                            game.time.advanceTime(2, game);
                            game.log("🛋️ Você tirou um cochilo revigorante no quarto.");
                            game.updateUI();
                        }
                    },
                    {
                        label: "👕 Trocar de Roupa",
                        costEnergy: 0,
                        costHours: 0,
                        execute: (game) => {
                            game.openWardrobe();
                        }
                    }
                ]
            },
            cozinha: {
                name: "Cozinha",
                actions: [] // Gerenciado dinamicamente pelo estoque do mercado
            },
            banheiro: {
                name: "Banheiro",
                actions: [
                    {
                        label: "🚿 Tomar Banho Rápido",
                        costEnergy: 10,
                        costHours: 1,
                        execute: (game) => {
                            minigame.openBathGame((success, cancelled) => { 
                                if (cancelled) {
                                    game.log("Você desistiu do banho.");
                                    return;
                                }
                                game.player.modifyEnergy(10);
                                game.time.advanceTime(1, game);
                                if (success) {
                                    game.log("🚿 Você tomou um banho relaxante. (+10 Energia)");
                                }
                                game.updateUI();
                                game.renderActions();
                            });
                        }

                    },
                    {
                        label: "🚽 Fazer Necessidades",
                        costEnergy: 5,
                        costHours: 0.5,
                        execute: (game) => {
                            game.player.modifyEnergy(5);
                            game.time.advanceTime(0.5, game);
                            game.log("🚽 Você usou o banheiro.");
                            game.updateUI();
                        }
                    }
                ]
            },
            patio: {
                name: "Pátio",
                requiresUpgrade: "patio",
                actions: [
                    {
                        label: "🌱 Cuidar do Jardim",
                        costEnergy: -15, // Gasta energia
                        costHours: 1,
                        execute: (game) => {
                            game.player.modifyEnergy(-15);
                            game.time.advanceTime(1, game);
                            game.log("🌿 Você cuidou das plantas do pátio.");
                            game.updateUI();
                        }
                    },
                    {
                        label: "🎾 Brincar com o Pet",
                        requiresPet: true,
                        costEnergy: -15,
                        petEnergyCost: 15,
                        costHours: 1,
                        execute: (game) => interactWithPet(game, {
                            playerEnergy: 15,
                            petEnergy: 15,
                            hours: 1,
                            happiness: 25,
                            actionName: "brincou"
                        })
                    }
                ]
            },
            piscina: {
                name: "Piscina",
                requiresUpgrade: "piscina",
                actions: [
                    {
                        label: "🏊 Nadar na Piscina",
                        costEnergy: -20,
                        costHours: 1,
                        execute: (game) => {
                            game.player.modifyEnergy(-20);
                            game.player.modifyMuscle(2);
                            game.player.modifyFat(-2);
                            game.time.advanceTime(1, game);
                            game.log("🏊 Você nadou na piscina e se exercitou! (+2 Músculo, -2 Gordura)");
                            game.updateUI();
                        }
                    }
                ]
            }
        }
    },

    // 🏋️ AMBIENTE 2: A ACADEMIA
    academia: {
        name: "🏋️ Academia (Abre 08:00 - Fecha 20:00)",
        isEnvironment: true,
        subRooms: {
            patio: {
                name: "Pátio / Área de Treino",
                actions: [
                    {
                        label: "🚶 Caminhada Rápida / Esteira (Leve)",
                        costEnergy: -10,
                        costHours: 1,
                        execute: (game) => {
                            minigame.openGymGame("leve", (success, cancelled) => {
                                if (cancelled) {
                                    game.log("Você desistiu do treino antes de começar.");
                                    return;
                                }
                                game.player.modifyEnergy(-10);
                                game.time.advanceTime(1, game);
                                if (success) {
                                    game.player.modifyMuscle(3);
                                    game.player.modifyFat(-3);
                                    game.log("🏋️ **TREINO CONCLUÍDO!** Treino leve na esteira. (+3 Músculo, -3 Gordura)");
                                }
                                game.updateUI();
                                game.renderActions();
                            });
                        }
                    },
                    {
                        label: "🏋️ Treino de Musculação (Moderado)",
                        costEnergy: -25,
                        costHours: 2,
                        execute: (game) => {
                            minigame.openGymGame("moderado", (success, cancelled) => {
                                if (cancelled) {
                                    game.log("Você desistiu do treino antes de começar.");
                                    return;
                                }
                                game.player.modifyEnergy(-25);
                                game.time.advanceTime(2, game);
                                if (success) {
                                    game.player.modifyMuscle(8);
                                    game.player.modifyFat(-6);
                                    game.log("🏋️ **TREINO CONCLUÍDO!** Musculação concluída! (+8 Músculo, -6 Gordura)");
                                }
                                game.updateUI();
                                game.renderActions();
                            });
                        }
                    },
                    {
                        label: "🔥 Treino Funcional / Crossfit (Intenso)",
                        costEnergy: -45,
                        costHours: 3,
                        execute: (game) => {
                            minigame.openGymGame("intenso", (success, cancelled) => {
                                if (cancelled) {
                                    game.log("Você desistiu do treino antes de começar.");
                                    return;
                                }
                                game.player.modifyEnergy(-45);
                                game.time.advanceTime(3, game);
                                if (success) {
                                    game.player.modifyMuscle(15);
                                    game.player.modifyFat(-12);
                                    game.log("🔥 **TREINO CONCLUÍDO!** Crossfit intenso! (+15 Músculo, -12 Gordura)");
                                }
                                game.updateUI();
                                game.renderActions();
                            });
                        }
                    }
                ]
            },
            banheiro: {
                name: "Banheiro da Academia",
                actions: [
                    {
                        label: "🚿 Tomar Banho Pós-Treino",
                        costEnergy: 10, // Recupera energia
                        costHours: 1,
                        execute: (game) => {
                            minigame.openBathGame((success, cancelled) => {
                                if (cancelled) {
                                    game.log("Você desistiu do banho na academia.");
                                    return;
                                }
                                game.player.modifyEnergy(10);
                                game.time.advanceTime(1, game);
                                if (success) {
                                    game.log("🚿 Você tomou um banho revigorante na academia! (+10 Energia)");
                                }
                                game.updateUI();
                                game.renderActions();
                            });
                        }
                    },
                    {
                        label: "🚽 Fazer Necessidades",
                        costEnergy: 5,
                        costHours: 0.5,
                        execute: (game) => {
                            game.player.modifyEnergy(5);
                            game.time.advanceTime(0.5, game);
                            game.log("🚽 Você usou o banheiro da academia.");
                            game.updateUI();
                        }
                    }
                ]
            }
        }
    },

    // 💼 AMBIENTE 3: O TRABALHO
    trabalho: {
        name: "Escritório (Trabalho) - Expediente: 09:00 às 18:00",
        isEnvironment: true,
        subRooms: {
            escritorio: {
                name: "Escritório",
                actions: [
                    {
                        label: "💻 Executar Tarefa (Ativa Minijogo)",
                        costEnergy: -30, // perde energia
                        costHours: 2,
                        isWorkTask: true,
                        requiresPendingTasks: true,
                        execute: (game) => {
                            if (game.player.taskQueue > 0) {
                                minigame.openWorkGame((success, cancelled) => {
                                    if (cancelled) {
                                        game.log("Você desistiu da tarefa antes de iniciar.");
                                        return;
                                    }
                                    game.player.modifyEnergy(-30);
                                    game.time.advanceTime(2, game);
                                    if (success) {
                                        game.player.taskQueue -= 1;
                                        game.player.money += 90;
                                        game.log("🎯 **TAREFA CONCLUÍDA!** Ganhou R$ 90.");
                                    } else {
                                        game.log("⚠️ **FALHA NA TAREFA!** A tarefa foi enviada com erros (R$ 0).");
                                    }
                                    game.updateUI();
                                    game.renderActions();
                                });
                            } else {
                                game.log("Não há tarefas pendentes na pilha!");
                            }
                        }
                    },
                    {
                        label: "👾 Vadiar no Trabalho (Minijogo de Tiro)",
                        costEnergy: 10,
                        costHours: 1,
                        isWorkTask: true,
                        execute: (game) => {
                            minigame.openSlackerGame((success, cancelled) => {
                                if (cancelled) {
                                    game.log("Você desistiu de vadiar.");
                                    return;
                                }
                                game.player.modifyEnergy(-10);
                                game.time.advanceTime(1, game);
                                if (success) {
                                    game.log("🕹️ **VADIANDO COM SUCESSO!**");
                                }
                                game.updateUI();
                                game.renderActions();
                            });
                        }
                    },
                    {
                        label: "🚪 Pedir Demissão",
                        costEnergy: 0,
                        costHours: 0,
                        execute: (game) => {
                            game.player.isEmployed = false;
                            game.player.taskQueue = 0;
                            game.log("Você pediu demissão.");
                            game.changeLocation("casa", "sala"); 
                        }
                    }
                ]
            },
            banheiro: {
                name: "Banheiro do Escritório",
                actions: [
                    {
                        label: "🚿 Tomar Banho Rápido",
                        costEnergy: 10, // Recupera energia
                        costHours: 1,
                        execute: (game) => {
                            minigame.openBathGame((success, cancelled) => {
                                if (cancelled) {
                                    game.log("Você desistiu do banho no trabalho.");
                                    return;
                                }
                                game.player.modifyEnergy(10);
                                game.time.advanceTime(1, game);
                                if (success) {
                                    game.log("🚿 Você tomou um banho escondido no banheiro da empresa. (+10 Energia)");
                                }
                                game.updateUI();
                                game.renderActions();
                            });
                        }
                    },
                    {
                        label: "🚽 Fazer Necessidades",
                        costEnergy: 5,
                        costHours: 0.5,
                        execute: (game) => {
                            game.player.modifyEnergy(5);
                            game.time.advanceTime(0.5, game);
                            game.log("🚽 Você usou o banheiro do escritório.");
                            game.updateUI();
                        }
                    }
                ]
            }
        }
    },

    // 🛒 AMBIENTE: O MERCADO
    mercado: {
        name: "🛒 Mercado",
        isEnvironment: true,
        subRooms: {
            roupas: {
                name: "Loja de Roupas",
                actions: []
            },
            comida: {
                name: "Mercearia (Comida)",
                actions: []
            }
        }
    },

    imobiliaria: {
        name: "🏗️ Imobiliária & Construtora",
        isEnvironment: true,
        subRooms: {
            reformas: {
                name: "Reformas e Melhorias",
                actions: [
                    {
                        label: "🌿 Construir Pátio com Jardim (R$ 200 | +R$ 50 aluguel)",
                        upgradeId: "patio",
                        price: 200,
                        costEnergy: -5,
                        costHours: 1,
                        execute: (game) => buyHouseUpgrade(game, "patio", "Pátio com Jardim", 200)
                    },
                    {
                        label: "🏊 Construir Área da Piscina (R$ 1000 | +R$ 100 aluguel)",
                        upgradeId: "piscina",
                        price: 1000,
                        costEnergy: -5,
                        costHours: 1,
                        execute: (game) => buyHouseUpgrade(game, "piscina", "Área da Piscina", 1000)
                    }
                ]
            }
        }
    },

    petshop: {
        name: "🐾 Pet Shop",
        isEnvironment: true,
        subRooms: {
            balcao: {
                name: "Balcão",
                actions: [
                    {
                        label: "🐶 Brincar com os Filhotinhos",
                        costEnergy: -10,
                        costHours: 1,
                        execute: (game) => {
                            if (game.player.energy < 10) {
                                game.log("🚫 Energia insuficiente para brincar com os filhotinhos.");
                                return;
                            }
                            game.player.modifyEnergy(-10);
                            game.time.advanceTime(1, game);
                            if (game.player.pet) {
                                game.player.modifyPetStat("happiness", 10);
                                game.log(`🐾 Você brincou com os filhotinhos e ${game.player.pet.name} adorou! (-10 Energia, +10 Felicidade do Pet)`);
                            } else {
                                game.log("🐾 Você brincou com os filhotinhos no Pet Shop! (-10 Energia)");
                            }
                        }
                    }
                ]
            },
            vitrine: {
                name: "Vitrine",
                actions: [
                    {
                        label: "🐶 Adotar Cachorro (R$ 300)",
                        costEnergy: 0,
                        costHours: 0,
                        execute: (game) => adoptPetFromShop(game, "Cachorro", 300, "Rex")
                    },
                    {
                        label: "🐱 Adotar Gato (R$ 250)",
                        costEnergy: 0,
                        costHours: 0,
                        execute: (game) => adoptPetFromShop(game, "Gato", 250, "Mimi")
                    }
                ]
            },
            loja: {
                name: "Loja",
                actions: [
                    {
                        label: "🦴 Comprar Ração para Pet (R$ 25)",
                        costEnergy: 0,
                        costHours: 0,
                        execute: (game) => buyPetItem(
                            game,
                            25,
                            "🦴 Você comprou 1x Ração para Pet!",
                            (pet) => { pet.foodStock += 1; }
                        )
                    },
                    {
                        label: "🧥 Comprar Colete Pet (R$ 60)",
                        costEnergy: 0,
                        costHours: 0,
                        execute: (game) => buyPetItem(
                            game,
                            60,
                            "🧥 Você comprou e equipou o **Colete Pet**!",
                            (pet) => { pet.outfit = "Colete Pet"; }
                        )
                    },
                    {
                        label: "🎀 Comprar Coleira Estilosa (R$ 40)",
                        costEnergy: 0,
                        costHours: 0,
                        execute: (game) => buyPetItem(
                            game,
                            40,
                            "🎀 Você comprou e equipou a **Coleira Estilosa**!",
                            (pet) => { pet.accessory = "Coleira Estilosa"; }
                        )
                    }
                ]
            },
            banho_tosa: {
                name: "Banho e Tosa",
                actions: [
                    {
                        label: "🛁 Dar Banho no Pet (R$ 40)",
                        costEnergy: 0,
                        costHours: 1,
                        execute: (game) => {
                            if (!game.player.pet) {
                                game.log("🚫 Você precisa ter um pet para usar o Banho e Tosa!");
                                return;
                            }
                            if (game.player.money < 40) {
                                game.log("❌ Dinheiro insuficiente! O banho custa R$ 40.");
                                return;
                            }
                            game.player.money -= 40;
                            game.time.advanceTime(1, game);
                            game.player.modifyPetStat("hygiene", 60);
                            game.player.modifyPetStat("happiness", 10);
                            game.log(`🛁 **${game.player.pet.name}** tomou um banho cheiroso! (+60 Higiene, +10 Felicidade)`);
                        }
                    }
                ]
            }
        }
    },

    cabeleireiro: {
        name: "💇 Cabeleireiro",
        isEnvironment: true,
        subRooms: {
            corte: {
                name: "Corte de Cabelo",
                actions: buildHairActions(
                    [
                        ["curto", "Curto", "✂️"],
                        ["medio", "Médio", "✂️"],
                        ["longo", "Longo", "✂️"],
                        ["cacheado", "Cacheado", "✂️"],
                        ["crespo", "Crespo", "✂️"],
                        ["careca", "Careca", "✂️"]
                    ],
                    "hairStyle",
                    40,
                    null,
                    (game, id, label) => {
                        minigame.openHaircutGame(id, game.player.hairColor, (success, canceled) => {
                            if (canceled) {
                                game.log("✂️ Você desistiu do corte de cabelo.");
                                return;
                            }
                            if (!success) return;
                            game.player.money -= 40;
                            game.time.advanceTime(1, game);
                            game.player.setHair(id, null);
                            game.log(`✂️ Visual atualizado para **${label}**! (-R$ 40)`);
                            game.updateUI();
                            game.renderActions();
                        });
                    }
                )
            },
            tintura: {
                name: "Coloração",
                actions: buildHairActions(
                    [
                        ["preto", "Preto", "🎨"],
                        ["castanho", "Castanho", "🎨"],
                        ["loiro", "Loiro", "🎨"],
                        ["ruivo", "Ruivo", "🎨"],
                        ["grisalho", "Grisalho", "🎨"],
                        ["colorido", "Colorido", "🎨"]
                    ],
                    "hairColor",
                    50,
                    (game, id) => game.player.setHair(null, id)
                )
            }
        }
    }
};
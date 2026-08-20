// ==========================================
// AMBIENTES E SUBROOMS (CÔMODOS)
// ==========================================
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
    }
};
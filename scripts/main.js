const GENDER_LABELS = {
    masculino: "Masculino",
    feminino: "Feminino",
    outro: "Outro / Não-binário"
};

const ENV_TITLES = {
    casa: "🏠 Casa",
    academia: "🏋️ Academia",
    trabalho: "💼 Trabalho",
    mercado: "🛒 Mercado",
    imobiliaria: "🏗️ Imobiliária",
    petshop: "🐾 Pet Shop"
};

const INDECENT_OUTFITS = ["pijama", "praia", "fantasia"];

// ==========================================
// MOTOR DO JOGO (GERENCIADOR)
// ==========================================
class GameEngine {
    constructor(playerName = "Alex", playerGender = "masculino", savedData = null) {
        this.player = new Player(playerName, playerGender);
        this.time = new TimeSystem();
        
        // Controle de localização atualizada
        this.currentEnvironment = "casa";
        this.currentSubRoom = "quarto"; // Começa no quarto apenas no início
        this.isFirstLoad = true; // Controla se é a primeira entrada no jogo
        
        this.isGameOver = false;

        if (savedData) {
            this.restoreState(savedData);
        } else {
            this.initUI();
        }
    }

    static fromSave(data) {
        return new GameEngine(data.player.name, data.player.gender, data);
    }

    restoreState(data) {
        const toNum = (val, fallback) => (val === null || val === "" || typeof val === "boolean" || !Number.isFinite(Number(val)))
            ? fallback
            : Number(val);

        Object.assign(this.player, {
            name: data.player.name,
            gender: data.player.gender || "masculino",
            energy: toNum(data.player.energy, this.player.energy),
            maxEnergy: toNum(data.player.maxEnergy, this.player.maxEnergy),
            hunger: toNum(data.player.hunger, this.player.hunger),
            money: toNum(data.player.money, this.player.money),
            fat: toNum(data.player.fat, this.player.fat),
            muscle: toNum(data.player.muscle, this.player.muscle),
            isEmployed: Boolean(data.player.isEmployed),
            taskQueue: toNum(data.player.taskQueue, 0),
            houseUpgrades: { patio: false, piscina: false, ...(data.player.houseUpgrades || {}) },
            pet: data.player.pet && typeof data.player.pet === "object"
                ? {
                    type: data.player.pet.type || "Cachorro",
                    name: data.player.pet.name || "Rex",
                    energy: toNum(data.player.pet.energy, 100),
                    hunger: toNum(data.player.pet.hunger, 0),
                    hygiene: toNum(data.player.pet.hygiene, 100),
                    happiness: toNum(data.player.pet.happiness, 100),
                    foodStock: toNum(data.player.pet.foodStock, 0),
                    outfit: data.player.pet.outfit || "Nenhuma",
                    accessory: data.player.pet.accessory || "Nenhum"
                }
                : null
        });
        this.player.setClothes(data.player.clothes || "pijama");

        const timeData = data.time || {};
        Object.assign(this.time, {
            day: toNum(timeData.day, this.time.day) || 1,
            hour: toNum(timeData.hour, this.time.hour),
            minute: toNum(timeData.minute, this.time.minute)
        });
        this.time.updateRentCost(this.player);

        const ownedSet = new Set(Array.isArray(data.ownedOutfits) ? data.ownedOutfits : ["pijama", "casual"]);
        wardrobeOptions.forEach(outfit => {
            outfit.owned = ownedSet.has(outfit.id);
        });

        const foodStock = data.foodStock || {};
        market.catalog.comida.forEach(item => {
            item.stock = Number(foodStock[item.id]) || 0;
        });

        const loc = data.location || {};
        const env = rooms[loc.currentEnvironment] ? loc.currentEnvironment : "casa";
        const envData = rooms[env];
        let sub = loc.currentSubRoom;

        if (envData.isEnvironment) {
            if (!sub || !envData.subRooms[sub]) {
                sub = Object.keys(envData.subRooms)[0];
            }
            const envPrefix = ENV_TITLES[env] || env;
            document.getElementById("room-title").innerText = `${envPrefix} - ${envData.subRooms[sub].name}`;
        }

        this.currentEnvironment = env;
        this.currentSubRoom = sub;
        this.isFirstLoad = false;
        this.isGameOver = false;

        document.getElementById("log").innerHTML = "";
        this.updateUI();
        this.renderActions();
        this.renderSubRoomsNavigation();
        this.log("💾 Jogo importado com sucesso!");
    }

    initUI() {
        this.updateUI();
        this.changeLocation("casa", "quarto");
        this.isFirstLoad = false; // A partir daqui, entrar na casa vai direto pra sala
        const greeting = this.player.gender === "feminino"
            ? "Bem-vinda"
            : (this.player.gender === "masculino" ? "Bem-vindo" : "Bem-vindo(a)");
        this.log(`${greeting}, ${this.player.name}! Lembre-se de juntar R$ ${this.time.rentCost} para o aluguel a cada 7 dias!`);
    }

    // Função unificada para mudar de lugar com log de origem e destino
    changeLocation(envKey, subRoomKey = null) {
        if (this.isGameOver) return;

        // Validações de horário e vestuário para a Academia
        if (envKey === "academia") {
            if (this.time.hour < 8 || this.time.hour >= 20) {
                this.log("🏋️ **ACADEMIA FECHADA!** O horário é das 08:00 às 20:00.");
                return;
            }
            // Verifica se está usando a roupa esportiva (id: "esporte")
            if (!this.player.hasOutfit("esporte") || this.player.clothes !== "esporte") {
                this.log("🚫 **ENTRADA PROIBIDA!** Você precisa estar vestindo a Roupa Esportiva 🏃 para entrar na academia.");
                return;
            }
        }

        if (envKey === "mercado") {
            if (INDECENT_OUTFITS.includes(this.player.clothes)) {
                this.log("🚫 **ENTRADA PROIBIDA!** Você precisa estar vestindo uma roupa adequada para entrar no mercado.");
                return;
            }
        }

        if (envKey === "imobiliaria") {
            if (this.time.hour < 9 || this.time.hour >= 18) {
                this.log("🏗️ **IMOBILIÁRIA FECHADA!** O horário de funcionamento é das 09:00 às 18:00.");
                return;
            }
            if (INDECENT_OUTFITS.includes(this.player.clothes)) {
                this.log("🚫 **ENTRADA PROIBIDA!** Você precisa estar vestindo uma roupa decente para entrar na imobiliária.");
                return;
            }
        }

        if (envKey === "petshop") {
            if (this.time.hour < 9 || this.time.hour >= 18) {
                this.log("🐾 **PET SHOP FECHADO!** O horário de funcionamento é das 09:00 às 18:00.");
                return;
            }
            if (INDECENT_OUTFITS.includes(this.player.clothes)) {
                this.log("🚫 **ENTRADA PROIBIDA!** Você precisa estar vestindo uma roupa adequada para entrar no Pet Shop.");
                return;
            }
        }

        // Validações de horário e vestuário para o Trabalho
        if (envKey === "trabalho") {
            if (this.time.hour < 9 || this.time.hour >= 18) {
                this.log("🕒 **ESCRITÓRIO FECHADO!** O expediente é das 09:00 às 18:00.");
                return;
            }
            
            const allowedWorkOutfits = ["casual", "terno", "trabalho_pesado"];

            if (!allowedWorkOutfits.includes(this.player.clothes)) {
                this.log("👔 **DRESS CODE RECUSADO!** Você não pode trabalhar vestindo isso. Use roupas casuais, terno ou macacão de trabalho.");
                return;
            }
        }

        if (rooms[envKey]) {
            let targetSubRoom = subRoomKey;
            if (rooms[envKey].isEnvironment) {
                if (!targetSubRoom || !rooms[envKey].subRooms[targetSubRoom]) {
                    targetSubRoom = envKey === "casa" ? "sala" : Object.keys(rooms[envKey].subRooms)[0];
                }
                const subRoom = rooms[envKey].subRooms[targetSubRoom];
                if (subRoom.requiresUpgrade && !this.player.hasHouseUpgrade(subRoom.requiresUpgrade)) {
                    this.log("🔒 **CÔMODO BLOQUEADO!** Compre esta melhoria na Imobiliária.");
                    return;
                }
            }

            // Descobre o nome do local de origem para o log
            const originName = this.getCurrentLocationName();

            this.currentEnvironment = envKey;

            if (rooms[envKey].isEnvironment) {
                this.currentSubRoom = targetSubRoom;
                const roomName = rooms[envKey].subRooms[this.currentSubRoom].name;
                const envPrefix = ENV_TITLES[envKey] || envKey;
                document.getElementById("room-title").innerText = `${envPrefix} - ${roomName}`;
            }

            // Descobre o nome do destino e gera o log de movimentação
            const destinationName = this.getCurrentLocationName();
            if (!this.isFirstLoad && originName !== destinationName) {
                this.log(`🚶 Você saiu de **${originName}** e foi para **${destinationName}**.`);
            }

            this.updateUI();
            this.renderActions();
            this.renderSubRoomsNavigation(); 
        }
    }

    // Auxiliar para pegar o nome legível do local atual
    getCurrentLocationName() {
        const env = rooms[this.currentEnvironment];
        if (env.isEnvironment) {
            const subName = env.subRooms[this.currentSubRoom].name;
            return `${env.name} (${subName})`;
        }
        return env.name;
    }

    // Atalho de compatibilidade
    changeRoom(envKey, subRoomKey = null) {
        this.changeLocation(envKey, subRoomKey);
    }

    // Renderiza subquartos
    renderSubRoomsNavigation() {
        let navContainer = document.getElementById("subroom-nav-container");
        
        if (!navContainer) {
            navContainer = document.createElement("div");
            navContainer.id = "subroom-nav-container";
            navContainer.className = "subroom-menu";
            const titleEl = document.getElementById("room-title");
            titleEl.parentNode.insertBefore(navContainer, titleEl.nextSibling);
        }

        navContainer.innerHTML = "";

        const currentEnv = rooms[this.currentEnvironment];

        // Se o ambiente atual possuir subcômodos (isEnvironment), renderiza o menu de navegação deles
        if (currentEnv && currentEnv.isEnvironment && currentEnv.subRooms) {
            navContainer.style.display = "flex";
            navContainer.style.gap = "10px";
            navContainer.style.margin = "10px 0";
            
            const subRooms = currentEnv.subRooms;

            Object.keys(subRooms).forEach(subKey => {
                const subRoom = subRooms[subKey];
                const isLocked = Boolean(subRoom.requiresUpgrade && !this.player.hasHouseUpgrade(subRoom.requiresUpgrade));
                const btn = document.createElement("button");
                btn.className = "subroom-btn";
                btn.innerText = isLocked ? `🔒 ${subRoom.name}` : subRoom.name;

                btn.style.padding = "8px 14px";
                btn.style.cursor = "pointer";
                btn.style.borderRadius = "4px";
                btn.style.border = "1px solid #444";

                if (isLocked) {
                    btn.style.background = "#2c3e50";
                    btn.style.color = "#ecf0f1";
                    btn.style.opacity = "0.5";
                    btn.style.cursor = "not-allowed";
                    btn.disabled = true;
                } else if (this.currentSubRoom === subKey) {
                    btn.style.background = "#27ae60"; // Destaque para o cômodo atual
                    btn.style.color = "#fff";
                    btn.disabled = true;
                } else {
                    btn.style.background = "#2c3e50";
                    btn.style.color = "#ecf0f1";
                }

                btn.onclick = () => {
                    this.changeLocation(this.currentEnvironment, subKey);
                };

                navContainer.appendChild(btn);
            });
        } else {
            navContainer.style.display = "none";
        }
    }

    openWardrobe() {
        const container = document.getElementById("wardrobe-options-container");
        container.innerHTML = "";

        // Filtra apenas as roupas que o jogador possui (owned === true)
        const ownedOutfits = wardrobeOptions.filter(outfit => outfit.owned);

        ownedOutfits.forEach(outfit => {
            const btn = document.createElement("button");
            btn.className = "wardrobe-btn";
            btn.innerText = outfit.name;
            
            if (this.player.clothes === outfit.id) {
                btn.innerText += " (Em uso)";
                btn.style.borderColor = "#27ae60";
            }

            btn.onclick = () => {
                this.player.setClothes(outfit.id);
                this.log(`👕 Você trocou de roupa e agora está vestindo **${outfit.name}**.`);
                this.updateUI();
                this.closeWardrobe();
            };

            container.appendChild(btn);
        });

        document.getElementById("wardrobe-modal").style.display = "flex";
    }

    closeWardrobe() {
        document.getElementById("wardrobe-modal").style.display = "none";
    }

    checkStatusConditions() {
        if (this.player.hunger >= 100) {
            this.triggerGameOver("Sua fome atingiu 100% e você desmaiou de inanição!");
        }
    }

    checkJobStatus() {
        if (this.player.isEmployed && this.player.taskQueue >= 10) {
            this.player.isEmployed = false;
            this.player.taskQueue = 0;
            this.log("⚠️ **VOCÊ FOI DEMITIDO!** A sua pilha acumulou 10 ou mais tarefas pendentes.");
            
            if (this.currentEnvironment === "trabalho") {
                this.changeLocation("casa", "sala"); 
            }
        }
    }

    searchForJob() {
        if (this.player.isEmployed) {
            this.log("💼 Você já possui um emprego atualmente!");
            return;
        }
        // Consome 10 de energia e avança 2 horas
        this.player.modifyEnergy(-10);
        this.time.advanceTime(2, this);

        // Contrata o player e define tarefas iniciais
        this.player.isEmployed = true;
        this.player.taskQueue = Math.floor(Math.random() * 2) + 1; // Começa com 1 ou 2 tarefas pendentes

        this.log("🎉 **PARABÉNS!** Você conseguiu um emprego após procurar vagas. O expediente é das 09:00 às 18:00.");
        this.updateUI();
        this.renderActions();
    }

    triggerGameOver(reason) {
        this.isGameOver = true;
        document.getElementById("gameover-modal").style.display = "flex";
        document.getElementById("gameover-reason").innerText = reason;
    }

    renderActions() {
        if (this.isGameOver) return;

        const actionsContainer = document.getElementById("actions");
        actionsContainer.innerHTML = "";

        let currentActions = [];
        if (rooms[this.currentEnvironment].isEnvironment) {
            // Integração dinâmica do Mercado e Cozinha
            if (this.currentEnvironment === "mercado") {
                if (this.currentSubRoom === "roupas") {
                    currentActions = market.getClothingActions(this);
                } else if (this.currentSubRoom === "comida") {
                    currentActions = market.getFoodActions(this);
                }
            } else if (this.currentEnvironment === "casa" && this.currentSubRoom === "cozinha") {
                currentActions = market.getKitchenFoodActions(this);
            } else {
                currentActions = rooms[this.currentEnvironment].subRooms[this.currentSubRoom].actions;
            }
        } else {
            currentActions = rooms[this.currentEnvironment].actions;
        }

        currentActions.forEach(action => {
            if (action.requiresPet && !this.player.pet) return;

            const btn = document.createElement("button");
            btn.innerText = `${action.label}` + (action.costHours > 0 ? ` ⏱️ (${action.costHours}h)` : "");

            let cannotExecute = false;
            let disabledReason = "";

            if (action.upgradeId && this.player.hasHouseUpgrade(action.upgradeId)) {
                cannotExecute = true;
                disabledReason = " - [Já Construído]";
            } else if (action.costEnergy < 0 && this.player.energy < Math.abs(action.costEnergy)) {
                cannotExecute = true;
                disabledReason = " - [Sem Energia]";
            } else if (action.petEnergyCost && this.player.pet && this.player.pet.energy < action.petEnergyCost) {
                cannotExecute = true;
                disabledReason = " - [Pet Sem Energia]";
            }

            if (this.currentEnvironment === "trabalho" && action.requiresPendingTasks && this.player.taskQueue <= 0) {
                cannotExecute = true;
                disabledReason = " - [Sem Tarefas]";
            }

            if (this.currentEnvironment === "academia") {
                if (this.time.hour + action.costHours > 20) {
                    cannotExecute = true;
                    disabledReason = " - [Estoura o horário de fechamento (20h)]";
                }
            }

            if (this.currentEnvironment === "trabalho" && action.isWorkTask) {
                if (this.time.hour < 9 || this.time.hour >= 18) {
                    cannotExecute = true;
                    disabledReason = " - [Fora do Expediente (09h-18h)]";
                }
            }

            btn.disabled = cannotExecute;
            if (cannotExecute) {
                btn.innerText += disabledReason;
            }

            btn.onclick = () => {
                action.execute(this);
                this.updateUI();
                this.renderActions();
            };

            actionsContainer.appendChild(btn);
        });
    }

    updateUI() {
        document.getElementById("p-name").innerText = this.player.name;
        document.getElementById("p-gender").innerText = GENDER_LABELS[this.player.gender] || this.player.gender;
        document.getElementById("p-energy").innerText = this.player.energy;
        document.getElementById("p-hunger").innerText = this.player.hunger;
        document.getElementById("p-money").innerText = this.player.money;
        document.getElementById("p-clothes").innerText = this.player.getClothesName();

        const bodyInfo = this.player.getBodyTypeInfo();
        document.getElementById("p-body-type").innerText = bodyInfo.display_name;
        document.getElementById("p-body-desc").innerText = bodyInfo.description;
        document.getElementById("p-muscle").innerText = this.player.muscle;
        document.getElementById("p-fat").innerText = this.player.fat;

        const jobPanel = document.getElementById("job-info-panel");
        if (this.player.isEmployed) {
            jobPanel.innerHTML = `<strong>Status Profissional:</strong> Empregado | <strong>Tarefas Acumuladas:</strong> ${this.player.taskQueue}/10 (⚠️ Demissão aos 10) | <strong>Expediente:</strong> 09:00 às 18:00`;
        } else {
            jobPanel.innerHTML = `<strong>Status Profissional:</strong> Desempregado`;
        }

        const btnTrabalho = document.getElementById("nav-trabalho");
        btnTrabalho.style.display = this.player.isEmployed ? "inline-block" : "none";

        document.getElementById("t-day").innerText = this.time.day;
        document.getElementById("t-hour").innerText = `${String(this.time.hour).padStart(2, '0')}:${String(this.time.minute).padStart(2, '0')}`;
        document.getElementById("t-rent-day").innerText = this.time.getNextRentDay();
        document.getElementById("t-rent-cost").innerText = this.time.rentCost;

        const petPanel = document.getElementById("pet-status-panel");
        if (petPanel) {
            if (!this.player.pet) {
                petPanel.style.display = "none";
            } else {
                const pet = this.player.pet;
                petPanel.style.display = "block";
                document.getElementById("pet-name").innerText = `${pet.type} - ${pet.name}`;
                document.getElementById("pet-food").innerText = pet.foodStock;
                document.getElementById("pet-outfit").innerText = pet.outfit;
                document.getElementById("pet-accessory").innerText = pet.accessory;
                for (const stat of ["energy", "hunger", "hygiene", "happiness"]) {
                    document.getElementById(`pet-${stat}-bar`).value = pet[stat];
                    document.getElementById(`pet-${stat}-val`).innerText = pet[stat];
                }
            }
        }
    }

    feedPet() {
        if (this.isGameOver || !this.player.pet) return;
        if (this.player.pet.foodStock <= 0) {
            this.log("🚫 Você não tem ração! Compre no Pet Shop.");
            return;
        }
        this.player.pet.foodStock -= 1;
        this.player.modifyPetStat("hunger", -30);
        this.player.modifyPetStat("energy", 10);
        this.player.modifyPetStat("happiness", 5);
        this.log(`🍖 Você alimentou **${this.player.pet.name}**! (-30 Fome, +10 Energia, +5 Felicidade)`);
        this.updateUI();
    }

    renamePet(newName) {
        if (this.isGameOver || !this.player.pet) return;
        const input = newName !== undefined
            ? newName
            : (typeof prompt === "function" ? prompt("Novo nome para o pet:", this.player.pet.name) : "");
        if (this.player.renamePet(input)) {
            this.log(`✏️ Seu pet agora se chama **${this.player.pet.name}**!`);
            this.updateUI();
        }
    }

    log(message) {
        const logBox = document.getElementById("log");
        const formattedMessage = message.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        logBox.innerHTML = `<p>• ${formattedMessage}</p>${logBox.innerHTML}`;
        logBox.scrollTop = 0;
    }
}

let game = null;

function showCharacterCreation() {
    document.getElementById("start-menu-step").style.display = "none";
    document.getElementById("character-creation-step").style.display = "block";
    document.getElementById("creation-error").style.display = "none";
    document.getElementById("input-name").focus();
}

function backToStartMenu() {
    document.getElementById("character-creation-step").style.display = "none";
    document.getElementById("import-game-step").style.display = "none";
    document.getElementById("start-menu-step").style.display = "block";
    document.getElementById("creation-error").style.display = "none";
    document.getElementById("import-error").style.display = "none";
}

function showImportStep() {
    document.getElementById("start-menu-step").style.display = "none";
    document.getElementById("import-game-step").style.display = "block";
    document.getElementById("import-error").style.display = "none";
    document.getElementById("import-code").value = "";
    document.getElementById("import-file").value = "";
    document.getElementById("import-code").focus();
}

function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById("import-code").value = String(e.target.result || "").trim();
        document.getElementById("import-error").style.display = "none";
    };
    reader.readAsText(file);
}

function importSavedGame() {
    const code = document.getElementById("import-code").value;
    const errorEl = document.getElementById("import-error");

    let data;
    try {
        data = importSaveState(code);
    } catch (err) {
        errorEl.innerText = err.message;
        errorEl.style.display = "block";
        return;
    }

    errorEl.style.display = "none";
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-container").style.display = "block";

    game = GameEngine.fromSave(data);
}

function openSettingsModal() {
    if (!game) return;
    document.getElementById("export-code").value = exportSaveState(game, wardrobeOptions, market.catalog);
    document.getElementById("settings-modal").style.display = "flex";
}

function closeSettingsModal() {
    document.getElementById("settings-modal").style.display = "none";
}

function resetGlobalGameState() {
    wardrobeOptions.forEach(item => {
        item.owned = item.price === 0;
    });
    market.catalog.comida.forEach(item => {
        item.stock = 0;
    });

    document.getElementById("log").innerHTML = "";
    document.getElementById("input-name").value = "";
    document.getElementById("import-code").value = "";
    const importFile = document.getElementById("import-file");
    if (importFile) importFile.value = "";

    ["settings-modal", "wardrobe-modal", "gameover-modal"].forEach(id => {
        document.getElementById(id).style.display = "none";
    });
    game = null;
}

function exitToStartScreen() {
    if (!confirm("Voltar para a tela inicial? Todo progresso não exportado será perdido.")) return;

    resetGlobalGameState();
    document.getElementById("game-container").style.display = "none";
    document.getElementById("start-screen").style.display = "block";
    backToStartMenu();
}

function copySaveCode() {
    const exportEl = document.getElementById("export-code");
    if (!exportEl.value) return;

    const logCopied = () => {
        if (game) game.log("📋 Código de save copiado para a área de transferência!");
    };
    const fallbackCopy = () => {
        exportEl.select();
        document.execCommand("copy");
        logCopied();
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(exportEl.value).then(logCopied).catch(fallbackCopy);
        return;
    }
    fallbackCopy();
}

function downloadSaveFile() {
    const code = document.getElementById("export-code").value;
    if (!code) return;

    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = (game?.player?.name || "save").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.href = url;
    link.download = `life-sandbox-${safeName}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (game) game.log("💾 Arquivo de save baixado!");
}

function startNewGame() {
    const name = document.getElementById("input-name").value.trim();
    const errorEl = document.getElementById("creation-error");

    if (!name) {
        errorEl.innerText = "Por favor, digite um nome para continuar.";
        errorEl.style.display = "block";
        return;
    }

    const gender = document.getElementById("input-gender").value;
    errorEl.style.display = "none";
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-container").style.display = "block";

    game = new GameEngine(name, gender);
}
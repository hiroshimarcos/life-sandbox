// ==========================================
// MOTOR DO JOGO (GERENCIADOR)
// ==========================================
class GameEngine {
    constructor() {
        this.player = new Player("Alex");
        this.time = new TimeSystem();
        
        // Controle de localização atualizada
        this.currentEnvironment = "casa";
        this.currentSubRoom = "quarto"; // Começa no quarto apenas no início
        this.isFirstLoad = true; // Controla se é a primeira entrada no jogo
        
        this.isGameOver = false;

        this.initUI();
    }

    initUI() {
        this.updateUI();
        this.changeLocation("casa", "quarto");
        this.isFirstLoad = false; // A partir daqui, entrar na casa vai direto pra sala
        this.log("Bem-vindo! Lembre-se de juntar R$ 150 para o aluguel a cada 7 dias!");
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
            if (!this.player.hasOutfit("esporte") || this.player.clothes !== "Roupa Esportiva 🏃") {
                this.log("🚫 **ENTRADA PROIBIDA!** Você precisa estar vestindo a Roupa Esportiva 🏃 para entrar na academia.");
                return;
            }
        }

        // Validações de vestuário para a Mercado
        if (envKey === "mercado") {

            const notAllowedMarketOutfits = [
                "Pijama 🛌",
                "Roupa de Praia 🌴",
                "Fantasia de Super-herói 🦸",
            ];
            // Verifica se está usando alguma roupa adequada
            if (notAllowedMarketOutfits.includes(this.player.clothes)) {
                this.log("🚫 **ENTRADA PROIBIDA!** Você precisa estar vestindo uma roupa adequada para entrar no mercado.");
                return;
            }
        }

        // Validações de horário e vestuário para o Trabalho
        if (envKey === "trabalho") {
            if (this.time.hour < 9 || this.time.hour >= 18) {
                this.log("🕒 **ESCRITÓRIO FECHADO!** O expediente é das 09:00 às 18:00.");
                return;
            }
            
            // Roupas permitidas no trabalho: casual, terno, trabalho_pesado
            // Verificamos com base no nome exibido atual ou no ID armazenado no player
            const allowedWorkOutfits = [
                "Camiseta e Jeans 👕", 
                "Terno Completo 💼", 
                "Macacão de Trabalho 🛠️"
            ];

            if (!allowedWorkOutfits.includes(this.player.clothes)) {
                this.log("👔 **DRESS CODE RECUSADO!** Você não pode trabalhar vestindo isso. Use roupas casuais, terno ou macacão de trabalho.");
                return;
            }
        }

        if (rooms[envKey]) {
            // Descobre o nome do local de origem para o log
            const originName = this.getCurrentLocationName();

            this.currentEnvironment = envKey;

            if (rooms[envKey].isEnvironment) {
                // Se um subcômodo foi passado explicitamente, usa ele.
                if (subRoomKey && rooms[envKey].subRooms[subRoomKey]) {
                    this.currentSubRoom = subRoomKey;
                } else {
                    // Se for a Casa, define explicitamente a sala como padrão. Nos outros, pega o primeiro.
                    if (envKey === "casa") {
                        this.currentSubRoom = "sala";
                    } else {
                        const keys = Object.keys(rooms[envKey].subRooms);
                        this.currentSubRoom = keys[0]; 
                    }
                }

                const roomName = rooms[envKey].subRooms[this.currentSubRoom].name;
                const envPrefix = envKey === "casa" ? "🏠 Casa" : (envKey === "academia" ? "🏋️ Academia" : (envKey === "trabalho" ? "💼 Trabalho" : "🛒 Mercado"));
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
        if (rooms[this.currentEnvironment].isEnvironment) {
            const subName = rooms[this.currentEnvironment].subRooms[this.currentSubRoom].name;
            return `Casa (${subName})`;
        } else {
            return rooms[this.currentEnvironment].name;
        }
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
                const btn = document.createElement("button");
                btn.className = "subroom-btn";
                btn.innerText = subRooms[subKey].name; // Nome do cômodo (ex: Quarto, Banheiro, Pátio, Escritório)
                
                btn.style.padding = "8px 14px";
                btn.style.cursor = "pointer";
                btn.style.borderRadius = "4px";
                btn.style.border = "1px solid #444";

                if (this.currentSubRoom === subKey) {
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
            
            if (this.player.clothes === outfit.name) {
                btn.innerText += " (Em uso)";
                btn.style.borderColor = "#27ae60";
            }

            btn.onclick = () => {
                this.player.setClothes(outfit.name);
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
            const btn = document.createElement("button");
            btn.innerText = `${action.label}` + (action.costHours > 0 ? ` ⏱️ (${action.costHours}h)` : "");

            let cannotExecute = false;
            let disabledReason = "";

            if (action.costEnergy < 0 && this.player.energy < Math.abs(action.costEnergy)) {
                cannotExecute = true;
                disabledReason = " - [Sem Energia]";
            }

            if (this.currentEnvironment === "trabalho" && action.label.includes("Executar Tarefa") && this.player.taskQueue <= 0) {
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
        document.getElementById("p-energy").innerText = this.player.energy;
        document.getElementById("p-hunger").innerText = this.player.hunger;
        document.getElementById("p-money").innerText = this.player.money;
        document.getElementById("p-clothes").innerText = this.player.clothes;

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
    }

    log(message) {
        const logBox = document.getElementById("log");
        logBox.innerHTML += `<p>• ${message}</p>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
}

// Inicializa o jogo
const game = new GameEngine();